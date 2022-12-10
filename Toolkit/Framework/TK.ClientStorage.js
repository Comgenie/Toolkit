/* Minify Order(100) */

// Component to store client side data with several fallbacks: IndexedDB, LocalStorage
// This component has the same methods as TK.ServerStorage
TK.ClientStorage = {
    _: "component",
    Prefix: "TKStorage_",

    Store: function (path, blobOrByteArrayOrStringContents, isStoredCallBack) {
        var obj = this;

        // We will convert all byte arrays to blobs, which will later be converted to data urls
        if ((window.Uint8Array && blobOrByteArrayOrStringContents instanceof Uint8Array) || (window.Uint16Array && blobOrByteArrayOrStringContents instanceof Uint16Array)) {
            blobOrByteArrayOrStringContents = new Blob([blobOrByteArrayOrStringContents], { 'type': 'application/octet-stream' });
        }

        // We will convert all blobs to data urls
        if ((window.Blob && blobOrByteArrayOrStringContents instanceof Blob) || (window.File && blobOrByteArrayOrStringContents instanceof File)) {
            var reader = new FileReader();
            reader.onload = function () {
                if (reader.result) {
                    obj.Store(path, reader.result, isStoredCallBack);
                }
            };
            reader.readAsDataURL(blobOrByteArrayOrStringContents);
            return;
        }
        
        this.GetIndexedDBInstance(function (db) {
            if (!db) {
                // use local storage as fallback
                var saved = false;
                try {
                    window.localStorage[obj.Prefix + path] = blobOrByteArrayOrStringContents;
                    saved = true;
                } catch (ex) { } // not allowed, supported or quota reached

                if (isStoredCallBack)
                    isStoredCallBack(saved);
                return;
            }

            var transaction = db.transaction(["data"], "readwrite");
            transaction.oncomplete = function (event) {
                if (isStoredCallBack)
                    isStoredCallBack(true);
            };
            transaction.onerror = function (event) {
                console.log("IndexedDB transaction onerror: " + event);
            };
            var store = transaction.objectStore("data");
            var request = store.get(path);
            request.onerror = function (event) {
                console.log('IndexedDB objectStore get onerror: ' + event);
            };
            request.onsuccess = function (event) {
                if (request.result === undefined) { // Add
                    store.add({ key: path, data: blobOrByteArrayOrStringContents });
                } else { // Update
                    request.result.data = blobOrByteArrayOrStringContents;
                    store.put(request.result);
                }
            };
        });
    },
    Retrieve: function (path, asBlob, callBack) {
        if (!callBack)
            return;

        var dataUrlToBlob = function (dataUrl) {
            var parts = dataUrl.split(','), mime = parts[0].match(/:(.*?);/)[1]
            if (parts[0].indexOf('base64') != -1) {
                var data = atob(parts[1]);
                var i = data.length;
                var byteArray = new Uint8Array(data.length);
                while (i--)
                    byteArray[i] = data.charCodeAt(i);
                return new Blob([byteArray], { type: mime });
            } else {
                return new Blob([decodeURIComponent(parts[1])], { type: mime });
            }
        };

        var obj = this;
        this.GetIndexedDBInstance(function (db) {
            if (!db) {
                // use local storage as fallback
                if (!window.localStorage[obj.Prefix + path]) {
                    callBack();
                } else if (!asBlob) {
                    callBack(window.localStorage[obj.Prefix + path]);
                } else if (request.result.data.length < 5 && request.result.data.substr(0, 5) != "data:") {
                    callBack(new Blob([window.localStorage[obj.Prefix + path]], { type: 'text/plain' }));
                } else {
                    callBack(dataUrlToBlob(window.localStorage[obj.Prefix + path]));
                }
                return;
            }

            var transaction = db.transaction(["data"]);
            var store = transaction.objectStore("data");
            var request = store.get(path);
            request.onerror = function (event) {
                console('IndexedDB getAllKeys onerror: ' + event);
            };
            request.onsuccess = function () {
                if (!request.result) {
                    callBack();
                } else if (!asBlob) {
                    callBack(request.result.data);
                } else if (request.result.data.length < 5 && request.result.data.substr(0, 5) != "data:") {
                    callBack(new Blob([request.result.data], { type: 'text/plain' })); 
                } else { 
                    callBack(dataUrlToBlob(request.result.data)); // Data url, turn into blob
                }
            };
        });
    },
    GetUrl: function (path, callBack) {
        if (window.URL && window.URL.createObjectURL) {
            // Return a blob url if supported
            this.Retrieve(path, true, function (resp) {
                if (!resp) {
                    callBack();
                } else {
                    callBack(window.URL.createObjectURL(resp));
                }
            });
        } else {
            // Return a data url as fallback
            this.Retrieve(path, false, function (resp) {
                if (!resp) {
                    callBack();
                } else if (resp.length < 5 || resp.substr(0, 5) != "data:") {
                    callBack("data:text/plain;base64," + btoa(resp));
                } else {
                    callBack(resp);
                }
            });
        }
    },
    Delete: function (path, isDeletedCallBack) {
        var obj = this;
        this.GetIndexedDBInstance(function (db) {
            if (!db) {
                if (window.localStorage[obj.Prefix + path])
                    delete window.localStorage[obj.Prefix + path];
                if (isDeletedCallBack)
                    isDeletedCallBack(true);
                return;
            }

            var transaction = db.transaction(["data"], "readwrite");
            transaction.oncomplete = function (event) {
                if (isDeletedCallBack)
                    isDeletedCallBack(true);
            };
            transaction.onerror = function (event) {
                console.log("IndexedDB transaction onerror: " + event);
                if (isDeletedCallBack)
                    isDeletedCallBack(false);
            };
            var store = transaction.objectStore("data");
            var request = store.get(path);
            request.onerror = function (event) {
                console.log('IndexedDB objectStore get onerror: ' + event);
                if (isDeletedCallBack)
                    isDeletedCallBack(false);
            };
            request.onsuccess = function (event) {
                if (request.result !== undefined) {
                    // Found: Delete
                    store.delete(path);
                }
            };
        });
    },
    List: function (pathsCallBack) {
        if (!pathsCallBack)
            return;

        var obj = this;
        this.GetIndexedDBInstance(function (db) {
            if (!db) {
                // use local storage as fallback
                var keys = [];
                for (var name in window.localStorage) {
                    if (name.length > obj.Prefix && name.substr(0, obj.Prefix.length) == obj.Prefix) {
                        keys.push(name.substr(obj.Prefix.length));
                    }
                }
                pathsCallBack(keys);
                return;
            }

            var transaction = db.transaction(["data"]);
            var store = transaction.objectStore("data");
            var request = store.getAllKeys();
            request.onerror = function (event) {
                console('IndexedDB getAllKeys onerror: ' + event);
            };
            request.onsuccess = function () {
                pathsCallBack(request.result);
            };
        });
    },

    // Internal   
    GetIndexedDBInstance: function (callBack) {
        if (this.IndexedDB) {
            callBack(this.IndexedDB);
            return;
        }

        var obj = this;
        var db = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        if (!db) {
            callBack();
            return;
        }

        var request = window.indexedDB.open(this.Prefix, 1);
        request.onerror = function (event) {
            console.log("IndexedDB onerror: " + request.errorCode);
            callBack();
        };
        request.onupgradeneeded = function (event) {
            obj.IndexedDB = event.target.result;
            event.target.transaction.oncomplete = function () {
                callBack(obj.IndexedDB);
            };
            obj.IndexedDB.createObjectStore("data", { keyPath: "key" });            
        };
        request.onsuccess = function (event) {
            obj.IndexedDB = event.target.result;
            callBack(obj.IndexedDB);
        };
    }
};