"use strict";
/* Minify Order(110) */
// Dragable items on a board
window.TK.Dashboard = {
    _: "div",
    EnableMove: true,
    EnableCopy: true,
    EnableResize: true,
    EnableRemove: true,
    EnableEdit: true,
    EnableLimitX: true,
    EnableLimitY: true,
    Spacing: 5,
    SnapSize: 100,
    EditMode: 1, // 0: None, 1: Show edit buttons when hovering, 2: Always show edit buttons
    className: "toolkitDashboard",    
    DashboardItems: [],
    DefaultWidth: 600,
    AutoGrow: true, // Automatic increase size of this element (Adds [SnapSize] spacing to this div when moving/resizing elements)
    AutoShrink: false,

    Init: function () {
        this.SetEditMode(this.EditMode);
        
        if (this.DashboardItems) {
            var obj = this;
            setTimeout(function () {
                obj.Load(obj.DashboardItems);
            }, 1);
        }
    },
    SetEditMode: function (newEditMode) {
        this.EditMode = newEditMode;
        var newClassName = this.className.replace(/toolkitDashboardEditable/g, "").replace(/toolkitDashboardAlwaysEditable/g, "");

        if (this.EditMode == 1)
            newClassName += " toolkitDashboardEditable";
        else if (this.EditMode == 2)
            newClassName += " toolkitDashboardAlwaysEditable";
        this.className = newClassName;
    },
    Save: function () {
        var state = [];
        var items = this.Elements.ToArray();
        for (var i = 0; i < items.length; i++) {
            if (!items[i].Elements || !items[i].Elements.Content || !items[i].Elements.Content.StateProperties)
                continue;
            var c = items[i].Elements.Content;
            var stateProperties = {};
            for (var j = 0; j < c.StateProperties.length; j++) {
                stateProperties[c.StateProperties[j]] = c[c.StateProperties[j]];
            }
            state.push({ _: c.StateObjectName, State: stateProperties, Top: items[i].Top, Left: items[i].Left, Width: items[i].Width, Height: items[i].Height });
        }
        this.DashboardItems = state;
        return JSON.stringify(state);
    },
    Load: function (state) {
        if (state.substr)
            state = JSON.parse(state);
        this.Clear();       
        var regex = /[^A-Za-z0-9\.]/g;
        for (var i = 0; i < state.length; i++) {
            if (regex.exec(state[i]._))
                continue;
            var tmp = eval(state[i]._ + ".StateObjectName");
            if (!tmp)
                continue;
            var stateProperties = state[i].State;
            stateProperties._ = state[i]._;
            this.AddDashboardItem(stateProperties, null, state[i].Left, state[i].Top, state[i].Width, state[i].Height);
        }
    },
    AutoGrowHandler: function (restore) {
        if (restore) {
            this.className = this.className.replace(/toolkitDashboardEditing/g, "");
        } else if (this.className.indexOf("Editing") < 0) {            
            this.className += " toolkitDashboardEditing";
        }

        if (!this.AutoGrow || this.offsetHeight == 0)
            return;

        var items = this.Elements.ToArray();
        var maxBottomY = 0;
        for (var i = 0; i < items.length; i++) {
            if (!items[i].Elements || !items[i].Elements.Content || !items[i].Height)
                continue;
            var bottomY = this.TopOrLeftSquaresToPX(items[i].Top) + this.HeightOrWidthSquaresToPX(items[i].Height);
            if (maxBottomY < bottomY)
                maxBottomY = bottomY;
        }
        var newHeight = maxBottomY + (this.SnapSize + this.Spacing);
        if (!this.style.height || parseInt(this.style.height) < newHeight || this.AutoShrink)
            this.style.height = newHeight + "px";
    },

    TemplateDashboardItem: {
        style: {
            position: "absolute"
        },
        DashboardElement: null,
         // Position/Sizes are in snap-index
        Left: 0,
        Top: 0,
        Width: 1,
        Height: 1,
        ontouchstart: function () {
            if (this.DashboardElement.EditMode == 0)
                return;

            if (this.className.indexOf("toolkitSelectedDashboardItem") < 0) {
                this.className += " toolkitSelectedDashboardItem";
            } else {
                this.className = this.className.replace(/toolkitSelectedDashboardItem/g, "");
            }            
        },
        Init: function () {
            var obj = this;
            if (this.DashboardElement.EnableMove) {
                this.Add({
                    _: "div",
                    className: "tkDashboardButton",
                    innerHTML: Svg.Icons.Move,
                    ontouchstart: function (e) {
                        this.onmousedown(e.touches[0]);
                        e.stopPropagation();
                    },
                    onmousedown: function (e) {
                        var x, y;
                        try { x = e.pageX; y = e.pageY; } catch (errie) { var e2 = window.event; x = e2.clientX; y = e2.clientY; }
                        var startX = x - obj.offsetLeft;
                        var startY = y - obj.offsetTop;
                        var startWidth = obj.offsetWidth;
                        var startHeight = obj.offsetHeight;
                        var totalWidth = obj.DashboardElement.offsetWidth;
                        var totalHeight = obj.DashboardElement.offsetHeight;

                        window.onmousemove = function (e) {
                            var x, y;
                            try { x = e.pageX; y = e.pageY; } catch (errie) { var e2 = window.event; x = e2.clientX; y = e2.clientY; }
                            var newLeft = (x - startX);
                            var newTop = (y - startY);
                            var size = obj.DashboardElement.SnapSize + obj.DashboardElement.Spacing;
                            newTop = Math.round(newTop / size);
                            newLeft = Math.round(newLeft / size);
                            if (newTop < 0) newTop = 0;
                            if (newLeft < 0) newLeft = 0;

                            totalWidth = obj.DashboardElement.offsetWidth;
                            totalHeight = obj.DashboardElement.offsetHeight;

                            if (obj.DashboardElement.EnableLimitX && totalWidth > 0 && (newLeft * size) + startWidth > totalWidth) newLeft = Math.floor((totalWidth - startWidth) / size);
                            if (obj.DashboardElement.EnableLimitY && totalHeight > 0 && (newTop * size) + startHeight > totalHeight) newTop = Math.floor((totalHeight - startHeight) / size);

                            obj.Left = newLeft;
                            obj.Top = newTop;
                            obj.SetSize();
                            obj.DashboardElement.AutoGrowHandler();
                        };
                        
                        window.onmouseup = function () {
                            window.onmousemove = null;
                            window.onmouseup = null;
                            window.onselectstart = null;
                            window.ontouchend = null;
                            window.ontouchmove = null;
                            obj.DashboardElement.AutoGrowHandler(true);
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
                }, "MoveButton");
            }

            if (this.DashboardElement.EnableResize) {
                this.Add({
                    _: "div",
                    className: "tkDashboardButton",
                    innerHTML: Svg.Icons.Resize,
                    ontouchstart: function (e) {
                        this.onmousedown(e.touches[0]);
                        e.stopPropagation();
                    },
                    onmousedown: function (e) {
                        var startX, startY;
                        try { startX = e.pageX; startY = e.pageY; } catch (errie) { var e2 = window.event; startX = e2.clientX; startY = e2.clientY; }
                        var startWidth = obj.offsetWidth;
                        var startHeight = obj.offsetHeight;
                        var totalWidth = obj.DashboardElement.offsetWidth;
                        var totalHeight = obj.DashboardElement.offsetHeight;

                        window.onmousemove = function (e) {
                            var x, y;
                            try { x = e.pageX; y = e.pageY; } catch (errie) { var e2 = window.event; x = e2.clientX; y = e2.clientY; }
                            var newWidth = (x - startX) + startWidth;
                            var newHeight = (y - startY) + startHeight;
                            var size = obj.DashboardElement.SnapSize;
                            newHeight = Math.round(newHeight / size);
                            newWidth = Math.round(newWidth / size);

                            var newWidthPx = ((newWidth * obj.DashboardElement.SnapSize) + ((newWidth - 1) * obj.DashboardElement.Spacing));                            
                            var newHeightPx = ((newHeight * obj.DashboardElement.SnapSize) + ((newHeight - 1) * obj.DashboardElement.Spacing));

                            totalWidth = obj.DashboardElement.offsetWidth;
                            totalHeight = obj.DashboardElement.offsetHeight;

                            if (obj.DashboardElement.EnableLimitX && totalWidth > 0 && obj.DashboardElement.TopOrLeftSquaresToPX(obj.Left) + newWidthPx > totalWidth) newWidth = Math.floor((totalWidth + obj.DashboardElement.Spacing) / (size + obj.DashboardElement.Spacing)) - obj.Left;
                            if (obj.DashboardElement.EnableLimitY && totalHeight > 0 && obj.DashboardElement.TopOrLeftSquaresToPX(obj.Top) + newHeightPx > totalHeight) newHeight = Math.floor((totalHeight + obj.DashboardElement.Spacing) / (size + obj.DashboardElement.Spacing)) - obj.Top;

                            obj.Width = newWidth;
                            obj.Height = newHeight;
                            obj.SetSize(true);
                            obj.DashboardElement.AutoGrowHandler();
                            
                        };
                        window.onmouseup = function () {
                            window.onmousemove = null;
                            window.onmouseup = null;
                            window.onselectstart = null;
                            window.ontouchend = null;
                            window.ontouchmove = null;
                            obj.DashboardElement.AutoGrowHandler(true);
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
                }, "ResizeButton");
            }

            if (this.DashboardElement.EnableRemove) {
                this.Add({
                    _: "div",
                    className: "tkDashboardButton",
                    innerHTML: Svg.Icons.Close,
                    ontouchstart: function (e) {
                        e.stopPropagation();
                    },
                    onclick: function () {
                        obj.Remove();
                    }
                }, "RemoveButton");
            }

            if (this.DashboardElement.EnableEdit && this.Elements.Content && this.Elements.Content.Editor) {
                this.Add({
                    _: "div",
                    className: "tkDashboardButton",
                    innerHTML: Svg.Icons.Settings,
                    ontouchstart: function (e) {
                        e.stopPropagation();
                    },
                    onclick: function () {
                        obj.Elements.Content.Add({ _: obj.Elements.Content.Editor });
                    }
                }, "EditButton");
            }

            if (this.DashboardElement.EnableCopy) {
                this.Add({
                    _: "div",
                    className: "tkDashboardButton",
                    innerHTML: Svg.Icons.Copy,
                    ontouchstart: function (e) {
                        this.onmousedown(e.touches[0]);
                        e.stopPropagation();
                    },
                    onmousedown: function (e) {
                        var x, y;
                        try { x = e.pageX; y = e.pageY; } catch (errie) { var e2 = window.event; x = e2.clientX; y = e2.clientY; }
                        var startX = x - obj.offsetLeft;
                        var startY = y - obj.offsetTop;
                        var startWidth = obj.offsetWidth;
                        var startHeight = obj.offsetHeight;
                        var totalWidth = obj.DashboardElement.offsetWidth;
                        var totalHeight = obj.DashboardElement.offsetHeight;

                        var duplicate = null;
                        window.onmousemove = function (e) {                            

                            var x, y;
                            try { x = e.pageX; y = e.pageY; } catch (errie) { var e2 = window.event; x = e2.clientX; y = e2.clientY; }
                            var newLeft = (x - startX);
                            var newTop = (y - startY);
                            var size = obj.DashboardElement.SnapSize + obj.DashboardElement.Spacing;
                            newTop = Math.round(newTop / size);
                            newLeft = Math.round(newLeft / size);
                            if (newTop < 0) newTop = 0;
                            if (newLeft < 0) newLeft = 0;

                            totalWidth = obj.DashboardElement.offsetWidth;
                            totalHeight = obj.DashboardElement.offsetHeight;

                            if (obj.DashboardElement.EnableLimitX && totalWidth > 0 && (newLeft * size) + startWidth > totalWidth) newLeft = Math.floor((totalWidth - startWidth) / size);
                            if (obj.DashboardElement.EnableLimitY && totalHeight > 0 && (newTop * size) + startHeight > totalHeight) newTop = Math.floor((totalHeight - startHeight) / size);

                            if (newLeft == obj.Left && newTop == obj.Top)
                                return;

                            if (!duplicate) {           
                                var c = obj.Elements.Content;
                                var stateProperties = {}                                
                                for (var i = 0; c.StateProperties && i < c.StateProperties.length; i++) {
                                    stateProperties[c.StateProperties[i]] = c[c.StateProperties[i]];
                                }
                                stateProperties = JSON.parse(JSON.stringify(stateProperties)); // Make sure all objects are cloned   
                                stateProperties._ = c.StateObjectName;
                                
                                duplicate = obj.DashboardElement.AddDashboardItem(stateProperties);
                                duplicate.Width = obj.Width;
                                duplicate.Height = obj.Height;
                            }

                            duplicate.Left = newLeft;
                            duplicate.Top = newTop;
                            duplicate.SetSize();
                            obj.DashboardElement.AutoGrowHandler();
                        };
                        window.onmouseup = function () {
                            window.onmousemove = null;
                            window.onmouseup = null;
                            window.onselectstart = null;
                            window.ontouchend = null;
                            window.ontouchmove = null;
                            obj.DashboardElement.AutoGrowHandler(true);
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
                }, "CopyButton");
            }

            this.SetSize();
        },
        SetSize: function (sizeActuallyChanged) {
            var newWidth = this.DashboardElement.HeightOrWidthSquaresToPX(this.Width) + "px";
            var newHeight = this.DashboardElement.HeightOrWidthSquaresToPX(this.Height) + "px";
            this.style.top = this.DashboardElement.TopOrLeftSquaresToPX(this.Top) + "px";
            this.style.left = this.DashboardElement.TopOrLeftSquaresToPX(this.Left) + "px";

            if (newWidth != this.style.width || newHeight != this.style.height) {
                this.style.width = this.DashboardElement.HeightOrWidthSquaresToPX(this.Width) + "px";
                this.style.height = this.DashboardElement.HeightOrWidthSquaresToPX(this.Height) + "px";
            } else {
                sizeActuallyChanged = false;
            }

            if (sizeActuallyChanged && this.Elements.Content.SizeChanged)
                this.Elements.Content.SizeChanged();
        }
    },
    TopOrLeftSquaresToPX: function (topOrLeft) {
        return (topOrLeft * (this.SnapSize + this.Spacing));
    },
    HeightOrWidthSquaresToPX: function (heightOrWidth) {
        return ((heightOrWidth * this.SnapSize) + ((heightOrWidth - 1) * this.Spacing));
    },
    AddDashboardItem: function (element, name, x, y, width, height) {
        if (!width) width = 1;
        if (!height) height = 1;

        if (x === undefined || x === null || y === null || y === undefined) {
            // Auto find available place            
            var totalWidth = this.offsetWidth;
            if (totalWidth == 0)
                totalWidth = this.DefaultWidth;
            
            var totalWidthInSquares = Math.floor((totalWidth + this.Spacing) / (this.SnapSize + this.Spacing));
            
            y = 0;
            var found = false;
            while (y < 100) {                
                x = 0;
                while (x <= totalWidthInSquares - width) {
                    // Check if there is overlap with existing items
                    var items = this.Elements.ToArray();
                    found = true;                    
                    for (var i = 0; i < items.length; i++) {
                        if (!items[i].Elements || !items[i].Elements.Content || !items[i].Height)
                            continue;                        
                        if (x >= items[i].Left + items[i].Width || items[i].Left >= x + width)
                            continue;
                        if (y >= items[i].Top + items[i].Height || items[i].Top >= y + height)
                            continue;
                        found = false;
                        break;
                    }
                    if (found)
                        break;
                    x++;
                }             
                if (found)
                    break;
                y++;
            }            
        }


        var addedBlock = this.Add({
            _: this.TemplateDashboardItem,
            DashboardElement: this,
            Elements: {
                Content: element
            },
            Top: y,
            Left: x,
            Width: width,
            Height: height 
        }, name);
        this.AutoGrowHandler(true);
        return addedBlock;
    }
};

// Items with a saveable state
window.TK.DashboardTemplates = {};
window.TK.DashboardTemplates.BaseWithEditor = {
    Editor: {
        _: TK.Popup,
        Title: "Edit block",
        Template: {            
            Init: function () {
                var element = this.Parent.Parent;
                var properties = {};
                for (var i = 0; i < element.StateProperties.length; i++)
                    properties[element.StateProperties[i]] = element.Properties && element.Properties[element.StateProperties[i]] ? element.Properties[element.StateProperties[i]] : { };
                
                this.Add({
                    _: TK.Form,
                    Model: element,
                    Fields: properties,
                    IgnoreRest: true,
                    ApplyToModelDirectly: true,
                    Save: function () {
                        element.Init();
                    }
                });
            }
        }
    }
};

window.TK.DashboardTemplates.Text = {
    _: window.TK.DashboardTemplates.BaseWithEditor,
    StateObjectName: "TK.DashboardTemplates.Text",
    StateProperties: ["Text"],
    Text: null,
    Init: function () {
        if (this.Text) {
            var obj = this;
            this.Clear();
            this.Add({
                _: "span",
                Init: function () {
                    this.appendChild(document.createTextNode(obj.Text));
                }
            });
        }
    }
};