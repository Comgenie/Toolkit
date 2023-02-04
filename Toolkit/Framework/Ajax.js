"use strict";
/* Minify Order(5) */

window.ajax = function () {
    var obj = this;
    this.timeout = 30000;
    this.timeoutChecker = null;
    this.ajaxObject = null;
    this.busy = false;
    this.queue = [];
    this.currentRequestInfo = null; // url, callback etc.
    this.retryCount = 0;
    this.maxRetries = 3;
    this.cached = {};
    this.allowEmptyResponse = false;
    this.showServerErrors = true;
    this.saveResults = false;
    this.cacheResults = false;
    this.executeScriptTags = true;
    this.parseJSONResponse = false;
    this.errorHandler = null; // function(statusCode,responseText) {}
    this.extraHeaders = []; // [ ["Content-Type", "application/json"] ]
    this.beforeRequest = null; // function(requestInfo, callBackExecuteRequest(requestInfo) ) {}

    this.getSetting = function (name, requestInfo) {
        if (!requestInfo)
            requestInfo = this.currentRequestInfo;
        if (requestInfo && requestInfo.extraSettings && requestInfo.extraSettings[name] !== undefined) {
            return requestInfo.extraSettings[name];
        }
        return this[name];
    };
    this.initComponent = function () {
        this.ajaxObject = this.getAvailableAjaxObject();
        if (!this.ajaxObject) // could not init any ajax object
            return;

        // set event handlers
        this.ajaxObject.onreadystatechange = function () {
            if (obj.ajaxObject.readyState !== 4 || obj.ajaxObject.status == 0)
                return;

            if (obj.timeoutChecker) {
                clearTimeout(obj.timeoutChecker);
                obj.timeoutChecker = null;
            }

            if (obj.ajaxObject.status !== 200) {
                if (obj.ajaxObject.status >= 400) {
                    var errorHandler = obj.getSetting("errorHandler");
                    if (errorHandler)
                        errorHandler(obj.ajaxObject.status, obj.ajaxObject.responseText);
                    else if (obj.getSetting("showServerErrors"))
                        alert('Server error, returned code: ' + obj.ajaxObject.status); // mostly unrecoverable server error
                    obj.nextRequest();
                } else
                    obj.retryLast(); // retry, sometimes IE returns some unusual number for failed requests
                return;
            }
            var responseIsText = (!obj.ajaxObject.responseType || obj.ajaxObject.responseType === "" || obj.ajaxObject.responseType == "text");

            try {
                // Response is required since bad requests can sometimes give an empty response
                if (responseIsText && obj.ajaxObject.responseText == "" && !obj.getSetting("allowEmptyResponse")) {
                    obj.retryLast();
                    return;
                }
            } catch (r) {
                obj.retryLast(); // Sometimes the responseText is unreadable, also retry
                return;
            }

            // Everything seems to be ok! 
            obj.retryCount = 0;

            if (responseIsText && obj.getSetting("saveResults")) {
                window.localStorage["page" + obj.hashString(obj.currentRequestInfo.get)] = obj.ajaxObject.responseText;
            }
            if (responseIsText && obj.getSetting("cacheResults")) {
                obj.cached["page" + obj.hashString(obj.currentRequestInfo.get)] = obj.ajaxObject.responseText;
            }

            // check for callback
            if (obj.currentRequestInfo.callBack) {
                // make a copy since the callback is called in timeout (currentRequestInfo can be changed)
                var copyCurrentRequestInfo = obj.currentRequestInfo;
                var responseData = null;
                if (responseIsText) {
                    responseData = obj.ajaxObject.responseText;
                    if (obj.getSetting("parseJSONResponse") && responseData && (responseData.substr(0, 1) == "{" || responseData.substr(0, 1) == "\"" || responseData.substr(0, 1) == "[")) {
                        responseData = JSON.parse(responseData);
                    }
                } else {
                    responseData = obj.ajaxObject.response;
                }

                // Do this as a timeout, so it doesn't mess with our ajax code
                setTimeout(function () { copyCurrentRequestInfo.callBack(responseData, copyCurrentRequestInfo.get, copyCurrentRequestInfo.post, copyCurrentRequestInfo.callBackData); }, 1);
                
            }
            obj.nextRequest();
        };
        this.ajaxObject.onerror = function (error) {
            var errorHandler = obj.getSetting("errorHandler");
            if (errorHandler)
                errorHandler(0, null);
            obj.nextRequest();
        };
    };

    this.getAvailableAjaxObject = function () {
        // Modern browsers
        if (window.XMLHttpRequest)
            return new XMLHttpRequest();

        // IE Specific
        if (window.ActiveXObject) {
            try {
                return new ActiveXObject("Msxml2.XMLHTTP");
            } catch (r) { }
            try {
                return new ActiveXObject("Microsoft.XMLHTTP");
            } catch (r) { }
        }
    };

    this.hashString = function (string) {
        var hash = 0;
        if (string.length == 0)
            return hash;

        for (var i = 0; i < string.length; i++) {
            var char = string.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    };
    this.clearSaved = function () {
        for (var item in window.localStorage) {
            if (item.substr(0, 4) == "page") {
                delete window.localStorage[item];
            }
        }
    };
    this.clearCached = function () {
        this.cached = {};
    };
    //redo current request
    this.retryLast = function () {
        if (this.getSetting("saveResults") && window.localStorage["page" + this.hashString(this.currentRequestInfo.get)]) {
            console.log("Using saved results");
            // Use saved result instead
            if (this.currentRequestInfo.callBack) {
                // make a copy since the callback is called in timeout (currentRequestInfo can be changed)
                var copyCurrentRequestInfo = this.currentRequestInfo;
                var content = window.localStorage["page" + this.hashString(this.currentRequestInfo.get)];
                if (this.getSetting("parseJSONResponse") && content && (content.substr(0, 1) == "{" || content.substr(0, 1) == "\"" || content.substr(0, 1) == "[")) {
                    content = JSON.parse(content);
                }
                // Do this as a timeout, so it doesn't mess with our ajax code
                setTimeout(function () { copyCurrentRequestInfo.callBack(content, copyCurrentRequestInfo.get, copyCurrentRequestInfo.post, copyCurrentRequestInfo.callBackData); }, 1);
            }
            this.nextRequest();
            return;
        }
        this.busy = false;
        this.retryCount++;
        if (this.retryCount > this.getSetting("maxRetries")) {
            this.retryCount = 0;
            this.nextRequest();
            return;
        }
        if (this.currentRequestInfo)
            this.do(this.currentRequestInfo.get, this.currentRequestInfo.post, this.currentRequestInfo.callBack, this.currentRequestInfo.callBackData, this.currentRequestInfo.extraSettings);
    };

    // Prepare everything for a next request (and even do them if there is something in the queue)
    this.nextRequest = function () {
        this.busy = false;
        if (this.queue.length == 0) {
            return;
        }

        var nextRequestInfo = this.queue.shift();
        this.do(nextRequestInfo.get, nextRequestInfo.post, nextRequestInfo.callBack, nextRequestInfo.callBackData, nextRequestInfo.extraSettings);
    };
    this.do = function (get, post, callBack, callBackData, extraSettings) {
        if (!this.ajaxObject) {
            this.initComponent();
        }

        if (extraSettings) {
            var orig = extraSettings;
            extraSettings = JSON.parse(JSON.stringify(extraSettings)); // Clone to make sure we don't override any settings for the next request
            if (orig.errorHandler)
                extraSettings.errorHandler = orig.errorHandler;
        }

        var requestInfo = { get: get, post: post, callBack: callBack, callBackData: callBackData, extraSettings: extraSettings };

        var beforeRequest = this.getSetting("beforeRequest", requestInfo);
        if (beforeRequest) { 
            beforeRequest(requestInfo, function (requestInfo) {
                if (!requestInfo.extraSettings)
                    requestInfo.extraSettings = {};
                requestInfo.extraSettings.beforeRequest = null;
                obj.do(requestInfo.get, requestInfo.post, requestInfo.callBack, requestInfo.callBackData, requestInfo.extraSettings);
            });
            return;
        }

        if (extraSettings && extraSettings.cacheResults && this.cached["page" + this.hashString(get)]) {
            var content = this.cached["page" + this.hashString(get)];
            if (callBack) {
                if (!(typeof post === "string" || post instanceof String) && this.parseJSONResponse !== false && content && (content.substr(0, 1) == "{" || content.substr(0, 1) == "\"" || content.substr(0, 1) == "[")) {
                    content = JSON.parse(content);
                }
                setTimeout(function () { callBack(content, get, post, callBackData); }, 1);
            }
            if (!this.busy)
                this.nextRequest();
            return;
        }                

        if (this.busy) {
            this.queue.push(requestInfo);
            return;
        }

        this.busy = true;
        this.currentRequestInfo = requestInfo;
        if (post == null) {
            this.ajaxObject.open('GET', get, true);
        } else {
            this.ajaxObject.open('POST', get, true);
        }
        
        var extraHeaders = this.getSetting("extraHeaders");
        for (var i = 0; i < extraHeaders.length; i++) {
            this.ajaxObject.setRequestHeader(extraHeaders[i][0], extraHeaders[i][1]);
        }

        if (this.ajaxObject.responseType !== this.undefined && this.getSetting("responseType"))
            this.ajaxObject.responseType = this.getSetting("responseType");

        if (post && post.name) {
            // This is the classic file upload. send it raw, the filereader method is not supported by most browsers
            this.ajaxObject.setRequestHeader("File-Name", post.name);
            this.ajaxObject.send(post);
        } else {
            // Normal request
            this.timeoutChecker = setTimeout(function () {
                obj.timeoutChecker = null;
                try { // try to cancel
                    obj.ajaxObject.abort();
                } catch (errie) { }
                obj.retryLast();
            }, this.getSetting("timeout"));

            if (post == null) {
                this.ajaxObject.send(); // get
            } else {
                if (post instanceof FormData) { // Post form data (including file uploads)
                    this.ajaxObject.send(post);
                    return;
                } else if (!(typeof post === "string" || post instanceof String)) {
                    // We can only put text in our post data
                    post = JSON.stringify(post);
                    if (!this.currentRequestInfo.extraSettings)
                        this.currentRequestInfo.extraSettings = {};
                    if (this.currentRequestInfo.extraSettings.parseJSONResponse == undefined)
                        this.currentRequestInfo.extraSettings.parseJSONResponse = true;
                }
                this.ajaxObject.setRequestHeader("Content-Type", post.length > 0 && post.substr(0, 1) == "{" ? "application/json" : "application/x-www-form-urlencoded");
                this.ajaxObject.setRequestHeader("Content-Size", post.length);
                if (post.length > 0 && post.substr(0, 1) == "{") {
                    post = post.replace(/"\/Date\((\d*)\)\/"/g, "\"\\/Date($1)\\/\"");
                }
                this.ajaxObject.send(post);
            }
        }
    };

    /* Extra handy functions */
    this.doAjaxToDiv = function (get, post, divName, extraSettings) {
        var obj = this;
        this.do(get, post, function (txt) {
            document.getElementById(divName).innerHTML = txt;
            if (obj.getSetting("executeScriptTags")) {
                obj.executeScripts(txt);
            }
        }, null, extraSettings);
    };

    this.doAjaxToDivElement = function (get, post, divElement, extraSettings) {
        var obj = this;
        this.do(get, post, function (txt) {
            divElement.innerHTML = txt;
            if (obj.getSetting("executeScriptTags")) {
                obj.executeScripts(txt);
            }
        }, null, extraSettings);
    };

    this.doAjaxFormSubmit = function (formElement, callBack, submitButton, extraSettings) {
        /*if (window.FormData) { // We can use the FormData api            
            var fd = new FormData(formElement);
            if (submitButton && submitButton.name) {
                fd.append(fd.name, fd.value);
            }
            this.do(formElement.action, fd, callBack, null, extraSettings);
            return fd;
        }*/
        var inputs = "";
        for (var i = 0; i < formElement.length; i++) {
            if (formElement[i].type == "submit" && submitButton != formElement[i])
                continue;

            if ((formElement[i].type == "checkbox" || formElement[i].type == "radio") && !formElement[i].checked)
                continue;

            if (formElement[i].multiple && formElement[i].options && formElement[i].name) {
                for (var j = 0; j < formElement[i].options.length; j++) {
                    if (formElement[i].options[j].selected && formElement[i].options[j].value) {
                        inputs += "&" + formElement[i].name + "=" + this.URLEncode(formElement[i].options[j].value);
                    }
                }
                continue;
            }

            if (formElement[i].value && formElement[i].name) {
                inputs += "&" + formElement[i].name + "=" + this.URLEncode(formElement[i].value);
            }
        }
        this.do(formElement.action, inputs, callBack, null, extraSettings);
    };

    this.doAjaxFormSubmitToDiv = function (formElement, divName, submitButton, extraSettings) {
        var obj = this;
        this.doAjaxFormSubmit(formElement, function (pTxt) {
            document.getElementById(divName).innerHTML = pTxt;
            if (obj.getSetting("executeScriptTags")) {
                obj.executeScripts(pTxt);
            }
        }, submitButton, extraSettings);
    };
    this.doFileUpload = function (url, nameFormField, blobOrFileElement, blobFileName, callBack, callBackData, extraSettings) {
        var fd = new FormData();
        fd.append(nameFormField, blobOrFileElement, blobFileName);
        this.do(url, fd, callBack, callBackData, extraSettings);
    };
    this.executeScripts = function (data) {
        while (data.indexOf("<script") >= 0 && data.indexOf("</script>") >= 0) {
            var script = data.substr(data.indexOf("<script") + 7);
            script = script.substr(script.indexOf(">") + 1);
            script = script.substring(0, script.indexOf("</script>"));
            try {
                eval(script);
            } catch (errie) {
                console.log("Error executing script:");
                console.log(errie);
            }
            data = data.substr(data.indexOf("</script>") + 9);
        }
    };
    // URL Encoding script
    this.gethex = function (decimal) {
        var hexchars = "0123456789ABCDEFabcdef";
        return "%" + hexchars.charAt(decimal >> 4) + hexchars.charAt(decimal & 0xF);
    };

    this.URLEncode = function (decoded) {
        var unreserved = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_.~";
        var encoded = "";
        for (var i = 0; i < decoded.length; i++) {
            var ch = decoded.charAt(i);

            if (unreserved.indexOf(ch) != -1) {
                encoded = encoded + ch;
            } else {
                var charcode = decoded.charCodeAt(i);
                if (charcode < 128) {
                    encoded = encoded + this.gethex(charcode);
                } else if (charcode > 127 && charcode < 2048) {
                    encoded = encoded + this.gethex((charcode >> 6) | 0xC0);
                    encoded = encoded + this.gethex((charcode & 0x3F) | 0x80);
                } else if (charcode > 2047 && charcode < 65536) {
                    encoded = encoded + this.gethex((charcode >> 12) | 0xE0);
                    encoded = encoded + this.gethex(((charcode >> 6) & 0x3F) | 0x80);
                    encoded = encoded + this.gethex((charcode & 0x3F) | 0x80);
                } else if (charcode > 65535) {
                    encoded = encoded + this.gethex((charcode >> 18) | 0xF0);
                    encoded = encoded + this.gethex(((charcode >> 12) & 0x3F) | 0x80);
                    encoded = encoded + this.gethex(((charcode >> 6) & 0x3F) | 0x80);
                    encoded = encoded + this.gethex((charcode & 0x3F) | 0x80);
                }
            }
        }
        return encoded;
    };
};

window.Ajax = new ajax();