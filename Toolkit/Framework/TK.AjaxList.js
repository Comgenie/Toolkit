"use strict";
window.TK.AjaxList = {
    _: "div",
    Url: "",
    Post: null,
    IdField: "Id",
    Template: {},
    AjaxSettings: {},
    UseVariable: null,
    Init: function () {
        var obj = this;
        if (this.Url) {
            Ajax.do(this.Url, this.Post, function (response) {
                obj.AddMultiple(obj.Template, JSON.parse(response), obj.IdField, obj.UseVariable);
            }, undefined, this.AjaxSettings);
        }
    },
    Refresh: function () {
        this.Init();
    }
};