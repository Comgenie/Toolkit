﻿"use strict";
window.TK.Tree = {
    _: "ul",
    IdField: "Id",
    ParentIdField: "ParentId",
    CurrentFilter: null,
    Rows: [],
    CurRows: null,
    className: "tree toolkitTree",
    EnableFullRowExpand: false,
    AutoExpandChildNodesDuringFilter: true, // When applying filter with showAllChildNodes=true and this setting is set to false, the child rows will be visible but not expanded
    inAddRowsFunction: false, // used by functions inside object do not override
    Template: {
        _: "li",
        Data: null,
        Init: function () {
            this.Elements.Text.innerText = (this.Data && this.Data.Text) ? this.Data.Text : "";
        },
        Elements: {
            Text: { _: "span" }
        }
    },
    Expanded: function (row, byUserClick, rowElement) { },
    Collapsed: function (row, byUserClick, rowElement) { },
    Init: function () {
        if (this.Rows.length == 0)
            return;
        this.Refresh();
    },
    AddExpandButtonToRowElement: function (rowElement) {
        var obj = this;
        if (rowElement.SubList)
            return; // Already has an expand button
        rowElement.SubList = document.createElement("UL");
        rowElement.SubList.style.display = "none";
        rowElement.className += " collapsed";
        rowElement.appendChild(rowElement.SubList);
        var expandButton = document.createElement("SPAN");

        expandButton.className = "expandCollapseButton";
        var collapsed = window.SvgPath("M3,2L7,6L3,10", 12, 12, "#999");
        expandButton.innerHTML = collapsed;
        expandButton.Update = function () {
            if (this.parentNode.className.indexOf("expanded") >= 0) {
                this.innerHTML = window.SvgPath("M2,3L6,7L10,3", 12, 12, "#999");
            } else {
                this.innerHTML = collapsed;
            }
        };
        expandButton.onclick = function (e) {
            if (this.parentNode.className.indexOf("expanded") >= 0) {
                obj.Collapsed(this.parentNode.Data, true, this.parentNode);
                this.parentNode.SubList.style.display = "none";
                this.parentNode.className = this.parentNode.className.replace(/expanded/g, "") + " collapsed";
            } else {
                obj.Expanded(this.parentNode.Data, true, this.parentNode);
                this.parentNode.SubList.style.display = "";
                this.parentNode.className = this.parentNode.className.replace(/collapsed/g, "") + " expanded";
            }
            this.Update();
            if (e)
                e.stopPropagation();
            return false;
        };
        rowElement.ExpandCollapseButton = expandButton;
        rowElement.insertBefore(expandButton, rowElement.firstChild);
    },
    AddRows: function (rows) {
        var obj = this;
        obj.inAddRowsFunction = true;
        if (!this.CurRows)
            this.CurRows = {};

        // First add all the rows
        var addedRows = [];
        for (var i = 0; i < rows.length; i++) {
            // Order at the end for performance
            var rowElement = obj.AddRow(rows[i], false);

            addedRows.push(rows[i]);
        }

        obj.OrderRows(addedRows);
        obj.inAddRowsFunction = false;
        return addedRows;
    },
    AddRow: function (data) {
        let obj = this;

        if (!this.CurRows)
            this.CurRows = {};

        let rowId = data[this.IdField];

        if (this.CurRows["id" + rowId]) {
            console.warn(rowId + ' row id is already added and must be unique. Row not added.');
            return;
        }

        let row = obj.Add({
            _: obj.Template,
            TreeRoot: obj,
            Data: data,
            Row: {},
            onclick: function (e) {
                let rowObj = this;
                if (e && e.target && (e.target.tagName == "INPUT" || e.target.tagName == "SELECT" || e.target.tagName == "TEXTAREA" || e.target.PreventRowClick))
                    return;
                obj.RowClick(rowObj.Data, e, rowObj);
                if (obj.EnableFullRowExpand && rowObj.ExpandCollapseButton) {
                    rowObj.ExpandCollapseButton.click();
                }
                e.stopPropagation();
                return false;
            }
        });
        row.Row = row;

        if (data.AlwaysShowExpandButton) {
            obj.AddExpandButtonToRowElement(row);
        }

        if (obj.CurrentFilter && row.innerText.toLowerCase().indexOf(this.CurrentFilter) < 0) {
            row.style.display = "none";
        }

        obj.CurRows["id" + rowId] = row;
        obj.Rows.push(data);
        if (!obj.inAddRowsFunction) {
            obj.OrderRows(obj.Rows);
        }
        return row;
    },
    OrderRows: function (rows) {
        var obj = this;
        // Move rows to right place
        for (var i = 0; i < rows.length; i++) {
            // if (this.IgnoredRows.indexOf(rows[i]) >= 0)
            //     continue;
            var rowId = rows[i][this.IdField];
            var parentId = rows[i][this.ParentIdField];

            if (!parentId || !this.CurRows["id" + parentId])
                continue;


            // Add expand button to the parent item
            var parent = this.CurRows["id" + parentId];
            this.AddExpandButtonToRowElement(parent);

            // Move this item to the right parent element
            parent.SubList.appendChild(this.CurRows["id" + rowId]);
            this.CurRows["id" + rowId].Parent = parent;
        }
        // After ordering set tree depth for each row
        for (var rowKey in obj.children) {
            var row = obj.children[rowKey];
            if (!row || !row.Row)
                continue;
            row.TreeDepth = 0;
            obj.RecursiveSublist(row, function (childRow) {
                if (!childRow.Parent.TreeDepth)
                    childRow.TreeDepth = 1;
                else
                    childRow.TreeDepth = childRow.Parent.TreeDepth + 1;
            });
        }
    },
    CollapseAllRows: function () {
        const rows = this.querySelectorAll(".expanded");
        if (!rows)
            return;

        for (var i = 0; i < rows.length; i++) {
            const rowElement = rows[i];
            if (!rowElement.SubList)
                continue;

            rowElement.SubList.style.display = "none";
            rowElement.className = rowElement.className.replace(/expanded/g, "") + " collapsed";
            this.Collapsed(rowElement.Data, false, rowElement);
            if (rowElement.ExpandCollapseButton) {
                rowElement.ExpandCollapseButton.Update();
            }
        }
    },
    RemoveRows: function (rows) {
        for (var i = 0; i < rows.length; i++) {
            var rowId = rows[i][this.IdField];
            var rowElement = this.CurRows["id" + rowId];

            if (rowElement)
                rowElement.parentNode.removeChild(rowElement);
            var posIndex = this.Rows.indexOf(rows[i]);
            if (posIndex >= 0) {
                this.Rows.splice(posIndex, 1);
            }
        }
    },
    Refresh: function () {
        this.Clear();
        var rows = this.Rows;
        this.Rows = []; // Will be filled again
        this.CurRows = {};
        this.AddRows(rows);
    },
    RecursiveSublist: function (row, subItemFunction) {
        var obj = this;
        if (!row.SubList)
            return;

        for (var rowDescendantKey in row.SubList.childNodes) {
            var rowDescendant = row.SubList.childNodes[rowDescendantKey];
            // if descendant does not have the Row property it is not a generated row.
            if (!rowDescendant.Row)
                continue;

            let breakLoop = subItemFunction.apply(obj, [rowDescendant]);
            if (breakLoop)
                break;
            obj.RecursiveSublist(rowDescendant, subItemFunction);
        }
    },
    RecursiveParent: function (row, parentFunction) {
        var obj = this;
        // Check if parent is a generated row
        if (!row.Parent || !row.Parent.Row)
            return;

        let breakRecursion = parentFunction.apply(obj, [row.Parent]);
        if (breakRecursion)
            return;
        obj.RecursiveParent(row.Parent, parentFunction);
    },

    ApplyFilter: function (filter, showAllChildNodes, callBackFoundRows) {
        let obj = this;
        const isFunction = typeof filter === "function";
        if (!filter) {
            for (var item in this.CurRows) {
                var row = this.CurRows[item];
                row.style.display = "";
            }

            this.CollapseAllRows();
            return;
        }

        // Show item and all parent nodes, display:none the rest
        this.style.display = "none"; // Faster when updating

        // First hide everything
        for (var item in this.CurRows) {
            var row = this.CurRows[item];
            row.style.display = "none";
        }
        var foundRows = [];

        // Then make everything matching visible, including all parents and optionally all child nodes
        function processRow(filterString) {
            for (var item in obj.CurRows) {
                var row = obj.CurRows[item];
                let matchesFilter = false;

                if (isFunction) {
                    matchesFilter = filter(row.Data, row);
                } else {
                    var txt = "";
                    if (row.SubList) { // Only look at the text of this element
                        for (var j = 0; j < row.childNodes.length; j++) {
                            if (row.childNodes[j] != row.SubList)
                                txt += row.childNodes[j].innerText;
                        }
                    } else {
                        txt = row.innerText;
                    }

                    matchesFilter = txt.toLowerCase().indexOf(filterString) >= 0;
                }

                if (matchesFilter) {
                    row.style.display = "";
                    foundRows.push(row);

                    if (!obj.AutoExpandChildNodesDuringFilter && row.className.indexOf("collapsed") < 0) {
                        row.className = row.className.replace(/expanded/g, "") + " collapsed";
                        if (row.ExpandCollapseButton)
                            row.ExpandCollapseButton.Update();
                    }

                    if (showAllChildNodes && row.SubList) {
                        var subLists = [row.SubList];
                        for (var j = 0; j < subLists.length; j++) {
                            var curList = subLists[j];
                            var addClass = "expanded";
                            var removeClass = "collapsed";
                            var setStyle = "";

                            if (!obj.AutoExpandChildNodesDuringFilter) {
                                addClass = "collapsed";
                                removeClass = "expanded";
                                setStyle = "none";
                            }

                            curList.style.display = setStyle;

                            for (var n = 0; n < curList.childNodes.length; n++) {
                                var li = curList.childNodes[n];
                                if (li.className.indexOf(addClass) < 0) {
                                    li.className = li.className.replace(removeClass, "") + " " + addClass;
                                    if (addClass == "expanded")
                                        obj.Expanded(li.Data, false, curList);
                                    else
                                        obj.Collapsed(li.Data, false, curList);

                                    if (li.ExpandCollapseButton)
                                        li.ExpandCollapseButton.Update();
                                }
                                if (li.style)
                                    li.style.display = "";
                                if (li.SubList)
                                    subLists.push(li.SubList);
                            }
                        }
                    }

                    // Expand all items above
                    while (row.parentNode.Rows == undefined) {
                        row = row.parentNode;
                        if (row.SubList && row.className.indexOf("expanded") < 0) {
                            row.className = row.className.replace(/collapsed/g, "") + " expanded";
                            obj.Expanded(row.Data, false, row);
                            if (row.ExpandCollapseButton)
                                row.ExpandCollapseButton.Update();
                        }
                        row.style.display = "";
                    }
                }
            }
        }

        if (isFunction) {
            processRow()
        }
        else {
            var filterString = (filter || "").toLowerCase();
            var filterParts = filterString.split(/;/g);
            for (var i = 0; i < filterParts.length; i++) {
                processRow(filterParts[i]);
            }
        }
        this.style.display = "";
        if (callBackFoundRows) {
            callBackFoundRows(foundRows);
        }
    },
    SelectRow: function (id) {
        // Select a single item and expand+scroll the tree to that item
        var curSelectedItem = this.querySelector(".selectedItem");
        if (curSelectedItem)
            curSelectedItem.className = curSelectedItem.className.replace(/selectedItem/g, "");

        var currentRow = this.CurRows["id" + id];
        if (!currentRow)
            return;

        currentRow.className += " selectedItem";
        var row = currentRow;

        row.style.display = "";
        if (row.SubList) {
            this.Expanded(row.Data, false, row);
            row.className = row.className.replace(/collapsed/g, "") + " expanded";
            row.SubList.style.display = "";
        }
        while (row.parentNode.Rows == undefined) {
            row = row.parentNode;
            if (row.SubList) {
                this.Expanded(row.Data, false, row);
                row.className = row.className.replace(/collapsed/g, "") + " expanded";
            }
            row.style.display = "";
        }
        currentRow.scrollIntoView();

        return currentRow;
    },
    ConvertJsonToRows: function (json, arrayChildNames) {
        let obj = this;
        let rowId = 0;
        let resultRows = [];
        if (!arrayChildNames)
            arrayChildNames = [];
        let recursiveJsonProperties = function (top, skip) {
            let parentId = rowId;
            for (const propIndex in top) {

                let prop = top[propIndex];
                if (!prop || (skip && skip === propIndex)) {
                    continue;
                }
                let proptype = typeof prop;

                rowId++;
                let rowObj = { Id: rowId, ParentId: parentId, Text: propIndex + ": " + prop };

                if (proptype === 'boolean' || proptype === 'number' || proptype === 'string' || proptype === 'date') {
                    if (obj.ValueProperty && propIndex == obj.ValueProperty)
                        rowObj[obj.ValueProperty] = prop;
                    // Don't show indexes for array's that don't contain objects
                    if (Array.isArray(top))
                        rowObj.Text = prop + "";
                    resultRows.push(rowObj);
                }

                // Set right object name when dealing with arrays
                else if (proptype === 'object') {
                    let childArrayProp = null;
                    rowObj.Text = propIndex + "";
                    if (!Array.isArray(prop)) {
                        childArrayProp = Object.keys(prop).find(k => arrayChildNames.includes(k));
                        if (childArrayProp)
                            rowObj.Text = prop[childArrayProp] + "";
                    }
                    resultRows.push(rowObj);
                    recursiveJsonProperties(prop, childArrayProp);
                }

            }
        }

        recursiveJsonProperties(json);
        return resultRows;
    },
    RowClick: function (rowObj, jsEvent) { }
};

window.TK.AjaxTree = {
    _: window.TK.Tree,
    Url: null,
    Post: null,
    AjaxSettings: {},
    ShowJsonAsTree: false, // When you want to show the ajax response in json directly
    ArrayChildNames: [], // Set child name of array if that value must be the name of that array item
    Init: function (callback) {
        var obj = this;
        obj.Clear();
        if (this.Url) {
            Ajax.do(this.Url, this.Post, function (response) {
                if (response && response.substr)
                    response = JSON.parse(response);

                if (obj.ShowJsonAsTree)
                    response = obj.ConvertJsonToRows(response, obj.ArrayChildNames);

                obj.Rows = response;
                obj.Refresh();
                obj.Update();
                if (callback) {
                    callback.apply(obj);
                }
            }, undefined, this.AjaxSettings);
        }
    },
    Update: function () { }
};

// Control and shift keys are supported. 
// For switching a parent and keep the rest of the selection use the control key.
// For selecting multiple checkboxes next to each other use the shift key.
window.TK.FormTree = {
    _: window.TK.Tree,
    ValueProperty: null, // By default it retrieved the Id field. When set to something else it will be returned with GetValue()
    inAddCheckboxesFunction: false, // used by functions inside object do not override
    Data: [],
    Init: function () {
        if (this.Rows.length == 0)
            return;
        let obj = this;
        var originalAddRows = obj.AddRows;
        obj.AddRows = function (rows) {
            if (!rows) return;
            originalAddRows.apply(obj, [rows]);
            obj.AddCheckBoxes();
        };
        var originalAddRow = obj.AddRow;
        obj.AddRow = function (row, orderRows) {
            var rowNode = originalAddRow.apply(obj, [row, orderRows]);
            // At the end of the add rows function the rest of the functionality will be executed
            if (obj.inAddRowsFunction)
                return;
            var checked = obj.Data && rowNode.Data &&
                (rowNode.Data[obj.IdField] !== undefined && rowNode.Data[obj.IdField] !== null && obj.Data.some(function (d) { return d === rowNode.Data[obj.IdField] }))
                || (obj.ValueProperty && rowNode.Data[obj.ValueProperty] !== undefined && rowNode.Data[obj.ValueProperty] !== null && obj.Data.some(function (d) { return d === rowNode.Data[obj.ValueProperty] }));

            obj.AddCheckBox(rowNode, checked);

        }
        obj.style.display = 'none'; // invisible when adding checkboxes and building tree makes it faster
        obj.Refresh();
        if (obj.Data) {

            let checkedCheckboxes = obj.Checkboxes.filter(function (c) { return c ? c.checked : false });

            for (let i = 0; i < checkedCheckboxes.length; i++) {
                let boxChecked = checkedCheckboxes[i];
                obj.RecursiveParent(boxChecked.Parent.Row, function (parentRow) {
                    if (parentRow.CheckBox.checked)
                        return;

                    obj.SetParentCheckbox(parentRow);
                });
            }
        }
        obj.style.display = '';
    },
    CheckBoxChange: function (changedRow, checkedRows) { },
    CheckBoxClick: function (event, row) {
        // Set all decendants to the same value
        let sublistCheck = function (row) {
            obj.RecursiveSublist(row, function (rowDescendant) {
                let box = rowDescendant.CheckBox;
                if (box) {
                    box.checked = checkboxObj.checked;
                    box.indeterminate = false;
                }
            });
        };

        // Check parent nodes and their childeren to set checkbox value
        let parentCheck = function (row) {
            obj.RecursiveParent(row, obj.SetParentCheckbox);
        };

        let obj = this;
        let checkboxObj = row.CheckBox;

        // Control only selects that single specific row
        if (event.ctrlKey) {
            obj.lastBoxClick = checkboxObj;
            // Call change function
            obj.CheckBoxChange(row, obj.Checkboxes.filter(function (b) { return b.checked; }).map(function (b) { return b.Parent; }));
            return;
        }

        // Shift key functionality
        if (event.shiftKey && obj.lastBoxClick) {
            // Dont remember last click when shift is pressed

            // When shift clicked on same box deselect all children and check parent
            if (obj.lastBoxClick === checkboxObj) {
                obj.RecursiveSublist(checkboxObj.Parent, function (row) { row.CheckBox.checked = false; });
                checkboxObj.indeterminate = false;
                checkboxObj.checked = true;

                // Call change function
                obj.CheckBoxChange(row, obj.Checkboxes.filter(function (b) { return b.checked; }).map(function (b) { return b.Parent; }));
                return;
            }
            // Filter and set right checkboxes based on checkbox Id
            let goUp = checkboxObj.TreeId < obj.lastBoxClick.TreeId;
            let cboxes = obj.Checkboxes.filter(function (box) {
                if (goUp)
                    return box.TreeId < obj.lastBoxClick.TreeId && box.TreeId >= checkboxObj.TreeId;
                return box.TreeId > obj.lastBoxClick.TreeId && box.TreeId <= checkboxObj.TreeId;
            });
            cboxes.forEach(function (b) {
                b.checked = obj.lastBoxClick.checked
            });

            sublistCheck(row.TreeDepth <= obj.lastBoxClick.Parent.Row.TreeDepth ? row : obj.lastBoxClick.Parent.Row);
            parentCheck(row.TreeDepth >= obj.lastBoxClick.Parent.Row.TreeDepth ? row : obj.lastBoxClick.Parent.Row);

            // Call change function
            obj.CheckBoxChange(row, obj.Checkboxes.filter(function (b) { return b.checked; }).map(function (b) { return b.Parent; }));
            return;
        }

        obj.lastBoxClick = row.CheckBox;

        sublistCheck(row);
        parentCheck(row);

        // Call change function
        obj.CheckBoxChange(row, obj.Checkboxes.filter(function (b) { return b.checked; }).map(function (b) { return b.Parent; }));
    },
    AddCheckBoxes: function () {
        var obj = this;
        obj.inAddCheckboxesFunction = true;
        for (var rowId in obj.CurRows) {
            var row = obj.CurRows[rowId];
            let rowNode = row.Row;
            if (obj.ValueProperty && !row.Row.Data[obj.ValueProperty]) {
                continue;
            }

            let checked = obj.Data && rowNode.Data &&
                (rowNode.Data[obj.IdField] !== undefined && rowNode.Data[obj.IdField] !== null && obj.Data.some(function (d) { return d === rowNode.Data[obj.IdField] }))
                || (obj.ValueProperty && rowNode.Data[obj.ValueProperty] !== undefined && rowNode.Data[obj.ValueProperty] !== null && obj.Data.some(function (d) { return d === rowNode.Data[obj.ValueProperty] }));

            obj.AddCheckBox(row, checked);
            if (obj.ValueProperty) {
                obj.RecursiveParent(row, function (parentRow) { if (!parentRow.CheckBox) obj.AddCheckBox(parentRow) });
            }
        }
        // Give each checkbox a tree Id
        obj.IndexCheckboxes();
        obj.inAddCheckboxesFunction = false;
    },
    AddCheckBox: function (row, checked) {
        var obj = this;

        if (!row || row.CheckBox || !row.firstChild)
            return;

        let checkbox = TK.Initialize({
            _: "input",
            type: "checkbox",
            checked: checked ? true : false,
            className: "toolkitTreeCheckbox"
        });
        checkbox.onclick = function (e) { obj.CheckBoxClick(e, row); };
        row.CheckBox = checkbox;
        checkbox.Parent = row;

        if (row.firstChild.classList.contains('expandCollapseButton') && row.childNodes.length > 1)
            row.insertBefore(checkbox, row.childNodes[1]);
        else
            row.insertBefore(checkbox, row.firstChild);
        if (!obj.inAddCheckboxesFunction)
            obj.IndexCheckboxes();
    },
    IndexCheckboxes: function () {
        var obj = this;
        // Give each checkbox a tree Id
        if (obj.parentNode) {
            obj.Checkboxes = [];

            let treeIndex = 1;
            for (var i = 0; i < obj.children.length; i++) {
                let row = obj.children[i];
                if (!row.Row || !row.CheckBox)
                    continue;

                row.CheckBox.TreeId = treeIndex;
                obj.Checkboxes.push(row.CheckBox);
                treeIndex++;
                obj.RecursiveSublist(row, function (childNode) {
                    if (!childNode.CheckBox)
                        return;
                    childNode.CheckBox.TreeId = treeIndex;
                    obj.Checkboxes.push(childNode.CheckBox);
                    treeIndex++;
                });
            }
        }
    },
    GetValue: function () {
        let obj = this;
        let result = [];
        for (var rowId in obj.CurRows) {
            var row = obj.CurRows[rowId];
            if (row.CheckBox && row.CheckBox.checked) {
                if (obj.ValueProperty && !row.Data[obj.ValueProperty]) {
                    continue;
                }
                result.push(row.Data[obj.ValueProperty ? obj.ValueProperty : obj.IdField]);
            }
        }
        return result;
    },
    SetParentCheckbox: function (parentRow) {
        let obj = this;

        if (!parentRow.CheckBox)
            return;

        let checked = true;
        let indeterminate = false;
        obj.RecursiveSublist(parentRow, function (childRow) {
            // When at least one is checked and one is unchecked we don't need to check the rest
            if (!checked && indeterminate)
                return true; // will break out of recursion
            let box = childRow.CheckBox;
            if (box) {
                checked = checked && box.checked;
                indeterminate = indeterminate || box.checked;
            }
        });
        // If checked is true here, all items are checked so indeterminate is false
        indeterminate = !checked && indeterminate;

        parentRow.CheckBox.checked = checked;
        parentRow.CheckBox.indeterminate = indeterminate;
    },
    Checkboxes: []
}

window.TK.AjaxFormTree = {
    _: window.TK.FormTree,
    Url: null,
    Post: null,
    AjaxSettings: {},
    Init: function () {
        let obj = this;
        window.TK.AjaxTree.Init.apply(obj, [window.TK.FormTree.Init]);
    },
    Update: function () { }
};