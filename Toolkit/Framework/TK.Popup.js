"use strict";
window.TK.Popup = {
    _: "div",    
    Width: 400,
    Height: 500,
    MinWidth: 150,
    MinHeight: 150,
    Title: "Popup",
    EnableCloseButton: true,
    EnableBackDrop: false,
    EnableResize: true,
    EnableSnapping: true,
    Maximized: false,
    className: "toolkitPopup",
    Template: {},
    OnResize: function () { },
    Buttons: null,   // { Ok: function() { alert('ok pressed!'); } }
    Init: function () {        
        var obj = this;
        this.style.position = "fixed";
        this.CenterWindow();        
        this.RestoreBodyOverflow = function () {
            if (obj.OrigBodyOverflow) {
                document.body.style.overflow = obj.OrigBodyOverflow;
                obj.OrigBodyOverflow = null;
            }
        };

        this.Add({
            _: "h2",
            Elements: {
                TitleSpan: {
                    innerText: this.Title
                }
            },
            onselectstart: function () { return false; },
            ondblclick: function () {
                if (!obj.EnableResize)
                    return;

                if (obj.Maximized) {
                    obj.Maximized = false;
                    obj.RestoreBodyOverflow();

                    obj.style.left = obj.OldCords[0] + "px";
                    obj.style.top = obj.OldCords[1] + "px";
                    obj.style.width = obj.OldCords[2] + "px";
                    obj.style.height = obj.OldCords[3] + "px";
                } else {
                    obj.Maximized = true;
                    obj.OrigBodyOverflow = document.body.style.overflow;
                    if (!obj.OrigBodyOverflow)
                        obj.OrigBodyOverflow = "initial";
                    document.body.style.overflow = "hidden";

                    obj.OldCords = [obj.offsetLeft, obj.offsetTop, obj.offsetWidth, obj.offsetHeight];
                    obj.style.left = "0px";
                    obj.style.top = "0px";
                    obj.style.width = window.innerWidth + "px";
                    obj.style.height = window.innerHeight + "px";
                }

                if (obj.OnResize) {
                    obj.OnResize();
                }
            },
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

                var snapXSides = [0, window.innerWidth];
                var snapYSides = [0, window.innerHeight];
                if (obj.EnableSnapping) {
                    var allPopups = document.querySelectorAll(".toolkitPopup");
                    for (var i = 0; i < allPopups.length; i++) {
                        if (allPopups[i] == obj || !allPopups[i].parentNode)
                            continue;
                        snapXSides.push(allPopups[i].offsetLeft - 2);
                        snapXSides.push(allPopups[i].offsetLeft + allPopups[i].offsetWidth);
                        snapYSides.push(allPopups[i].offsetTop);
                        snapYSides.push(allPopups[i].offsetTop + allPopups[i].offsetHeight);
                    }
                }
                
                window.onmousemove = function (e) {
                    if (obj.Maximized) {
                        obj.Maximized = false;
                        obj.style.left = obj.OldCords[0] + "px";
                        obj.style.top = obj.OldCords[1] + "px";
                        obj.style.width = obj.OldCords[2] + "px";
                        obj.style.height = obj.OldCords[3] + "px";
                        obj.RestoreBodyOverflow();
                    }
                    var x, y;
                    try { x = e.pageX; y = e.pageY; } catch (errie) { var e2 = window.event; x = e2.clientX; y = e2.clientY; }
                    var newLeft = (x - startX);
                    var newTop = (y - startY);
                    if (obj.EnableSnapping) {
                        for (var i = 0; i < snapXSides.length; i++) {
                            if (Math.abs(snapXSides[i] - newLeft) < 10) {
                                newLeft = snapXSides[i];
                            } else if (Math.abs(snapXSides[i] - (newLeft + startWidth)) < 10) {
                                newLeft = snapXSides[i] - startWidth;
                            }
                        }

                        for (var i = 0; i < snapYSides.length; i++) {
                            if (Math.abs(snapYSides[i] - newTop) < 10) {
                                newTop = snapYSides[i];
                            } else if (Math.abs(snapYSides[i] - (newTop + startHeight)) < 10) {
                                newTop = snapYSides[i] - startHeight;
                            }
                        }
                    }

                    obj.style.left = newLeft + "px";
                    obj.style.top = newTop + "px";
                };
                window.onmouseup = function () {
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
        }, "PopupTitle");
        
        if (this.EnableResize) {
            this.Add({
                _: "button",
                innerHTML: "",
                onselectstart: function () { return false; },
                ontouchstart: function (e) {
                    this.onmousedown(e.touches[0]);
                    e.stopPropagation();
                },
                onmousedown: function (e) {
                    var x, y;
                    try { x = e.pageX; y = e.pageY; } catch (errie) { var e2 = window.event; x = e2.clientX; y = e2.clientY; }
                    var startX = x;
                    var startY = y;
                    var startWidth = obj.offsetWidth;
                    var startHeight = obj.offsetHeight;                    

                    window.onselectstart = function () { return false; };
                    window.onmousemove = function (e) {
                        obj.Maximized = false;
                        obj.RestoreBodyOverflow();
                        var x, y;
                        try { x = e.pageX; y = e.pageY; } catch (errie) { var e2 = window.event; x = e2.clientX; y = e2.clientY; }

                        var newWidth = startWidth + (x - startX);
                        if (newWidth < obj.MinWidth)
                            newWidth = obj.MinWidth;

                        var newHeight = startHeight + (y - startY);
                        if (newHeight < obj.MinWidth)
                            newHeight = obj.MinWidth;

                        obj.style.width = newWidth + "px";
                        obj.style.height = newHeight + "px";

                        window.onmouseup = function () {
                            window.onmousemove = null;
                            window.onselectstart = null;
                            window.ontouchmove = null;
                            window.ontouchend = null;
                            if (obj.OnResize) {
                                obj.OnResize();
                            }
                        };
                        if (e && e.preventDefault)
                            e.preventDefault();
                        else
                            window.event.returnValue = false;
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
                }
            }, "ResizeButton");
        }		


        if (this.EnableCloseButton) {
            this.Add({
                _: "button",
                innerHTML: "x",
                onclick: function () {
                    //this.Parent.parentNode.removeChild(this.Parent);
                    this.Parent.Remove();
                }
            }, "CloseButton");
        }

        if (this.Buttons) {
            var buttonBar = {
                className: "toolkitButtonBar",
                Elements: {}
            };
            this.className += " toolkitPopupWithButtonBar";
            for (var name in this.Buttons) {
                if (typeof this.Buttons[name] === 'function') {
                    this.Buttons[name] = {
                        Click: this.Buttons[name]
                    };
                }
                buttonBar.Elements[name + "Button"] = {
                    _: this.Buttons[name],
                    ButtonName: name,
                    Init: function () {
                        this.appendChild(document.createTextNode(this.Text ? this.Text : this.ButtonName));
                    },
                    onclick: function () {
                        var cancelClosePopup = false;
                        if (this.Click)
                            cancelClosePopup = this.Click();
                        if (!cancelClosePopup)
                            this.Parent.Parent.Remove();
                    }
                };
            }
            this.Add(buttonBar, "ButtonBar");
        }

        this.Add(this.Template, "Content");

        if (this.EnableBackDrop) {
            this.BackDrop = document.createElement("DIV");
            this.BackDrop.className = "toolkitPopupBackDrop";
            this.BackDrop.style.position = "fixed";
            this.BackDrop.style.top = "0px";
            this.BackDrop.style.right = "0px";
            this.BackDrop.style.bottom = "0px";
            this.BackDrop.style.left = "0px";
            this.BackDrop.style.zIndex = (window.TK.Popup.StartZIndex++);
            document.body.appendChild(this.BackDrop);
        }

        this.style.zIndex = (window.TK.Popup.StartZIndex++);
        document.body.appendChild(this); // Move myself to the body element
        if (this.Maximized || window.innerWidth < this.Width || window.innerHeight < this.Height) {
            this.Maximized = false;
            this.Elements.PopupTitle.ondblclick();
        }
    },
    Destroy: function () {
        if (this.BackDrop) {
            this.BackDrop.parentNode.removeChild(this.BackDrop);
        }
        this.RestoreBodyOverflow();
    },
    onmousedown: function () {
        this.style.zIndex = (window.TK.Popup.StartZIndex++);
    },
    CenterWindow: function () {
        
        this.style.width = this.Width + "px";
        this.style.height = this.Height + "px";
        this.style.top = Math.round((window.innerHeight / 2) - (this.Height / 2)) + "px";
        this.style.left = Math.round((window.innerWidth / 2) - (this.Width / 2)) + "px";
    }
};
window.TK.Popup.StartZIndex = 10000;
window.TK.PopupOpen = function (template, title, width, height) {
    TK.Initialize({
        _: TK.Popup,
        Width: width ? width : 600,
        Height: height ? height : 500,
        Title: title,
        Template: template
    });
};