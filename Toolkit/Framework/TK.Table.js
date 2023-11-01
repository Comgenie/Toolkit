"use strict";
// Sortable table
window.TK.Table = {
    _: "table",
    className: "toolkitTable",
    EnableSort: true,
    EnableFilter: false,
    EnableTotals: false,
    DisableFilterForColumns: [],
    ThresholdFilterMultiselect: 15,
    EnableCheckBoxes: false,
    EnableFullRowCheckBoxToggle: false,
    EnableFullRowClickDeselectOthers: false,
    EnableSelectAllCheckBox: true,
    EnableRemoveButton: false,
    EnablePartialInit: false, // TODO: Only add rows as TR elements which are currently visible
    PageSize: null,
    PageOffset: 0,
    SpecificColumns: null,    
    ColumnTitles: {},
    Templates: {},
    HeaderTemplates: {},
    SortedBy: null,
    SortedDesc: false,
    SortCallBack: null,
    FilterCallBack: null,
    MaxRows: null,
    CurrentFilter: null,    
    DefaultTemplate: {
        _: "td",
        Data: null,
        Init: function () { this.appendChild(document.createTextNode(this.Data)); }
    },
    CheckBoxTemplate: {
        _: "td",
        Data: null,
        onclick: function (event) {
            if (event)
                event.stopPropagation();
            if (window.event)
                window.event.cancelBubble = true;
            return true;
        },
        Elements: {
            CheckBox: {
                _: "input",
                type: "checkbox",
                className: "tableRowCheckBox",
                onclick: function (event) {
                    this.Parent.Table.LastCheckBoxRange = null;
                    if (event.shiftKey && this.Parent.Table.PreviousCheckBox) {
                        // Select everything in between
                        this.Parent.Table.LastCheckBoxRange = [];
                        var curIndex = this.Parent.Parent.RowIndex;
                        var otherIndex = this.Parent.Table.PreviousCheckBox.Parent.Parent.RowIndex;
                        for (var i = curIndex; i != otherIndex; i = (curIndex < otherIndex ? i + 1 : i - 1)) {
                            var checkBoxElement = this.Parent.Table.querySelectorAll(".Element-row" + i + " input[type=checkbox].tableRowCheckBox")[0];
                            if (checkBoxElement.Parent.Parent.style.display == "none")
                                continue; // Skip filtered rows
                            if (checkBoxElement.checked != this.Parent.Table.PreviousCheckBox.checked) {
                                this.Parent.Table.LastCheckBoxRange.push(checkBoxElement.Parent.Row);
                                checkBoxElement.checked = this.Parent.Table.PreviousCheckBox.checked;
                            }                            
                            checkBoxElement.UpdateData();
                        }
                    }
                },
                onblur: function () {
                    this.Parent.Table.PreviousCheckBox = this;
                },
                onchange: function (event) {
                    this.UpdateData();
                    if (this.Parent.Table.EnableSelectAllCheckBox) {
                        var selectAll = this.Parent.Table.querySelectorAll(".tableSelectAllCheckBox")[0];
                        if (selectAll) {
                            var checkBoxElements = this.Parent.Table.Elements.tbody.Elements.ToArray()
                                .Where(function (a) { return a.Elements.CheckBoxes && a.Elements.CheckBoxes.Elements.CheckBox && a.style.display != "none"; })
                                .Select(function (a) { return a.Elements.CheckBoxes.Elements.CheckBox });
                            selectAll.checked = checkBoxElements.length == this.Parent.Table.SelectedRows().length;
                        }
                    }

                    if (this.Parent.Table.CheckboxCheck) {
                        if (!this.Parent.Table.LastCheckBoxRange) {
                            this.Parent.Table.CheckboxCheck([this.Parent.Row], this.checked);
                        } else {
                            if (this.Parent.Table.LastCheckBoxRange.indexOf(this.Parent.Row) < 0)
                                this.Parent.Table.LastCheckBoxRange.push(this.Parent.Row);
                            this.Parent.Table.CheckboxCheck(this.Parent.Table.LastCheckBoxRange, this.checked);
                        }
                    }
                    this.Parent.Table.LastCheckBoxRange = null;
                },
                UpdateData: function () {
                    this.Parent.Row["CheckBoxes"] = this.checked;
                },
                Init: function () {
                    this.checked = this.Parent.Data === true;
                }
            }
        }
    },
    RemoveButtonTemplate: {
        _: "td",
        Data: null,
        onclick: function (event) {
            if (event)
                event.stopPropagation();
            if (window.event)
                window.event.cancelBubble = true;
            return true;
        },
        Elements: {
            RemoveButton: {
                _: "button",
                innerHTML: "Remove",
                onclick: function (event) {
                    // Find with button clicked and delete it from Rows variable in the table
                    var thisRow = this.Parent.Parent.Row;
                    for (var i = 0; i < this.Parent.Table.Rows.length; i++) {
                        if (this.Parent.Table.Rows[i] == thisRow) {
                            this.Parent.Table.Rows.splice(i, 1);
                            break;
                        }
                    }

                    // When the row was succesfully deleted in the save function remove current row
                    if (this.Parent.Table.Save(thisRow, true) !== false) {
                        var thisRowNode = this.Parent.Parent;
                        // When the user was editing the row a form is showing on the next row. When this is the case remove that form as well.
                        if (thisRowNode.subTr)
                            thisRowNode.subTr.Remove();
                        thisRowNode.Remove();
                    }
                }
            }
        }
    },
    PreviousCheckBox: null,
    Rows: [],
    Form: null,
    FormAlwaysLoaded: false, // If true, the subViews are initialized directly, but shown/hidden using style.display
    Init: function () {
        if (this.SortedBy && this.Rows && this.Rows.OrderBy) {
            var sortedBy = this.SortedBy;
            this.Rows = this.SortedDesc ? this.Rows.OrderByDesc(function (a) { return a[sortedBy]; }) : this.Rows.OrderBy(function (a) { return a[sortedBy]; });
        }
        this.Refresh();
    },
    RowClick: function (rowObj, trElement) {
        var obj = this;
        if (this.Form) {
            if (!trElement) { // Optional parameter, Find the TR element based on the given row Obj                
                if (!this.Elements.tbody)
                    return;
                for (var rowId in this.Elements.tbody.Elements) {
                    var row = this.Elements.tbody.Elements[rowId];
                    if (row.Row == rowObj) {
                        trElement = row;
                        break;
                    }
                }
                if (!trElement)
                    return;
            }
            if (obj.FormAlwaysLoaded) {
                if (trElement.subTr) {
                    trElement.subTr.style.display = trElement.subTr.style.display == "" ? "none" : "";
                    return;
                }
            } else {
                if (trElement.subTr) {
                    trElement.subTr.parentNode.removeChild(trElement.subTr);
                    trElement.subTr = null;
                    return;
                }
            }
            var template = {
                _: obj.Form,
                Model: rowObj,
                ApplyToModelDirectly: true,
                
            };
            if (obj.Form.Save == undefined) {
                template.Save = function (model) {
                    obj.Save(model, false);
                    obj.UpdateRow(trElement);                    
                };
            }
            if (obj.Form.ApplyToModelDirectly == undefined) {
                template.ApplyToModelDirectly = true;
            }
            this.OpenViewForRow(trElement, template);
        }
    },
    RowDoubleClick: function (rowObj, trElement) { },
    Save: function (rowObj, isRemoved) {
        // Only used when the Form property is given
    },
    OpenViewForRow: function (trElement, template) {
        if (!template || trElement.subTr)
            return;
        var childElements = trElement.Elements.ToArray();
        var tds = 0;
        for (var i = 0; i < childElements.length; i++) {
            tds += childElements[i].colSpan ? parseInt(childElements[i].colSpan) : 1;
        }
        
        trElement.subTr = trElement.Parent.Add(
        {
            _: "tr",      
            ThisIsASubTR: true,
            Destroy: function () {
                trElement.subTr = null;
            },
            Elements: {
                Editor: {
                    _: "td",
                    className: "subView",
                    colSpan: tds,
                    Elements: {
                        View: template
                    }
                }
            }
        });
        trElement.parentNode.insertBefore(trElement.subTr, trElement.nextSibling);
    },
    CheckboxCheck: function (rowsChanged, isChecked) { },
    SelectedRows: function () {
        if (!this.EnableCheckBoxes)
            return [];
        return this.Elements.tbody.Elements.ToArray()
            .Where(function (a) { return a.Elements.CheckBoxes && a.Elements.CheckBoxes.Elements.CheckBox && a.Elements.CheckBoxes.Elements.CheckBox.checked; })
            .Select(function (a) { return a.Row });
    },
    ApplyFilter: function (filter, skipCallback) {
        this.CurrentFilter = filter == null ? "" : filter.toLowerCase ? filter.toLowerCase() : filter;
        if (this.FilterCallBack && !skipCallback) {
            this.FilterCallBack();
            return;
        }

        if (!this.Elements.tbody) {
            return;
        }
        if (this.Elements.thead && this.ColumnFilter) {
            for (var name in this.ColumnFilter) {
                if (this.Elements.thead.Elements.tr.Elements[name]) {
                    this.Elements.thead.Elements.tr.Elements[name].className = this.ColumnFilter[name] ? "toolkitHasFilter" : "";
                }
            }
        }
        this.Elements.tbody.style.display = "none"; // This prevents row style changes to cause render updates, making it a lot faster
        var rows = 0;

        for (var rowId in this.Elements.tbody.Elements) {
            var row = this.Elements.tbody.Elements[rowId];
            if (!row.innerText || row.ThisIsASubTR)
                continue;

            if (this.MaxRows != null && rows >= this.MaxRows) {
                row.style.display = "none";
                if (row.subTr)
                    row.subTr.style.display = "none";
                continue;
            }

            if (row.subTr && row.subTr.Elements && row.subTr.Elements.Editor && row.subTr.Elements.Editor.Elements && row.subTr.Elements.Editor.Elements.View && row.subTr.Elements.Editor.Elements.View.IsVisible && row.subTr.Elements.Editor.Elements.View.IsVisible(this.CurrentFilter)) {
                // The subTr wants to be visible, so we'll also make the parent row visible
                row.style.display = "";
                row.subTr.style.display = "";
                rows++;
                continue;
            }
            
            if (this.CurrentFilter == "" || this.CurrentFilter == null || !row.innerText || (this.CurrentFilter && this.CurrentFilter.toLowerCase && row.innerText.toLowerCase().indexOf(this.CurrentFilter) >= 0) || (this.CurrentFilter && !this.CurrentFilter.toLowerCase && this.CurrentFilter(row.Row, row))) {
                row.style.display = "";
                if (row.subTr)
                    row.subTr.style.display = "";
                rows++;
            } else {
                row.style.display = "none";
                if (row.subTr)
                    row.subTr.style.display = "none";
            }

            if (this.PageSize != null && ((rows - 1) < this.PageOffset || (rows-1) >= this.PageOffset + this.PageSize)) {
                row.style.display = "none";
                if (row.subTr)
                    row.subTr.style.display = "none";
                continue;
            }
        }
        this.Elements.tbody.style.display = "";
        this.VisibleRowCount = rows;

        var ttnc = this.Near(".toolkitTableNavigationContainer");
        if (ttnc)
            ttnc.Init();

        return rows;
    },
    Refresh: function () {
        var obj = this;
        this.Clear();
        this.PreviousCheckBox = null;
        if (this.Rows.length == 0) {
            return;
        }

        // Build header
        var thead = {
            _: "thead",
            Elements: {
                tr: {
                    _: "tr",
                    Elements: {}
                }
            }
        };
        var columns = [];
        if (this.EnableCheckBoxes) {
            columns.push("CheckBoxes");
            if (!this.DisableFilterForColumns)
                this.DisableFilterForColumns = [];
            if (this.DisableFilterForColumns.indexOf("CheckBoxes") < 0)
                this.DisableFilterForColumns.push("CheckBoxes");
            this.ColumnTitles["CheckBoxes"] = " ";
            this.Templates["CheckBoxes"] = this.CheckBoxTemplate;
            if (this.EnableSelectAllCheckBox) {
                this.HeaderTemplates["CheckBoxes"] = {
                    _: "th",
                    Init: function () {
                        var selectAllCheckBox = this.Add({
                            _: "input",
                            type: "checkbox",
                            className: "tableSelectAllCheckBox",
                            onclick: function (event) {
                                if (event)
                                    event.stopPropagation();
                                if (window.event)
                                    window.event.cancelBubble = true;
                            },
                            onchange: function (event) {
                                var checkBoxElements = obj.Elements.tbody.Elements.ToArray()
                                    .Where(function (a) { return a.Elements.CheckBoxes && a.Elements.CheckBoxes.Elements.CheckBox && a.style.display != "none"; })
                                    .Select(function (a) { return a.Elements.CheckBoxes.Elements.CheckBox });
                                var changedRange = [];
                                for (var i = 0; i < checkBoxElements.length; i++) {
                                    if (checkBoxElements[i].checked != this.checked) {
                                        changedRange.push(checkBoxElements[i].Parent.Row);
                                        checkBoxElements[i].checked = this.checked;
                                    }                                    
                                    checkBoxElements[i].UpdateData();
                                }
                                if (obj.CheckboxCheck)
                                    obj.CheckboxCheck(changedRange, this.checked);
                            }
                        });

                        // See if all rows are already selected
                        var totalRowsChecked = 0;
                        for (; totalRowsChecked < obj.Rows.length; totalRowsChecked++) {
                            if (!obj.Rows[totalRowsChecked]["CheckBoxes"])
                                break;
                        }
                        if (totalRowsChecked > 0 && totalRowsChecked == obj.Rows.length)
                            selectAllCheckBox.checked = true;
                    }

                };
            } else {
                this.HeaderTemplates["CheckBoxes"] = null;
            }
        }

        if (this.SpecificColumns && this.SpecificColumns.length > 0) {
            columns = columns.concat(this.SpecificColumns);
        } else {
            for (var name in this.Rows[0]) {
                columns.push(name);
            }
        }

        if (this.EnableRemoveButton) {
            columns.push("RemoveButtons");
            this.ColumnTitles["RemoveButtons"] = " ";
            this.Templates["RemoveButtons"] = this.RemoveButtonTemplate;
        }

        for (var i = 0; i < columns.length; i++) {
            var name = columns[i];

            thead.Elements.tr.Elements[name] = {
                _: this.HeaderTemplates && this.HeaderTemplates[name] ? this.HeaderTemplates[name] : "th",
                innerHTML: (this.ColumnTitles && this.ColumnTitles[name] ? this.ColumnTitles[name] : name),
                className: (name == obj.SortedBy ? "sorted" + (this.SortedDesc ? " desc" : "") : ""),
                DataColumnName: name,
                onclick: function () {
                    if (!obj.EnableSort)
                        return;

                    var thisTh = this;
                    if (obj.SortedBy == this.DataColumnName) {
                        obj.Rows = obj.Rows.reverse();
                        obj.SortedDesc = !obj.SortedDesc;
                    } else {

                        obj.Rows = obj.Rows.OrderBy(function (a) {
                            if (a[thisTh.DataColumnName + "-SortValue"])
                                return a[thisTh.DataColumnName + "-SortValue"];
                            return a[thisTh.DataColumnName];
                        });
                        obj.SortedDesc = false;
                    }
                    obj.SortedBy = this.DataColumnName;

                    if (obj.SortCallBack) {
                        obj.SortCallBack();
                    } else {
                        obj.Refresh();
                    }
                },
                Elements: {}
            };

            // Enable filter button on column
            if (this.EnableFilter && (!this.DisableFilterForColumns || this.DisableFilterForColumns.indexOf(name) < 0 )) {
                thead.Elements.tr.Elements[name].Elements.FilterButton = {
                    className: "toolkitFilterButton",
                    innerHTML: "v",
                    onclick: function (event) {
                        // Open filter window for this column and data type (Slider for numbers, Multiselect for few options, search for many options)
                        var currentHeader = this.Parent;
                        var position = this.Parent.getBoundingClientRect();
                        var filterWindow = {
                            className: "toolkitFilterBox",
                            style: {
                                backgroundColor: "#eee",
                                left: position.left + "px",
                                top: position.bottom + "px",
                                position: "fixed"
                            },
                            Elements: {
                                CloseButton: {
                                    innerHTML: "x",
                                    onclick: function () {
                                        this.Parent.Remove();
                                        obj.ActiveFilterWindow = null;
                                    }
                                },
                                Container: {
                                    Init: function () {
                                        var values = [];
                                        for (var i = 0; i < obj.Rows.length; i++) {
                                            var value = obj.Rows[i][currentHeader.DataColumnName];
                                            if (values.indexOf(value) < 0)
                                                values.push(value);

                                            if (values.length >= obj.ThresholdFilterMultiselect) {
                                                break;
                                            }
                                        }

                                        if (!obj.ColumnFilter)
                                            obj.ColumnFilter = {};
                                        var filterFunc = function (rowObj, trObj) {
                                            for (var name in obj.ColumnFilter) {
                                                if (!obj.ColumnFilter[name])
                                                    continue;
                                                                                                
                                                if (obj.ColumnFilter[name].toLowerCase) { // text match, match if any of the text is in there
                                                    var lowerColumnSearch = obj.ColumnFilter[name].toLowerCase();

                                                    var foundInFieldValue = rowObj[name] && rowObj[name].toString().toLowerCase().indexOf(lowerColumnSearch) >= 0;
                                                    var foundInTdText = trObj.Elements && trObj.Elements[name] && trObj.Elements[name].innerText && trObj.Elements[name].innerText.toLowerCase().indexOf(lowerColumnSearch) >= 0;
                                                    if (!foundInFieldValue && !foundInTdText)
                                                        return false;
                                                    continue;
                                                }

                                                if (Array.isArray(obj.ColumnFilter[name]) && rowObj[name] !== undefined) {
                                                    if (obj.ColumnFilter[name].indexOf(rowObj[name]) < 0)
                                                        return false;
                                                } else if (obj.ColumnFilter[name] != rowObj[name]) { // match exact, for numbers etc.
                                                    return false;
                                                }
                                            }
                                            return true;
                                        };
                                        
                                        if (values.length < obj.ThresholdFilterMultiselect) {
                                            // Show multi select
                                            values = values.OrderBy(function (a) { return a; });
                                            var filterTable = {
                                                _: TK.Table,
                                                EnableFilter: false,
                                                Rows: [],
                                                Templates: obj.Templates,
                                                EnableCheckBoxes: true,
                                                ColumnTitles: {},
                                                CheckboxCheck: function () {
                                                    var rows = this.SelectedRows();
                                                    if (rows.length != this.Rows.length) {
                                                        var allowed = [];
                                                        for (var i = 0; i < rows.length; i++)
                                                            allowed.push(rows[i][currentHeader.DataColumnName]);
                                                        obj.ColumnFilter[currentHeader.DataColumnName] = allowed;
                                                    } else {
                                                        obj.ColumnFilter[currentHeader.DataColumnName] = null;
                                                    }
                                                    obj.ApplyFilter(filterFunc);                           
                                                }
                                            };
                                            filterTable.ColumnTitles[currentHeader.DataColumnName] = "Filter";

                                            for (var i = 0; i < values.length; i++) {
                                                var rowObj = {};
                                                rowObj.CheckBoxes = !obj.ColumnFilter || !obj.ColumnFilter[currentHeader.DataColumnName] || (obj.ColumnFilter[currentHeader.DataColumnName].indexOf(values[i]) >= 0);
                                                rowObj[currentHeader.DataColumnName] = values[i];
                                                filterTable.Rows.push(rowObj)
                                            }
                                            this.Add(filterTable);
                                        } else {
                                            // Show search field
                                            var inputElement = this.Add({
                                                _: "input",
                                                value: !obj.ColumnFilter || !obj.ColumnFilter[currentHeader.DataColumnName] ? "" : obj.ColumnFilter[currentHeader.DataColumnName],
                                                onkeyup: function (event) {

                                                    obj.ColumnFilter[currentHeader.DataColumnName] = (this.value == "") ? null : this.value;
                                                    obj.ApplyFilter(filterFunc);    

                                                    var x = event.which || event.keyCode;
                                                    if (x == 13) {
                                                        this.Near("CloseButton").onclick();
                                                    }
                                                }
                                            });
                                            setTimeout(function () {
                                                inputElement.focus();
                                            }, 1);
                                        }
                                    }
                                }
                            }
                        };

                        if (obj.ActiveFilterWindow)
                            obj.ActiveFilterWindow.Remove();
                        obj.ActiveFilterWindow = TK.Initialize(filterWindow);
                        document.body.appendChild(obj.ActiveFilterWindow);

                        if (event)
                            event.stopPropagation();
                        if (window.event)
                            window.event.cancelBubble = true;
                        return true;
                    }
                };
            }
        }
        this.TableUseColumns = columns;
        // Build contents
        var tbody = {
            _: "tbody",
            Elements: {}
        }
        this.CurrentAddedRowCount = 0;
        this.AddNewRowsToTableBody(tbody);
        this.Add(thead, "thead");
        var tbodyElement = this.Add(tbody, "tbody");
        if (this.FormAlwaysLoaded) {
            var trRows = tbodyElement.Elements.ToArray();
            for (var i = 0; i < trRows.length; i++) {
                this.RowClick(trRows[i].Row, trRows[i]);
                if (trRows[i].subTr) {
                    trRows[i].subTr.style.display = "none";
                }
            }
        }

        var tfoot = {
            _: "tfoot",
            Elements: {}
        };
        var includeTFoot = false;

        if (this.EnableTotals) {
            includeTFoot = true;
            tfoot.Elements.SubTotals = {
                _: "tr",
                Elements: {}
            };
            for (var i = 0; i < columns.length; i++) {
                var name = columns[i];
                if (name == "CheckBoxes" || name == "RemoveButtons") {
                    tfoot.Elements.SubTotals.Elements[name] = {
                        _: "td"
                    };
                    continue;
                }

                var allRowValues = this.Rows.Select(function (a) {
                    return a[name]
                });

                var total = null;
                
                for (var j = 0; j < allRowValues.length; j++) {
                    if (allRowValues[j] !== undefined && allRowValues[j] !== null && allRowValues[j] === +allRowValues[j])
                        total = (total === null ? 0 : total) + allRowValues[j];
                }      
                if (total === null)
                    total = "";
                
                tfoot.Elements.SubTotals.Elements[name] = {
                    _: this.Templates[name] ? this.Templates[name] : this.DefaultTemplate,
                    className: "totalColumn-" + name,
                    Data: total,
                    Values: allRowValues,
                    Table: this 
                };
            }
            
        }

        if (this.MaxRows != null || this.CurrentFilter != null || this.PageSize != null) {
            this.ApplyFilter(this.CurrentFilter, true);
            includeTFoot = true;
            if (this.PageSize) {
                tfoot.Elements.NavigationRow = {
                    _: "tr",
                    Elements: {
                        NavigationCell: {
                            _: "td",
                            className: "toolkitTableNavigationContainer",
                            colSpan: columns.length,
                            Init: function () {
                                this.Clear();
                                var pageCount = Math.ceil(obj.VisibleRowCount / obj.PageSize);
                                var currentPage = Math.floor(obj.PageOffset / obj.PageSize) + 1;                                
                                var maxBeforeAfter = 3;
                                var template = {
                                    _: "button",
                                    className: "toolkitTableNavigation",
                                    disabled: i == currentPage,
                                    innerHTML: i,
                                    onclick: function () {
                                        obj.PageOffset = this.Offset;
                                        obj.Refresh();
                                    }
                                };
                                if (currentPage > maxBeforeAfter + 1) {
                                    template.Offset = 0;
                                    template.innerHTML = 1;
                                    this.Add(template);
                                    this.Add({
                                        _: "span", innerHTML: "..."
                                    });
                                }
                                for (var i = (currentPage > maxBeforeAfter ? currentPage - maxBeforeAfter : 1); i <= pageCount && i < currentPage + maxBeforeAfter; i++) {
                                    template.Offset = (i - 1) * obj.PageSize;
                                    template.disabled = i == currentPage;
                                    template.innerHTML = i;
                                    this.Add(template);
                                }
                                if (currentPage + maxBeforeAfter < pageCount) {
                                    this.Add({
                                        _: "span", innerHTML: "..."
                                    });
                                    template.Offset = (pageCount - 1) * obj.PageSize;
                                    template.innerHTML = pageCount;
                                    this.Add(template);
                                }
                            }                        
                        }
                    }
                };
            }
        }

        if (includeTFoot)
            this.Add(tfoot, "tfoot");
    },
    AddRow: function (row, rowClick) {
        this.Rows.push(row);
        if (this.Elements.tbody) {
            var tr = this.AddNewRowsToTableBody()[0];
            if (!tr) {
                this.Refresh();
            } else  if (rowClick && tr) {
                this.RowClick(tr.Row, tr);
                return;
            }
        } else {
            this.Refresh();            
        }

        if (rowClick) {
            this.RowClick(row);
        }
    },
    UpdateRow: function (trRow) {
        var template = this.GenerateRowTemplate(trRow.Row, trRow.RowIndex);
        var tr = this.Elements.tbody.Add(template, "row" + trRow.RowIndex);
        trRow.parentNode.insertBefore(tr, trRow);
        if (trRow.subTr) {
            trRow.subTr.Remove();
        }
        trRow.Remove();        
    },
    AddNewRowsToTableBody: function (tbody) {
        if (!tbody)
            tbody = this.Elements.tbody;
        var newElements = [];
        var obj = this;
        for (var i = this.CurrentAddedRowCount; i < this.Rows.length; i++) {
            var tr = this.GenerateRowTemplate(this.Rows[i], i);
            if (tbody.Add) {
                newElements.push(tbody.Add(tr, "row" + i));
            } else {
                tbody.Elements["row" + i] = tr;
            }
        }
        this.CurrentAddedRowCount = this.Rows.length;
        return newElements;
    },
    GenerateRowTemplate: function (rowObj, rowIndex) {        
        var obj = this;
        var tr = {
            _: "tr",
            Elements: {},
            Row: rowObj,
            RowIndex: rowIndex,
            onclick: function (event) {
                if (obj.EnableFullRowCheckBoxToggle) {
                    var checkBoxElement = this.querySelector("input[type=checkbox]");
                    if (checkBoxElement != null) {
                        if (obj.EnableFullRowClickDeselectOthers && !event.shiftKey && !event.ctrlKey) {
                            var allCheckBoxes = obj.querySelectorAll("input[type=checkbox]");
                            for (var i = 0; i < allCheckBoxes.length; i++) {
                                allCheckBoxes[i].checked = false;
                            }
                        }
                        checkBoxElement.checked = !checkBoxElement.checked;
                        checkBoxElement.onclick(event);
                        checkBoxElement.onchange();
                        obj.PreviousCheckBox = checkBoxElement;
                    }
                }
                obj.RowClick(this.Row, this);
            },
            ondblclick: function () {
                if (obj.RowDoubleClick) {
                    obj.RowDoubleClick(this.Row, this);
                }
            }
        };
        
        for (var j = 0; j < this.TableUseColumns.length; j++) {
            var name = this.TableUseColumns[j];
            var templateToUse = this.DefaultTemplate;
            if (this.Templates[name]) {
                templateToUse = this.Templates[name];
            }
            tr.Elements[name] = {
                _: templateToUse,
                Data: rowObj[name],
                Row: rowObj,
                Table: this
                
            };

            if (rowObj[name] && rowObj[name].substr && rowObj[name].substr(0, 6) == "/Date(") {
                var tmp = rowObj[name].substr(6);
                tmp = tmp.substr(0, tmp.length - 2);
                rowObj[name + "-SortValue"] = new Date(parseInt(tmp)).getTime();
            }
        }
        return tr;
    }
};

window.TK.AjaxTable = {
    _: window.TK.Table,
    Url: null,
    Post: null,
    AjaxSettings: {},
    
    Init: function () {
        this.RefreshData();        
    },
    RefreshData: function () {        
        this.Clear();        
        var obj = this;
        
        if (this.Url) {
            var url = this.Url;
            
            if (url.indexOf("SORTBY") >= 0) {
                // Sort using ajax requests
                var tmp = this.SortedBy ? this.SortedBy : "";

                url = url.replace("SORTBY", encodeURIComponent(tmp));
                url = url.replace("SORTDESC", this.SortedDesc);
                this.SortCallBack = function () {
                    obj.RefreshData();
                };
            }

            if (url.indexOf("FILTER") >= 0) {
                // Limit rows using ajax requests
                var filter = this.CurrentFilter ? this.CurrentFilter : "";
                url = url.replace("FILTER", encodeURIComponent(filter));
                this.FilterCallBack = function () {
                    obj.RefreshData();
                };
            }
            if (url.indexOf("COUNT") >= 0) {
                // Limit rows using ajax requests
                // TODO
            }


            Ajax.do(url, this.Post, function (response) {
                if (!obj.Post || typeof obj.Post === "string" || obj.Post instanceof String) {
                    obj.Rows = JSON.parse(response);
                } else {
                    obj.Rows = response;
                }
                obj.Refresh();
                obj.Update();
            }, undefined, this.AjaxSettings);
        }
    },
    Update: function () { }
};