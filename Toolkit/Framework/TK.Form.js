"use strict";
window.TK.Form = {
    _: "form",
    className: "toolkitForm",
    Model: null,
    DefaultModel: null,
    ModelProperty: "Model",
    Fields: null, // fieldName: { Required: false, DisplayName: "Field1", Type: "number", Template: {..} }
    SortByFields: false,
    IgnoreRest: false,
    CurrentFields: null,     
    SaveButtonText: "Save",
    AutoSave: false,
    RequiredText: "The following fields are required: ",
    ApplyToModelDirectly: false,
    RemoveValueOfNotVisibleFields: true, // If false, a field hidden by IsVisible will still keep its value when saving
    CustomValidation: function (model, callBackResult) { callBackResult([]); }, // Callback with an array of errors. If the array is empty or undefined, the validation is seen as passed.
    DefaultTemplates: {
        text: {
            _: "input",
            type: "text",
            Init: function () { this.value = this.Data; },
            GetValue: function () { return this.value; }
        },
        textarea: {
            _: "textarea",
            Init: function () { this.value = this.Data; },
            GetValue: function () { return this.value; }
        },
        textarray: {
            _: "div",
            className: "textArray",
            TemplateEditableDiv: {
                className: "textArrayItem",
                Data: null,
                PlaceHolder: null,
                Init: function () {
                    if (this.PlaceHolder) {
                        this.Elements.Content.value = this.PlaceHolder;
                        this.className += " newItem";
                        this.Elements.RemoveButton.style.display = "none";
                    } else {
                        this.Elements.Content.value = this.Data;
                    }
                },
                Elements: {
                    ContentSize: {
                        _: "div",
                        style: {
                            position: "absolute",
                            height: "0px",
                            overflow: "hidden",
                            maxWidth: "70%"
                        }
                    },
                    Content: {
                        _: "input",
                        onfocus: function () {
                            if (this.Parent.PlaceHolder) {
                                this.value = "";
                                delete this.Parent.PlaceHolder;
                                this.Parent.className = "textArrayItem";
                                this.Parent.Elements.RemoveButton.style.display = "";
                                this.Parent.OnUse();
                            }
                        },
                        oninput: function () {
                            this.Parent.Elements.ContentSize.textContent = this.value;
                            this.style.width = (this.Parent.Elements.ContentSize.offsetWidth + 5) + "px";
                        },
                        onblur: function () {
                            if (this.value == "")
                                this.Parent.Remove();
                        }
                    },
                    RemoveButton: {
                        innerHTML: "X",
                        tabIndex: -1,
                        onclick: function () {
                            this.Parent.Remove();
                        }
                    }
                },
                OnUse: function () {

                }
            },
            Init: function () {
                for (var i = 0; i < this.Data.length; i++) {
                    this.Add({
                        _: this.TemplateEditableDiv,
                        Data: this.Data[i]
                    });
                }
                this.AddNewItem();
            },
            AddNewItem: function () {
                var obj = this;
                this.Add({
                    _: this.TemplateEditableDiv,
                    Data: null,
                    PlaceHolder: "New item",
                    OnUse: function () {
                        obj.AddNewItem();
                    }
                });
                this.ResizeAllElements();
            },
            ResizeAllElements: function () {
                var obj = this;
                setTimeout(function () {
                    for (var name in obj.Elements) {
                        if (!obj.Elements[name].Elements)
                            continue;
                        obj.Elements[name].Elements.Content.oninput();
                    }
                }, 1);
            },
            GetValue: function () {
                var items = this.Elements.ToArray();
                var value = [];
                for (var i = 0; i < items.length; i++) {
                    if (items[i].Elements.Content.value != "" && !items[i].PlaceHolder)
                        value.push(items[i].Elements.Content.value);
                }
                return value;
            }
        },
        number: {
            _: "input",
            type: "number",
            step: "any",
            className: "digits",
            Init: function () { this.value = this.Data; },
            GetValue: function () {
                if (this.value == "")
                    return null;
                return parseFloat(this.value);
            }
        },
        password: {
            _: "input",
            type: "password",
            Init: function () { this.value = this.Data; },
            GetValue: function () {
                return this.value;
            }
        },
        boolean: {
            _: "input",
            type: "checkbox",
            Init: function () {
                this.checked = this.Data;
                this.Parent.Elements.DataLabel.insertBefore(this, this.Parent.Elements.DataLabel.childNodes[0]); // Put the text behind the checkbox and make the text clickable
            },
            GetValue: function () { return this.checked; }
        },
        select: {
            _: "select",
            Init: function () {
                if (!this.DataSettings.Options)
                    return;
                for (var i = 0; i < this.DataSettings.Options.length; i++) {
                    this.appendChild(new Option(this.DataSettings.Options[i].Text, this.DataSettings.Options[i].Value.toString()));
                }
                if (this.Data)
                    this.value = this.Data.toString();
                else
                    this.value = this.DataSettings.ValueIsText ? "" : 0;
            },
            GetValue: function () { return this.DataSettings.ValueIsText ? this.value : parseInt(this.value); }
        },
        ajaxselect: {
            _: "select",
            Init: function () {
                this.Refresh();
            },
            Refresh: function () {
                var obj = this;
                Ajax.do(this.DataSettings.Url, null, function (response) {
                    obj.Values = JSON.parse(response);
                    if (obj.DataSettings.Options && obj.DataSettings.Options.length > 0) {
                        obj.Values = obj.DataSettings.Options.concat(obj.Values);
                    }                    
                    obj.GenerateOptions();
                }, null, { cacheResults: true });
            },
            GenerateOptions: function () {
                for (var i = 0; i < this.Values.length; i++) {
                    var name = this.DataSettings.GetName ? this.DataSettings.GetName(this.Values[i]) : this.Values[i].Name;
                    var value = this.DataSettings.GetValue ? this.DataSettings.GetValue(this.Values[i]) : this.Values[i].Id;
                    var optionEle = new Option(name.toString(), value.toString());
                    optionEle.ValueObj = this.Values[i];
                    this.appendChild(optionEle);
                }
                if (this.Data)
                    this.value = this.Data.toString();
                else
                    this.value = this.DataSettings.ValueIsText ? "" : 0;
            },
            GetValue: function () { return this.value; }
        },
        date: {
            _: "input",
            type: "date",
            Init: function () { this.value = this.Data; },
            GetValue: function () { return this.value; }
        },
        color: {
            _: "input",
            type: "color",
            Init: function () { this.value = this.Data; },
            GetValue: function () { return this.value; }
        },
        datetime: {
            _: "input",
            type: "text",
            Init: function () { this.value = this.Data; },
            GetValue: function () { return this.value; }
        },
        datetimeasp: {
            className: "dateTimeAsp",
            Init: function () {
                if (!this.Data) {
                    this.Add({
                        _: TK.DateTime,
                        onchange: this.onchange,                        
                        onfocus: this.onfocus,
                        onblur: this.onblur,
                        DataSettings: this.DataSettings
                    }, "DateInput");
                    return;
                }
                var isoString = window.ConvertFromASPTime(this.Data);
                if (!isoString)
                    isoString = new Date().toISOString();
                this.Add({
                    _: TK.DateTime,
                    Data: isoString,
                    onchange: this.onchange,
                    onfocus: this.onfocus,
                    onblur: this.onblur,
                    DataSettings: this.DataSettings
                }, "DateInput");
            },
            GetValue: function () {
                var value = this.Elements.DateInput.GetValue();
                if (!value)
                    return value;
                var time = new Date(value).getTime();
                if (isNaN(time)) {
                    alert("Date time value of " + value + " is not valid.");
                    throw "Date time value of " + value + " is not valid.";
                }
                return "/Date(" + time + ")/";
            },
            
        },
        form: {
            _: "div", 
            className: "subForm",
            Init: function () {
                var dataSettings = this.DataSettings;
                if (this.LinkedData !== undefined && dataSettings.LinkSettings && dataSettings.LinkSettings[this.LinkedData]) {
                    dataSettings = dataSettings.LinkSettings[this.LinkedData];
                }

                this.Add({
                    _: TK.Form,
                    SaveButtonText: null,
                    Model: this.Data,
                    DefaultModel: dataSettings.DefaultModel,
                    Fields: dataSettings.Fields,
                    IgnoreRest: dataSettings.IgnoreRest,
                    SortByFields: dataSettings.SortByFields,
                  //  Init: dataSettings.Init
                }, "Form");
            },
            GetValue: function (errors) {
                return this.Elements.Form.GetModel(errors);
            }
        },
        forms: {
            _: "div",
            className: "subForms",
            Forms: null,
            Init: function () {
                this.Forms = [];
                var obj = this;
                if (this.DataSettings.NewItem) {
                    this.Add({
                        _: "button",
                        innerHTML: this.DataSettings.AddButtonText ? this.DataSettings.AddButtonText : "Add",
                        className: "addButton",
                        type: "button",
                        onclick: function () {
                            obj.Forms.push(obj.Add({
                                _: TK.Form,
                                Model: JSON.parse(JSON.stringify(obj.DataSettings.NewItem)), // deepcopy
                                SaveButtonText: null,
                                Fields: obj.DataSettings.Fields,
                                IgnoreRest: obj.DataSettings.IgnoreRest,
                                SortByFields: obj.DataSettings.SortByFields,
                               // Init: obj.DataSettings.Init,
                                Elements: {
                                    RemoveButton: {
                                        innerHTML: obj.DataSettings.RemoveButtonText ? obj.DataSettings.RemoveButtonText : "Remove",
                                        className: "removeButton",
                                        onclick: function () {
                                            this.Parent.Remove();
                                        }
                                    }
                                }
                            }));
                            if (obj.onchange)
                                obj.onchange();
                        }
                    });
                }
                if (!this.Data)
                    return;
                for (var i = 0; i < this.Data.length; i++) {
                    this.Forms.push(this.Add({
                        _: TK.Form,
                        Model: this.Data[i],
                        SaveButtonText: null,
                        Fields: this.DataSettings.Fields,
                        IgnoreRest: this.DataSettings.IgnoreRest,
                        SortByFields: this.DataSettings.SortByFields,
                        //Init: this.DataSettings.Init,
                        Elements: {
                            RemoveButton: {
                                innerHTML: this.DataSettings.RemoveButtonText ? this.DataSettings.RemoveButtonText : "Remove",
                                className: "removeButton",
                                onclick: function () {
                                    this.Parent.Remove();
                                }
                            }
                        }
                    }));
                }
            },
            GetValue: function (errors) {
                var newObjs = [];
                for (var i = 0; i < this.Forms.length; i++) {
                    if (!this.Forms[i].Parent)
                        continue; // This form is removed
                    newObjs.push(this.Forms[i].GetModel(errors));
                }
                return newObjs;
            }
        }
    },
    Init: function () {        
        var obj = this;
        this.CurrentFields = {};
        var tmpFields = {};
        var model = this[this.ModelProperty];
        if (!model && this.DefaultModel)
            model = this.DefaultModel;
        else if (!model)
            return;
        

        if (this.Templates) {
            for (var name in this.Templates) {
                this.DefaultTemplates[name] = this.Templates[name];
            }
        }

        var callIsVisible = false;
        for (var name in model) {            
            var type = this.Fields && this.Fields[name] && this.Fields[name].Type ? this.Fields[name].Type : typeof model[name];

            if (this.IgnoreRest && (!this.Fields || !this.Fields[name]))
                type = "ignore";

            if (type != "ignore") {
                var defaultTemplate = this.DefaultTemplates[type] ? this.DefaultTemplates[type] : this.DefaultTemplates.text;
                var isRequired = (this.Fields && this.Fields[name] && this.Fields[name].Required);                
                var row = {
                    style: { },
                    className: "fieldRow field-" + name + (isRequired ? " fieldRequired" : "") + " " + (this.Fields && this.Fields[name] && this.Fields[name].Inline ? "inlineBlock" : ""),                    
                    Elements: {
                        DataLabel: { innerHTML: (this.Fields && this.Fields[name] && this.Fields[name].DisplayName ? this.Fields[name].DisplayName : name) },
                        DataField: {
                            _: (this.Fields && this.Fields[name] && this.Fields[name].Template ? this.Fields[name].Template : defaultTemplate),
                            /* required: isRequired, */
                            placeholder: (this.Fields && this.Fields[name] && this.Fields[name].PlaceHolder ? this.Fields[name].PlaceHolder : ""),
                            Data: model[name],                            
                            DataName: name,
                            LinkedData: (this.Fields && this.Fields[name] && this.Fields[name].LinkField ? model[this.Fields[name].LinkField] : null),
                            DataSettings: (this.Fields && this.Fields[name] ? this.Fields[name] : null),
                            onfocus: (this.Fields && this.Fields[name] && this.Fields[name].onfocus ? this.Fields[name].onfocus : null),
                            onblur: (this.Fields && this.Fields[name] && this.Fields[name].onblur ? this.Fields[name].onblur : null),
                            onchange: (this.Fields && this.Fields[name] && this.Fields[name].onchange ? this.Fields[name].onchange : null),
                            IsVisible: (this.Fields && this.Fields[name] && this.Fields[name].IsVisible ? this.Fields[name].IsVisible : null),
                            //Init: (this.Fields && this.Fields[name] && this.Fields[name].Init ? this.Fields[name].Init : undefined),
                            Form: this 
                        }
                    }
                };
                if (this.Fields && this.Fields[name] && this.Fields[name].Width) {
                    row.className += " withWidth";
                    row.style.width = this.Fields[name].Width;
                }
                if (this.Fields && this.Fields[name] && this.Fields[name].IsVisible) {
                    row.style.display = this.Fields[name].IsVisible(model) ? "" : "none";
                    callIsVisible = true;                    
                }
                
                row.Elements.DataField.origOnBlur = row.Elements.DataField.onblur;
                row.Elements.DataField.onblur = function () {
                    if (this.origOnBlur)
                        this.origOnBlur();
                    if (obj.AutoSave) {
                        obj.onsubmit();
                    }
                };
                row.Elements.DataField.origOnchange = row.Elements.DataField.onchange;
                row.Elements.DataField.onchange = function () {
                    if (this.origOnchange)
                        this.origOnchange();
                    var curModel = null;
                    for (var name in obj.CurrentFields) {
                        if (obj.CurrentFields[name] && obj.CurrentFields[name].DataSettings && obj.CurrentFields[name].DataSettings.LinkField && obj.CurrentFields[name].DataSettings.LinkField == this.DataName) {
                            obj.CurrentFields[name].LinkedData = this.GetValue();
                            obj.CurrentFields[name].Clear();
                            obj.CurrentFields[name].Init();
                        }

                        if (obj.CurrentFields[name] && obj.CurrentFields[name].IsVisible && obj.CurrentFields[name].Parent && obj.CurrentFields[name].Parent.style) {
                            // Get model and call obj.CurrentFields[name].DataSettings.IsVisible(model);
                            if (!curModel)
                                curModel = obj.GetModel([]);
                            obj.CurrentFields[name].Parent.style.display = obj.CurrentFields[name].IsVisible(curModel) ? "" : "none";
                        }
                    }
                    
                    if (obj.AutoSave) {
                        obj.onsubmit();
                    }
                };                

                if (this.SortByFields) {
                    tmpFields[name] = row;
                } else {
                    var rowObj = this.Add(row);
                    this.CurrentFields[name] = rowObj.Elements.DataField;
                }                

            } else {
                this.CurrentFields[name] = "ignore";
            }
        }
        
        var parent = this;
        if (this.SortByFields && this.Fields) {
            for (var fieldName in this.Fields) {                

                if (this.Fields[fieldName].Type == "section") {
                    parent = this.Add({
                        _: "fieldset",
                        Elements: {
                            Legend: {
                                _: "legend",
                                innerHTML: this.Fields[fieldName].DisplayName
                            }
                        }
                    });
                    
                }
                
                if (!tmpFields[fieldName]) {
                    if (this.Fields[fieldName]._) // This is just a template
                        parent.Add(this.Fields[fieldName], fieldName);
                    continue;
                }

                var rObj = parent.Add(tmpFields[fieldName]);
                this.CurrentFields[fieldName] =  rObj.Elements.DataField;
                
            }
        }

        if (callIsVisible) {
            // There is at least 1 IsVisible function, so we'll get the model and call all methods now the elements are actually created            
            var curModel = this.GetModel([]);
            for (var name in this.CurrentFields) {
                if (this.CurrentFields[name] && this.CurrentFields[name].IsVisible && this.CurrentFields[name].Parent && this.CurrentFields[name].Parent.style) {
                    this.CurrentFields[name].Parent.style.display = this.CurrentFields[name].IsVisible(curModel) ? "" : "none";
                }
            }
        }

        if (this.SaveButtonText) {
            this.Add({
                _: "button",
                type: "submit",
                innerHTML: this.SaveButtonText
            }, "SaveButton");
        }
    },
    Save: function (obj) {
    },
    GetModel: function (errors, applyToModelDirectly) {
        if (applyToModelDirectly === undefined)
            applyToModelDirectly = this.ApplyToModelDirectly;
        var model = this[this.ModelProperty];
        var newObj = applyToModelDirectly ? model : {};

        if (applyToModelDirectly) { // Check for errors first
            var tmpErrorList = [];
            var tmpModel = this.GetModel(tmpErrorList, false);            
            if (tmpErrorList.length > 0) {
                for (var i = 0; i < tmpErrorList.length; i++) {
                    errors.push(tmpErrorList[i]);
                }
                return tmpModel;
            }
        }

        for (var name in this.CurrentFields) {
            if (this.CurrentFields[name] == "ignore") {
                if (!applyToModelDirectly && model != null)
                    newObj[name] = model[name];
            } else {
                if (this.CurrentFields[name].IsVisible && this.RemoveValueOfNotVisibleFields && this.CurrentFields[name].Parent && this.CurrentFields[name].Parent.style && this.CurrentFields[name].Parent.style.display == "none") {
                    if (applyToModelDirectly && newObj != null) // Set to null, otherwise don't include it in the new model
                        newObj[name] = null;
                    continue;
                }
                newObj[name] = this.CurrentFields[name].GetValue(errors);
                var hasError = false;
                if (errors) {
                    if (this.Fields && this.Fields[name] && this.Fields[name].Required && (newObj[name] === null || newObj[name] === "")) {
                        errors.push(this.Fields && this.Fields[name] && this.Fields[name].DisplayName ? this.Fields[name].DisplayName : name);
                        hasError = true;
                        this.CurrentFields[name].Parent.className += " fieldError";
                    }
                }

                if (!hasError) {
                    this.CurrentFields[name].Parent.className = this.CurrentFields[name].Parent.className.replace("fieldError", "");
                }
            }
        }
        return newObj;
    },
    onsubmit: function () {
        if (this.IsCurrentlySubmitting)
            return false;
        this.IsCurrentlySubmitting = true;
        var obj = this;
        var errors = [];
        var newObj = this.GetModel(errors);
        if (errors.length == 0) {
            if (this.CustomValidation) {
                this.CustomValidation(newObj, function (customErrors) {
                    obj.IsCurrentlySubmitting = false;
                    if (!customErrors || customErrors.length == 0) {                        
                        obj.Save(newObj);                        
                    } else {
                        if (obj.Elements.ErrorText) {
                            obj.Elements.ErrorText.innerHTML = customErrors.join(", ");
                        } else {
                            obj.Add({ innerHTML: customErrors.join(", "), className: "validationError" }, "ErrorText");
                        }
                    }
                });
            } else {
                this.IsCurrentlySubmitting = false;
                this.Save(newObj);
            }            
        } else {
            if (this.Elements.ErrorText) {
                this.Elements.ErrorText.innerHTML = this.RequiredText + errors.join(", ");
            } else {
                this.Add({ innerHTML: this.RequiredText + errors.join(", "), className: "validationError" }, "ErrorText");
            }
            this.IsCurrentlySubmitting = false;
        }        
        return false;
    }
};
