"use strict";
window.TK.Switch = {
    TextBefore: "",
    TextAfter: "",
    Data: false,
    className: "toolkitSwitch",

    onchange: function () { },

    onclick: function () {
        this.Toggle();
    },
    Toggle: function () {
        this.Data = !this.Data;
        this.Init();
    },
    Init: function () {
        if (this.DataSettings) {
            if (this.DataSettings.TextBefore !== undefined)
                this.TextBefore = this.DataSettings.TextBefore;
            if (this.DataSettings.TextAfter !== undefined)
                this.TextAfter = this.DataSettings.TextAfter;
        }

        this.className = this.className.replace(/toolkitSwitchActive/g, "").replace(/toolkitSwitchInactive/g, "") + " " + (this.Data ? "toolkitSwitchActive" : "toolkitSwitchInactive");
        this.Elements.TextBefore.innerText = this.TextBefore;
        this.Elements.TextBefore.style.display = this.TextBefore ? "" : "none";
        this.Elements.TextAfter.innerText = this.TextAfter;
        this.Elements.TextAfter.style.display = this.TextAfter ? "" : "none";
    },
    GetValue: function () {
        return this.Data;
    },
    Elements: {
        TextBefore: {},
        SwitchContainer: {
            Elements: {
                Indicator: {
                    _: "div"
                }
            }
        },
        TextAfter: {},
    }
};


if (window.TK.Form) {
    window.TK.Form.DefaultTemplates.switch = {
        _: TK.Switch
    };
}
