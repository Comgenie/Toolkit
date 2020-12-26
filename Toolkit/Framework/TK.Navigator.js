"use strict";
window.TK.Navigator = {
    _: "div",
    DefaultHash: "index",
    Current: null,
    CurrentElement: null,
    UseTemplates: false,
    Init: function () {
        var obj = this;
        if (this.Templates) {
            this.UseTemplates = true;
        }
        this.onHashChangeHandler = function () {
            obj.Handle();
        };
        window.addEventListener("hashchange", this.onHashChangeHandler);
        if (this.NavigatorLevel === undefined) {
            this.NavigatorLevel = 0;
            var parent = this.Parent;
            while (parent) {
                if (parent.DefaultHash) {
                    // This is a navigator
                    this.NavigatorLevel++;
                }
                parent = parent.Parent;
            }
        }
        this.Handle();
    },
    Destroy: function () {
        window.removeEventListener("hashchange", this.onHashChangeHandler);
    },
    Handle: function () {
        var navigateTo = window.location.hash;
        if (navigateTo == "")
            navigateTo = this.DefaultHash;
        else
            navigateTo = navigateTo.substr(1);


        var pagePart = decodeURIComponent(navigateTo).split('/');
        if (pagePart.length <= this.NavigatorLevel) {
            pagePart.push(this.DefaultHash);
        }

        if (this.UseTemplates) { // Add new element, and destroy old elements (Slower, less memory usage)
            if (pagePart[this.NavigatorLevel] != this.Current) {
                if (this.CurrentElement) {
                    this.CurrentElement.Remove();
                }
                this.Current = pagePart[this.NavigatorLevel];
                if (this.Templates[this.Current]) {                    
                    this.CurrentElement = this.Add(this.Templates[this.Current], "current");
                }
            }
        } else { // Just hide/show elements (Faster, but more memory usage)
            this.CurrentElement = null;
            for (var elementName in this.Elements) {
                if (elementName != pagePart[this.NavigatorLevel] && this.Elements[elementName].style && this.Elements[elementName].style.display != "none")
                    this.Elements[elementName].style.display = "none";
                else if (elementName == pagePart[this.NavigatorLevel]) {
                    this.CurrentElement = this.Elements[elementName];
                    if (this.Elements[elementName].style && this.Elements[elementName].style.display != "")
                        this.Elements[elementName].style.display = "";
                }
            }
        }
        this.Current = pagePart[this.NavigatorLevel];
        pagePart.splice(0, this.NavigatorLevel + 1);
        if (this.CurrentElement && this.CurrentElement.Navigate) {
            this.CurrentElement.Navigate(pagePart);
        }
        if (this.Navigate)
            this.Navigate(this.Current);

    },
    Navigate: function (newPage) { }
};