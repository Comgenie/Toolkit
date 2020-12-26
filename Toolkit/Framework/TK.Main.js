"use strict";
/* Minify Order(1) */
window.TK = {};
window.TK.AutoTypeSelection = true;
window.TK.Initialize = function (obj, parentObj, nameChildObj) {
	var reserved = ['Parent', 'Add', 'AddMultiple', 'Clear', 'Near', 'Remove', 'SetHTML', '_'];
	var allObjs = [obj];
	var inits = [];
    var copyObj = {};
    var defaultInnerHTML = null;
	var type = obj._;
	// Allow types to point to different objects (overriding their properties)
	while (type && (typeof type != "string" || type.indexOf(".") > 0)) {
		if (typeof type == "string") {
			type = eval(type);
        }
		allObjs.push(type);
		type = type._;

	}
	// Allow classname to be specified (example: div.orange)    
	var className = null;
	/*if (type && type.indexOf && type.indexOf(".") >= 0) {
		className = type.substr(type.indexOf(".") + 1);
		type = type.substr(0, type.indexOf("."));
		if (type == "")
			type = null;
	}*/
	// Default type (div, unless name ends with Input, Button, Select or Label)
	if (!type) {
		type = "div";
		if (nameChildObj && window.TK.AutoTypeSelection) {
            var autoTypes = ["Input", "TextButton", "Button", "Select", "Label", "Span", "Textarea", "H1", "H2", "H3", "H4"];
			var endsWith = function (s, has) {
				if (!s || !has || s.length < has)
					return false;
				return s.substr(s.length - has.length) == has;
			};
			for (var i = 0; i < autoTypes.length; i++) {
                if (endsWith(nameChildObj, autoTypes[i])) {
                    if (autoTypes[i] == "TextButton") {
                        defaultInnerHTML = nameChildObj.substr(0, nameChildObj.length - 10);
                        type = "button";
                    } else {
                        type = autoTypes[i].toLowerCase();
                    }
					break;
				}
			}
		}
	}
	// Actually create the element (or empty object, in case its a component with no DOM representation)
	var copyObj = type != "component" ? document.createElement(type) : {};
	copyObj._ = type;

	// Go through all levels of elements, set (and override) properties. Keep all child elements and Init functions in a seperate list
    var elements = {};
    var resolveProperties = [];
	for (var i = allObjs.length - 1; i >= 0; i--) {
		for (var propName in allObjs[i]) {
			if (propName == "style" && copyObj.appendChild) {
				for (var styleName in allObjs[i].style) {
					copyObj.style[styleName] = allObjs[i].style[styleName];
				}
				continue;
			}
			if (reserved.indexOf(propName) >= 0)
				continue;
            if (propName == "Elements") {
                for (var elementName in allObjs[i][propName]) {
                    if (typeof allObjs[i][propName][elementName] === 'string') {
                        elements[elementName] = {
                            HTML: allObjs[i][propName][elementName]
                        };
                    } else if (typeof allObjs[i][propName][elementName] === 'function') {
                        elements[elementName] = {
                            onclick: allObjs[i][propName][elementName]
                        };
                    } else {
                        elements[elementName] = allObjs[i][propName][elementName];
                    }
                }
            } else {
                if (allObjs[i][propName] && allObjs[i][propName].ToolkitPropertyReference)
                    resolveProperties.push(propName);
                
                if (copyObj["__RecursiveProperties" + propName]) {
                    // We're going to copy all settings recursively                    
                    window.TK.RecursiveCopy(allObjs[i], copyObj, propName);
                } else {
                    if (allObjs[i][propName] !== undefined)
                        copyObj[propName] = allObjs[i][propName];
                }
			}
			if (propName == "Init")
				inits.push(copyObj[propName]);
		}
	}

	// Set the classname (Automatically adds a Element-Name class, and any custom classes)
	if (type != "component" && (nameChildObj || className)) {
		if (!copyObj.className)
			copyObj.className = "";
		copyObj.className += " " + (nameChildObj ? "Element-" + nameChildObj : "") + (className ? " " + className : "");
	}

	if (nameChildObj) {
		copyObj._Name = nameChildObj;
    }
    
    if (defaultInnerHTML && (!copyObj.innerHTML || copyObj.innerHTML == "")) {
        copyObj.innerHTML = defaultInnerHTML;
    }    

    if (copyObj._Position && copyObj.style && copyObj._Position.split) {
        var p = copyObj._Position.split(','); // top,right,bottom,left,width,height[,relative]
        
        copyObj.style.top = p[0];
        copyObj.style.right = p.length > 1 ? p[1] : "";
        copyObj.style.bottom = p.length > 2 ? p[2] : "";
        copyObj.style.left = p.length > 3 ? p[3] : "";        

        if (p.length > 4)
            copyObj.style.width = p[4];
        if (p.length > 5)
            copyObj.style.height = p[5];

        copyObj.style.position = p.length > 6 ? p[6] : "absolute";     
        
    }

	// Add extra helper functions
	copyObj.Add = function (obj, nameChildObj) {
		// Add single child element
		return window.TK.Initialize(obj, this, nameChildObj);
	};
	copyObj.AddMultiple = function (obj, propertyArray, syncPropertyName, useVariable) {
		// Add multiple child elements
		var newObjs = [];
		var allNewObjIds = [];
		var existingObjIds = [];
		if (syncPropertyName) {
			existingObjIds = this.Elements.ToArray().Select(function (a) { return useVariable ? a[useVariable][syncPropertyName] : a[syncPropertyName]; });
		}
		for (var i = 0; i < propertyArray.length; i++) {
			if (syncPropertyName) {
				var objId = propertyArray[i][syncPropertyName];
				allNewObjIds.push(objId);
				var existingIndex = existingObjIds.indexOf(objId);
				if (existingIndex >= 0) { // Already exists
					existingObjIds.splice(existingIndex, 1);
					continue;
				}
			}
			var toInitialize = propertyArray[i];
			if (useVariable) {
				toInitialize = { _: obj };
				toInitialize[useVariable] = propertyArray[i];
			} else {
				toInitialize._ = obj;
			}
			newObjs.push(window.TK.Initialize(toInitialize, this));
		}
		if (syncPropertyName) {
			// Remove all old child elements which aren't in the new propertyArray 
			for (var childName in this.Elements) {
				if (typeof this.Elements[childName] != "function" && allNewObjIds.indexOf(useVariable ? this.Elements[childName][useVariable][syncPropertyName] : this.Elements[childName][syncPropertyName]) < 0) {
					this.Elements[childName].Remove();
				}
			}
		}
		return newObjs;
	};

	copyObj.Remove = function (onlyExecuteCallback) {
		if (this.Destroy) {
			this.Destroy();
		}
		for (var childName in this.Elements) {
			if (this.Elements[childName].Remove)
				this.Elements[childName].Remove(true);
		}
		if (onlyExecuteCallback)
			return;

		if (this.Parent) {
			if (this.parentNode)
				this.parentNode.removeChild(this);

			for (var childName in this.Parent.Elements) {
				if (this.Parent.Elements[childName] == this) {
					delete this.Parent.Elements[childName];
					break;
				}
			}
			delete this.Parent;
		} else {
			if (this.parentNode && this.parentNode.removeChild)
				this.parentNode.removeChild(this);
		}
	};
	copyObj.Clear = function () {
		this.Elements.ToArray().Select(function (a) { a.Remove(); });
	};
	copyObj.Near = function (name) {
		// Find the nearest element with this name, or classname, or id
        var curEle = this;
        var findName = name;
        if (name.substr(0, 1) != "." && name.substr(0, 1) != ".") {
            if (curEle.Elements && curEle.Elements[name])
                return curEle.Elements[name];
            findName = ".Element-" + findName;
        }		
		var found = curEle.querySelector(findName);
		if (found)
			return found;
		while (curEle.parentNode) {
			curEle = curEle.parentNode;
			if (curEle._Name == name)
                return curEle;
            if (curEle.className && "." + curEle.className == name)
                return curEle;
            if (curEle.Elements && curEle.Elements[name])
                return curEle.Elements[name];
			var found = curEle.querySelector(findName);
			if (found)
				return found;
		}
		return null;
    };
    copyObj.DetachElementFromParent = function () {
        // This appends the div to the document.body element with a fixed position on the same position using getBoundingClientRect
        if (!this.getBoundingClientRect)
            return;
        var rect = this.getBoundingClientRect();
        if (!rect || isNaN(rect.top) || isNaN(rect.left))
            return;
        this.style.position = "fixed";
        this.style.top = rect.top + "px";
        this.style.left = rect.left + "px";
        document.body.appendChild(this);
    };
    var getReference = function (capture, observingObject) {
        var curObj = copyObj;
        if (typeof capture == "function") {
            return capture(copyObj);            
        }

        if (capture.indexOf(":") >= 0) {
            curObj = copyObj.Near(capture.substr(0, capture.indexOf(":")));
            if (!curObj)
                return "";
            capture = capture.substr(capture.indexOf(":") + 1);
        }

        if (capture != "") {
            while (capture.indexOf(".") > 0) {
                var part = capture.substr(0, capture.indexOf("."));
                if (part == "Parent")
                    curObj = parentObj;
                else
                    curObj = curObj[part];
                capture = capture.substr(capture.indexOf(".") + 1);
            }
            if (observingObject) {
                // Add a getter/setter structure to the property we want to observe, when changed, call the object's FieldUpdate function
                curObj["__Orig" + capture] = curObj[capture];
                Object.defineProperty(curObj, capture, {
                    get: function () {
                        return this["__Orig" + capture];
                    },
                    set: function (value) {
                        this["__Orig" + capture] = value;
                        if (observingObject.Obj.FieldUpdate) {
                            observingObject.Obj.FieldUpdate(observingObject.Name, value);
                        }
                    }
                });
            }
            curObj = curObj[capture];
        }
        return curObj;
    };

    copyObj.SetHTML = function (html) {
        var injectChildsObj = {};
        var injectChilds = false;

        this.innerHTML = html.replace(/\$([\ \-\#\:\w\.]*?)\$/g, function (match, capture) {
            var curObj = getReference(capture);

            if (curObj && curObj.tagName) { // Reference added to a HTML element
                var rnd = "placeholder-" + Math.floor(Math.random() * 1000000) + "-" + Math.floor(Math.random() * 1000000) + "-" + Math.floor(Math.random() * 1000000);
                injectChildsObj[rnd] = curObj;
                injectChilds = true;
                return "<span id=\"" + rnd + "\" class=\"tkInternalPlaceHolder\"></span>";
            }
            return curObj;
        });

        if (injectChilds) {
            var items = this.querySelectorAll(".tkInternalPlaceHolder");
            for (var i = 0; i < items.length; i++) {
                var elementToAdd = injectChildsObj[items[i].id];
                items[i].parentNode.insertBefore(elementToAdd, items[i]);
                items[i].parentNode.removeChild(items[i]);
            }
        }
    };

	copyObj.Elements = {};
	copyObj.Elements.ToArray = function () {
		var arr = [];
		for (var propName in this) {
			if (typeof this[propName] != "function")
				arr.push(this[propName]);
		}
		return arr;
	};

	// Create all sub elements    
	for (var name in elements) {
		window.TK.Initialize(elements[name], copyObj, name);
    }

	// Add this element to the child elements of a parent element (and get a reference to it)
	if (parentObj) {
        copyObj.Parent = parentObj;
        parentObj.Elements[nameChildObj ? nameChildObj : ("ele"+Math.random().toString())] = copyObj;
		if (copyObj.appendChild && parentObj.appendChild) {
			// This and parent element are html nodes
			parentObj.appendChild(copyObj);
		}
    }

    // Special HTML template support. Variables in the same object can be including using their $PropertyName$ , $Parent.Sub.PropertyName$ etc. also works
    // You can also reference to other elements, which will be appended at the correct locations.
    if (copyObj.HTML) {
        copyObj.SetHTML(copyObj.HTML);
    }    

    // Use TK.P("Parent.PropertyName") in a template to reference to a object on runtime
    for (var i = 0; i < resolveProperties.length; i++) {
        var p = copyObj[resolveProperties[i]];
        if (!p.ToolkitPropertyReference)
            continue;
        if (p.Observe) {
            // Attach getter/setter to the property we are looking at, so it can call our 'FieldChange' function
            getReference(p.ToolkitPropertyReference, { Name: resolveProperties[i], Obj: copyObj });

            // Attach an getter to the current object, to always retrieve the latest value
            var attachGetter = function (referencePath) {
                Object.defineProperty(copyObj, resolveProperties[i], {
                    get: function () {
                        return getReference(referencePath);
                    }
                });
            };
            attachGetter(p.ToolkitPropertyReference);
        } else {
            copyObj[resolveProperties[i]] = getReference(p.ToolkitPropertyReference);
        }
    }

	// Call all init functions, lowest level goes first, all the 'overrides' go after
	for (var i = 0; i < inits.length; i++) {
		inits[i].call(copyObj);
	}
	return copyObj;
};
window.TK.P = function (name, observe) {
    return { ToolkitPropertyReference: name, Observe: observe };
};
window.TK.RecursiveCopy = function (objSource, objTarget, singleProperty) {
    for (var n in objSource) {
        if (objSource[n] === undefined || (singleProperty && n != singleProperty))
            continue;
        if (!(objSource[n] instanceof Object) || typeof objSource[n] == "function") {
            objTarget[n] = objSource[n];        
        } else if (Array.isArray(objSource[n])) {            
            if (!objTarget[n])
                objTarget[n] = [];
            for (var i = 0; i < objSource[n].length; i++) {
                objTarget[n].push(objSource[n][i]);
            }            
        } else {
            if (!objTarget[n])
                objTarget[n] = {};            
            window.TK.RecursiveCopy(objSource[n], objTarget[n]);
        }
    }
};

/// Helper functions
window.SvgPath = function (d, width, height, color, strokeWidth) {        
    if (!color) color = "#333";
    if (!strokeWidth) strokeWidth = 3;
    return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" viewBox="0 0 ' + width + ' ' + height + '" width="' + width + '" height="' + height + '" ><path d="' + d + '" stroke="' + color + '" stroke-linecap="round" stroke-width="' + strokeWidth+'" fill="none"/></svg>';
};
window.ConvertFromASPTime = function (a) {
    if (a && a.length && a.length > 6 && a.substr(0, 6) == "/Date(") {
        var dateObj = new Date(parseInt(a.substr(6, a.length - 2)));
        return dateObj.toISOString();
    }
    return "";
};
window.ConvertToASPTime = function (a) {
    if (a == "")
        return "";
    var time = new Date(a).getTime();
    return "\\/Date(" + time + ")\\/";
};

