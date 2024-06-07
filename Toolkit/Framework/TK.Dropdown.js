"use strict";
/* Minify Order(200) */
window.TK.Dropdown = {
    _: "div",
    className: "toolkitDropdown",
    Data: null, // Selected value(s)
    Options: [], // Array of { Value: ..., Text: ... }
    Multiple: false, // Allow multiple selections
    Placeholder: "Select...",
    MaxDisplayItems: 10, // Maximum items to show before scrolling
    SelectedClass: "toolkitDropdownSelected", // Class for selected items
    OpenClass: "toolkitDropdownOpen", // Class when dropdown is open
    ListItemTemplate: {
        _: "li",
        Dropdown: null,
        Data: null,
        Init: function () {
            this.innerText = this.Data.Text;
            this.Value = this.Data.Value;
            this.className = this.Dropdown.IsSelected(this.Data.Value) ? this.Dropdown.SelectedClass : "";  
        },
        onclick: function (a) {
            this.Dropdown.SelectItem(this.Value);
            if (!this.Dropdown.Multiple) {
                this.Dropdown.ToggleDropdown();
            }
        }
    },
    Init: function () {
        var obj = this;
        if (this.DataSettings) {
            var fields = ["Placeholder", "MaxDisplayItems", "Multiple", "Options", "SelectedClass", "OpenClass"];
            for (var i = 0; i < fields.length; i++) {
                if (this.DataSettings[fields[i]] !== undefined)
                    this[fields[i]] = this.DataSettings[fields[i]];
            }
        }

        this.Clear();
        this.Add({
            _: "div",
            className: "toolkitDropdownDisplay",
            onclick: function (a) { obj.ToggleDropdown() },
            Elements: {
                SelectedItems: {
                    _: "ul",
                    style: { listStyle: "none", padding: 0, margin: 0 },
                },
                Placeholder: {
                    _: "span",
                    innerText: this.Placeholder,
                    style: { display: this.Data ? "none" : "inline" },
                },
            },
        }, "Display");

        this.Add({
            _: "div",
            className: "toolkitDropdownOptions",
            style: { display: "none", maxHeight: this.MaxDisplayItems * 35 + "px" }, 
            Elements: {
                OptionsList: {
                    _: "ul",
                    style: { listStyle: "none", padding: 0, margin: 0 },
                },
            },
        }, "Options");

        this.RefreshOptions();
    },

    RefreshOptions: function () {
        var obj = this;
        this.Elements.Options.Elements.OptionsList.Clear();
        for (var i = 0; i < this.Options.length;i++) {
            var option = this.Options[i];
            if (option.Text === undefined || option.Text === null)
                option.Text = option.Value;
            else if (option.Value === undefined || option.Value === null)
                option.Value = option.Text;

            if (option.Text === undefined || option.Text === null)
                continue;
            this.Elements.Options.Elements.OptionsList.Add({
                _: this.ListItemTemplate,
                Dropdown: this,
                Data: option
            });
        }
    },

    SelectItem: function (value) {
        if (this.Multiple) {
            if (!this.Data)
                this.Data = [];
            if (this.IsSelected(value)) {
                this.Data.splice(this.Data.indexOf(value), 1);
            } else {
                this.Data.push(value);
            }
        } else {
            this.Data = value;
        }
        this.RefreshOptions();
        this.UpdateDisplay();
        if (this.onchange) this.onchange();
    },

    IsSelected: function (value) {
        return this.Multiple ? this.Data && this.Data.indexOf(value) >= 0 : this.Data === value;
    },

    UpdateDisplay: function () {
        var obj = this;
        this.Elements.Display.Elements.SelectedItems.Clear();
        if (!this.Data)
            return;
        var bboxDisplay = this.Elements.Display.getBoundingClientRect();
        var first = true;
        if (this.Multiple && this.Data) {
            for (var i = 0; i < this.Data.length; i++) {
                var value = this.Data[i];
                var option = this.Options.First(function (a) {
                    return a.Value == value;
                });
                if (option) {
                    if (!first) {
                        this.Elements.Display.Elements.SelectedItems.Add({
                            _: "span",
                            innerText: ", ",
                        });
                    }
                    first = false;
                    var item = this.Elements.Display.Elements.SelectedItems.Add({
                        _: "li",
                        innerText: option.Text,
                    });
                    var bboxItem = item.getBoundingClientRect();

                    if (bboxItem.right > bboxDisplay.right) {
                        this.Elements.Display.Elements.SelectedItems.Clear();
                        this.Elements.Display.Elements.SelectedItems.Add({
                            _: "li",
                            innerText: this.Data.length + " selected",
                        });
                        break;
                    }
                    
                }
            }
        } else if (!this.Multiple && this.Data) {
            var option = this.Options.First(function (a) {
                return a.Value == obj.Data;
            });
            if (option) {
                first = false;
                this.Elements.Display.Elements.SelectedItems.Add({
                    _: "li",
                    innerText: option.Text,
                });
            }
        }
        if (first) {
            this.Elements.Display.Elements.SelectedItems.Add({
                _: "span",
                innerText: this.Placeholder,
            });
        }
        this.Elements.Display.Elements.Placeholder.style.display = this.Data ? "none" : "inline";
    },

    ToggleDropdown: function () {
        this.Elements.Options.style.display = this.Elements.Options.style.display === "none" ? "block" : "none";
        this.className = this.className.indexOf(this.OpenClass) >= 0 ? this.className.replace(this.OpenClass, "") : this.className + " " + this.OpenClass;
    },

    GetValue: function () {
        return this.Data;
    }
};


if (window.TK.Form) {
    window.TK.Form.DefaultTemplates.dropdown = {
        _: TK.Dropdown,
        
    };
}
