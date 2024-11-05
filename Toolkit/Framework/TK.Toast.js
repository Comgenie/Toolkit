"use strict";
window.TK.Toast = {
    _: "component",
    Template: {
        _: "div",
        className: "toolkitToast",
        Title: "",
        Message: "",
        Action: null,
        Init: function () {
            if (this.Title) {
                this.Elements.TitleH3.appendChild(document.createTextNode(this.Title));
            } else {
                this.Elements.TitleH3.style.display = "none";
            }
            this.Elements.Message.appendChild(document.createTextNode(this.Message));
        },
        onclick: function () {
            if (this.Action)
                this.Action(this);            
        },
        Elements: {
            TitleH3: {},
            Message: {}
        },
        Destroy: function () {
            var obj = this;
            TK.Toast.CurrentToasts = TK.Toast.CurrentToasts.Where(function (a) { return a != obj });
        }
    },
    Position: 0,  // 0 Top, 0.5 Top right, 1 Right, 1.5 Bottom right, 2 Bottom, 2.5 Bottom left, 3 Left, 3.5 Top left
    VisibleMS: 3000,
    Width: 250,
    Height: 100,
    CurrentToasts: [],
    Create: function (title, message, action, customTemplate) {

        if (customTemplate && !customTemplate._) {
            customTemplate._ = this.Template;
        }
        
        var toast = TK.Initialize({ _: customTemplate ? customTemplate : this.Template, Title: title, Message: message, Action: action });
        toast.style.position = "fixed";
        toast.style.width = this.Width + "px";
        
        var offset = 5;
        var offsetStep = this.Position == 1 || this.Position == 3 ? this.Width : this.Height;
        for (var i = 0; i < TK.Toast.CurrentToasts.length; i++) {
            if (TK.Toast.CurrentToasts[i].ToastOffset + offsetStep > offset && TK.Toast.CurrentToasts[i].ToastPosition == this.Position) {
                offset = TK.Toast.CurrentToasts[i].ToastOffset + offsetStep + 5;
            }
        }
        toast.ToastOffset = offset;
        toast.ToastPosition = this.Position;
        TK.Toast.CurrentToasts.push(toast);
        //toast.style.height = this.Height + "px";
        if (this.Position == 0) {
            toast.style.top = offset + "px";
            toast.style.left = ((window.innerWidth / 2) - (this.Width / 2)) + "px";
        } else if (this.Position == 0.5) {
            toast.style.top = offset + "px";
            toast.style.right = "5px";
        } else if (this.Position == 1) {
            toast.style.top = ((window.innerHeight / 2) - (this.Height / 2)) + "px";
            toast.style.right = offset + "px";
        } else if (this.Position == 1.5) {
            toast.style.bottom = offset + "px";
            toast.style.right = "5px";
        } else if (this.Position == 2) {
            toast.style.bottom = offset +"px";
            toast.style.left = ((window.innerWidth / 2) - (this.Width / 2)) + "px";
        } else if (this.Position == 2.5) {
            toast.style.bottom = offset +"px";
            toast.style.left = "5px";
        } else if (this.Position == 3) {
            toast.style.top = ((window.innerHeight / 2) - (this.Height / 2)) + "px";
            toast.style.left = offset +"px";
        } else if (this.Position == 3.5) {
            toast.style.top = offset + "px";
            toast.style.left = "5px";
        }
        document.body.appendChild(toast);
        setTimeout(function () {
            toast.className += " toolkitVisible";
        }, 10);
        setTimeout(function () {
            toast.Remove();
        }, this.VisibleMS);

        

        return toast;
    }
};