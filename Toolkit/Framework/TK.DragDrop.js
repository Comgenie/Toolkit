"use strict";

window.TK.DragDrop = {
    _: "div",    
    className: "toolkitDragDrop",
    Init: function () {
        this.style.position = "relative";
    },
    Type: "",
    Threshold: 10,
    ElementTemplate: null, // When set, the current element will not be moved, but a new element will be created by this
    ontouchstart: function (e) {
        this.onmousedown(e.touches[0]);
        e.stopPropagation();
    },
    onmousedown: function (e) {
        var startX, startY;
        try { startX = e.clientX; startY = e.clientY; } catch (errie) { var e2 = window.event; startX = e2.clientX; startY = e2.clientY; }

        var obj = this;
        var origParent = this.parentNode;
        var myPosition = this.getBoundingClientRect();
        var cursorOffsetX = startX - myPosition.left;
        var cursorOffsetY = startY - myPosition.top;
        
        var containers = document.querySelectorAll(".toolkitDragDropContainer");        

        var positions = [];
        for (var i = 0; i < containers.length; i++) {
            if (containers[i].DropFilter && (!obj.Type || containers[i].DropFilter.indexOf(obj.Type) < 0))
                continue;
            
            positions.push({ Element: containers[i], Position: containers[i].getBoundingClientRect() });
        }

        var newTop, newLeft;
        var first = true;
        var passedThreshold = false;
        var aboveContainer = null;
        var aboveContainerPosition = null;
        window.onmousemove = function (e) {
            var x, y;
            try { x = e.clientX; y = e.clientY; } catch (errie) { var e2 = window.event; x = e2.clientX; y = e2.clientY; }

            if (!passedThreshold && (Math.abs(startX - x) < obj.Threshold && Math.abs(startY - y) < obj.Threshold))
                return;
            passedThreshold = true;

            for (var i = 0; i < positions.length; i++) {
                positions[i].Position = positions[i].Element.getBoundingClientRect();
            }

            if (first) {
                if (obj.ElementTemplate) {
                    obj = obj.Add(obj.ElementTemplate);
                    origParent = null;
                }
                obj.style.position = "fixed";
                document.body.appendChild(obj);
                first = false;
            }

            newTop = (y - startY) + myPosition.top;
            newLeft = (x - startX) + myPosition.left;

            var cursorX = newLeft + cursorOffsetX;
            var cursorY = newTop + cursorOffsetY;

            var found = false;
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
                    found = true;
                    break;
                }
            }
            if (!found && aboveContainer != null) {
                aboveContainer.className = aboveContainer.className.replace(/toolkitDragDropContainerHover/g, "");
                aboveContainer = null;
            }

            obj.style.top = newTop + "px";
            obj.style.left = newLeft + "px";
        };

        window.onmouseup = function () {
            // If above container element, append to container element, or else move back                        
            obj.style.left = "";
            obj.style.top = "";
            obj.style.position = "relative";

            if (aboveContainer) {
                aboveContainer.className = aboveContainer.className.replace(/toolkitDragDropContainerHover/g, "");
                if (aboveContainer.Drop) {
                    aboveContainer.Drop(obj, newLeft - aboveContainerPosition.left, newTop - aboveContainerPosition.top);
                }

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
            } else if (passedThreshold && origParent) {
                origParent.appendChild(obj);
            } else if (passedThreshold) {
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