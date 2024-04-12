"use strict";

/* Minify Order(200) */
window.TK.ButtonSwitcher = {
    className: "toolkitButtonSwitcher",
    Data: null,
    Init: function () {
        if (!this.DataSettings) {
            this.DataSettings = {
                Options: this.Options,
                Multiple: this.Multiple,
                MultipleCheck: this.MultipleCheck
            };
            
        }
        
        var obj = this;
        for (var i = 0; i < this.DataSettings.Options.length; i++) {
            var isActive = this.DataSettings.Multiple ? this.Data && this.Data.indexOf(this.DataSettings.Options[i].Value) >= 0 : this.Data == this.DataSettings.Options[i].Value;
            this.Add({
                style: {
                    backgroundImage: this.DataSettings.Options[i].Image ? "url('" + this.DataSettings.Options[i].Image + "')" : null
                },
                className: "toolkitButtonSwitchOption " + (isActive ? "toolkitButtonSwitchActive" : ""),
                title: this.DataSettings.Options[i].Title ? this.DataSettings.Options[i].Title : "",
                innerHTML: this.DataSettings.Options[i].Text ? this.DataSettings.Options[i].Text : "&nbsp;",
                Value: this.DataSettings.Options[i].Value,
                onclick: function () {
                    var buttons = obj.Elements.ToArray();
                    var multiple = obj.DataSettings.Multiple;
                    var currentChecked = this.className.indexOf("toolkitButtonSwitchActive") >= 0;
                    if (obj.DataSettings.MultipleCheck && !currentChecked) {
                        var curSelected = obj.GetValue();
                        if (curSelected == null)
                            curSelected = [];
                        if (!obj.DataSettings.MultipleCheck(curSelected, this.Value)) {
                            multiple = false; // deselect rest as this combination isn't allowed
                        }
                    }

                    if (!multiple) {
                        for (var i = 0; i < buttons.length; i++) {
                            buttons[i].className = buttons[i].className.replace(/toolkitButtonSwitchActive/g, "");
                        }
                        this.className += " toolkitButtonSwitchActive";
                    } else {
                        if (currentChecked) {
                            var curSelected = obj.GetValue();
                            if (!obj.DataSettings.Required || (curSelected && curSelected.length > 1))
                                this.className = this.className.replace(/toolkitButtonSwitchActive/g, "");
                        } else
                            this.className += " toolkitButtonSwitchActive";
                    }

                    obj.Data = this.Value;
                    if (obj.onchange)
                        obj.onchange();
                }
            });
        }
    },
    GetValue: function () {
        if (this.DataSettings.Multiple) {
            var buttons = this.Elements.ToArray();
            var selected = [];
            for (var i = 0; i < buttons.length; i++) {
                if (buttons[i].className.indexOf("toolkitButtonSwitchActive") >= 0) {
                    selected.push(buttons[i].Value);
                }
            }
            return selected.length > 0 ? selected : null;
        }
        return this.Data;
    }
};

if (window.TK.Form) {
    window.TK.Form.DefaultTemplates.buttonSwitcher = {
        _: TK.ButtonSwitcher
    };
}