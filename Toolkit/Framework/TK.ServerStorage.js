"use strict";
/* Minify Skip */
/* Minify Order(100) */

// Component to save and retrieve files, using the Tiseda API
TK.ServerStorage = {
    _: "component",
    Container: null, // null is only for public file storage/retrieval, use a https:// link for a private storage container with rights check based on the clientId
    ClientId: "Client" + (Math.random() * 100000), // Used for private containers  
    Url: "https://toolkitapi.comgenie.com/Storage",

    Store: function (path, blobOrByteArrayOrStringContents, callBack) {
        
        var formData = new FormData();
        var url = "?clientId=" + encodeURIComponent(this.ClientId) + (this.Container ? "&container=" + encodeURIComponent(this.Container) : "");
        
        if (path)
            url += "&fileName=" + encodeURIComponent(path);
        
        if ((window.Blob && blobOrByteArrayOrStringContents instanceof Blob) || (window.File && blobOrByteArrayOrStringContents instanceof File)) {            
            formData.append("files", blobOrByteArrayOrStringContents);
        } else if ((window.Uint8Array && blobOrByteArrayOrStringContents instanceof Uint8Array) || (window.Uint16Array && blobOrByteArrayOrStringContents instanceof Uint16Array)) {
            formData.append("files", new Blob(blobOrByteArrayOrStringContents));
        } else if (blobOrByteArrayOrStringContents.substr && blobOrByteArrayOrStringContents.length && blobOrByteArrayOrStringContents.length > 10 && blobOrByteArrayOrStringContents.substr(0, 5) == "data:") {            
            var blob = new Blob(atob(blobOrByteArrayOrStringContents.split(',')[1])); // Convert base64 data url to blob
            formData.append("files", blob);            
        } else { // string
            if (!blobOrByteArrayOrStringContents.substr)
                blobOrByteArrayOrStringContents = blobOrByteArrayOrStringContents.toString();

            var buf = new ArrayBuffer(blobOrByteArrayOrStringContents.length * 2); // 2 bytes for each char
            var bufView = new Uint16Array(buf);
            for (var i = 0; i < blobOrByteArrayOrStringContents.length; i++)
                bufView[i] = blobOrByteArrayOrStringContents.charCodeAt(i);
            formData.append("files", new Blob(bufView));
        }
        
        Ajax.do(this.Url + "/Store" + url, formData, function (response) {
            if (!callBack)
                return;
            if (response.length && response.length > 0 && response[0].url)
                callBack(response[0]);
            else
                callBack();
        }, null, { parseJSONResponse: true });
    },
    Retrieve: function (path, asBlob, callBack) {
        Ajax.do(this.Url + "/Retrieve", { clientId: this.ClientId, container: this.Container, fileName: path, directly: true }, function (contents) {
            if (callBack)
                callBack(contents);
        }, null, { parseJSONResponse: false, responseType: (asBlob ? "blob" : undefined) });
    },
    GetUrl: function (path, callBack) {
        Ajax.do(this.Url + "/Retrieve", { clientId: this.ClientId, container: this.Container, fileName: path }, function (fileData) {
            if (!callBack)
                return;
            if (fileData.Url)
                callBack(fileData.Url);
            else {
                console.log(fileData); 
                callBack();
            }
        });
    },
    Delete: function (path, callBack) {
        Ajax.do(this.Url + "/Delete", { clientId: this.ClientId, container: this.Container, fileName: path }, function (result) {
            if (callBack)
                callBack(result == "OK");
        });
    },
    List: function (callBack) {
        Ajax.do(this.Url + "/List", { clientId: this.ClientId, container: this.Container }, function (files) {
            if (!callBack)
                return;
            if (files && files.length > 0 && files[0].url)
                callBack(files);
            else {
                console.log(files); 
                callBack();
            }
        });
    },
};
