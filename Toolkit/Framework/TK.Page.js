"use strict";
window.TK.Page = {
    _: "div",
    Url: "",
    Post: null,
    IsTemplate: false,
    Template: null,
    ExecuteScripts: true,
    ChangeForms: true,
    AjaxSettings: {},
    State: null,
    Init: function () {
        var obj = this;
        this.ajaxCallBack = function (response) {
            if (response && response.substr(0, 1) == "{") {
                // Response is a template
                var template = eval('(' + response + ')');
                if (obj.Template) {
                    obj.Template._ = template;
                    obj.Add(obj.Template, "page");
                } else {
                    obj.Add(template, "page");
                }
            } else {
                obj.innerHTML = response;
                if (obj.ExecuteScripts) {
                    Ajax.executeScripts(response);
                }
                if (obj.ChangeForms) {
                    var allForms = obj.querySelectorAll("form");
                    for (var i = 0; i < allForms.length; i++) {
                        allForms[i].onsubmit = function () {
                            Ajax.doAjaxFormSubmit(this, obj.ajaxCallBack);
                            return false;
                        };
                    }
                }
            }
            if (obj.Update) {
                obj.Update();
            }
        };

        if (this.Url) {
            Ajax.do(this.Url, this.Post, this.ajaxCallBack, undefined, this.AjaxSettings);
        }
    },
    Refresh: function () {
        if (this.Elements.page) {
            this.Elements.page.Remove();
        }
        this.innerHTML = "";
        this.Init();
    },
    Update: function () { }
};