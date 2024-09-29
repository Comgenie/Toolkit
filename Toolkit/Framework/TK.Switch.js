"use strict";
/* Minify Order(200) */
window.TK.Switch = {
    TextBefore: "",
    TextAfter: "",
    Data: false,
    className: "toolkitSwitch",
    onchange: function () { },
    readOnly: false,
    disabled: false,

    onclick: function () {
        this.Toggle();
    },
    Toggle: function () {
        if (this.readOnly || this.disabled)
            return;
        this.Data = !this.Data;
        if (this.onchange)
            this.onchange();
        this.Init();
    },
    Init: function () {
        if (this.DataSettings) {
            if (this.DataSettings.TextBefore !== undefined)
                this.TextBefore = this.DataSettings.TextBefore;
            if (this.DataSettings.TextAfter !== undefined)
                this.TextAfter = this.DataSettings.TextAfter;
        }

        this.className = this.className.replace(/toolkitSwitchActive/g, "").replace(/toolkitSwitchInactive/g, "").replace(/toolkitSwitchDisabled/g, "").replace(/toolkitSwitchReadOnly/g, "") + " "
            + (this.disabled ? "toolkitSwitchDisabled" : "")
            + " " + (this.readOnly ? "toolkitSwitchReadOnly" : "")
            + " " + (this.Data ? "toolkitSwitchActive" : "toolkitSwitchInactive");
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
