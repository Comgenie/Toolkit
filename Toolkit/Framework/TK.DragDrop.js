"use strict";

window.TK.DragDrop = {
    _: "div",    
    className: "toolkitDragDrop",
    Init: function () {
        this.style.position = "relative";
    },
    Type: "",
    Threshold: 10,
    ElementTemplate: null, // When set, the current element will not be moved, but a new element will be created by this. This will also be used as hover template if the HoverTemplate property is not set.
    HoverTemplate: null, // When set, this element will be used for a hover-preview. If both are set, the ElementTemplate will be passed as Template to the .Drop method
    Dropped: function (droppedInContainer, addedElement) { }, // Extra callback

    ontouchstart: function (e) {
        this.onmousedown(e.touches[0]);
        e.stopPropagation();
    },
    onmousedown: function (e) {
        var startX, startY;
        try { startX = e.clientX; startY = e.clientY; } catch (errie) { var e2 = window.event; startX = e2.clientX; startY = e2.clientY; }

        var obj = this;
        var origObj = this;
        var origParent = this.parentNode;
        var myPosition = this.getBoundingClientRect();
        
        var cursorOffsetX = startX - myPosition.left;
        var cursorOffsetY = startY - myPosition.top;
        
       
        var positions = [];
        var newTop, newLeft;
        var first = true;
        var elementOrTemplateToAdd = null;
        var passedThreshold = false;
        var aboveContainer = null;
        var aboveContainerPosition = null;        
        window.onmousemove = function (e) {
            var x, y;
            try { x = e.clientX; y = e.clientY; } catch (errie) { var e2 = window.event; x = e2.clientX; y = e2.clientY; }

            if (!passedThreshold && (Math.abs(startX - x) < obj.Threshold && Math.abs(startY - y) < obj.Threshold))
                return;
            passedThreshold = true;

            if (first) {
                if (obj.HoverTemplate) {
                    obj = obj.Add(obj.HoverTemplate);
                    origParent = null;
                } else if (obj.ElementTemplate) {
                    obj = obj.Add(obj.ElementTemplate);
                    origParent = null;
                }
                obj.style.position = "fixed";
                document.body.appendChild(obj);

                elementOrTemplateToAdd = (origObj.ElementTemplate && origObj.HoverTemplate ? origObj.ElementTemplate : obj);

                var containers = document.querySelectorAll(".toolkitDragDropContainer");
                for (var i = 0; i < containers.length; i++) {
                    if (containers[i].DropFilter && (!obj.Type || containers[i].DropFilter.indexOf(obj.Type) < 0))
                        continue;
                    if (containers[i].CanDrop && !containers[i].CanDrop(elementOrTemplateToAdd))
                        continue;
                    containers[i].className += " toolkitDragDropContainerArea";
                    positions.push({ Element: containers[i], Position: containers[i].getBoundingClientRect() });
                }

                first = false;
            } else {
                for (var i = 0; i < positions.length; i++) {
                    positions[i].Position = positions[i].Element.getBoundingClientRect();
                }
            }

            newTop = (y - startY) + myPosition.top;
            newLeft = (x - startX) + myPosition.left;

            var cursorX = newLeft + cursorOffsetX;
            var cursorY = newTop + cursorOffsetY;

            var found = [];
            for (var i = 0; i < positions.length; i++) {
                if (positions[i].Position.left <= cursorX && positions[i].Position.right >= cursorX && 
                    positions[i].Position.top <= cursorY && positions[i].Position.bottom >= cursorY) {
                    
                    if (aboveContainer != positions[i].Element) {
                        if (aboveContainer != null) {
                            aboveContainer.className = aboveContainer.className.replace(/toolkitDragDropContainerHover/g, "");
                        }
                        aboveContainer = positions[i].Element;
                        aboveContainerPosition = positions[i].Position;
                        aboveContainer.className += " toolkitDragDropContainerHover";
                    }
                    positions[i].TotalSize = positions[i].width + positions[i].height;
                    found.push(positions[i]);
                    break;
                }
            }
            if (found.length == 0 && aboveContainer != null) {
                aboveContainer.className = aboveContainer.className.replace(/toolkitDragDropContainerHover/g, "");
                aboveContainer = null;
            } else {
                // We will pick the smallest element hovered over, as that will often work fine for nested elements
                var newAboveContainer = found.OrderBy(function (a) { return a.TotalSize }).First().Element;
                if (aboveContainer != newAboveContainer) {
                    if (aboveContainer != null) {
                        aboveContainer.className = aboveContainer.className.replace(/toolkitDragDropContainerHover/g, "");
                    }
                    aboveContainer = newAboveContainer;
                    aboveContainerPosition = positions[i].Position;
                    aboveContainer.className += " toolkitDragDropContainerHover";
                }
            }

            obj.style.top = newTop + "px";
            obj.style.left = newLeft + "px";
        };

        window.onmouseup = function () {
            // If above container element, append to container element, or else move back                        
            obj.style.left = "";
            obj.style.top = "";
            obj.style.position = "relative";

            for (var i = 0; i < positions.length; i++) {
                if (positions[i].Element.className)
                    positions[i].Element.className = positions[i].Element.className.replace(/toolkitDragDropContainerArea/g, "");
            }

            if (aboveContainer) {
                aboveContainer.className = aboveContainer.className.replace(/toolkitDragDropContainerHover/g, "");

                var createdElement = null;
                if (aboveContainer.Drop) {
                    createdElement = aboveContainer.Drop(elementOrTemplateToAdd, newLeft - aboveContainerPosition.left, newTop - aboveContainerPosition.top);
                }

                if (!createdElement && elementOrTemplateToAdd == obj) {
                    if (origObj.ElementTemplate && origObj.HoverTemplate) { // Both are set, but not handled. Create a new element to add
                        // Remove hover element
                        if (obj.Remove)
                            obj.Remove();
                        else
                            obj.parentNode.removeChild(obj);

                        if (aboveContainer.Add) { // Container is a toolkit element, use the Add method
                            aboveContainer.Add(origObj.ElementTemplate);
                            obj = null; // Mark as finished
                        } else {
                            obj = TK.Initialize(origObj.ElementTemplate); // Initialize and append to this container
                        }
                    } else if (!origObj.ElementTemplate && origObj.HoverTemplate) { // Just the hover is set, add the original object to the new parent
                        // Remove hover element
                        if (obj.Remove)
                            obj.Remove();
                        else
                            obj.parentNode.removeChild(obj);

                        obj = origObj;
                    }

                    if (obj != null) {
                        aboveContainer.appendChild(obj);
                        obj.Parent = aboveContainer;
                        var newElementId = Math.random();
                        if (origParent && origParent != aboveContainer && origParent.Elements) {

                            for (var id in origParent.Elements) {
                                if (origParent.Elements[id] == obj) {
                                    delete origParent.Elements[id];
                                    newElementId = id;
                                    break;
                                }
                            }
                        }
                        if (aboveContainer.Elements) {
                            aboveContainer.Elements[newElementId] = obj;
                        }
                    }
                }

                if (origObj.Dropped) {
                    origObj.Dropped(aboveContainer, createdElement);
                }
            } else if (passedThreshold && origParent) {
                origParent.appendChild(obj);
            } else if (passedThreshold) {
                // Remove hover element
                if (obj.Remove)
                    obj.Remove();
                else
                    obj.parentNode.removeChild(obj);
            }
            

            window.onmousemove = null;
            window.onmouseup = null;
            window.onselectstart = null;
            window.ontouchmove = null;
            window.ontouchend = null;
        };
        window.ontouchmove = function (e) {
            if (window.onmousemove)
                window.onmousemove(e.touches[0]);
            e.stopPropagation();
        };
        window.ontouchend = function (e) {
            if (window.onmouseup)
                window.onmouseup();
            e.stopPropagation();
        };
        window.onselectstart = function () { return false; };

        if (e && e.preventDefault)
            e.preventDefault();
        else
            window.event.returnValue = false;
    }

};