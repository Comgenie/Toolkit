"use strict";
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
    Expanded: function (row, byUserClick, rowElement) {

    },
    Collapsed: function (row, byUserClick, rowElement) {

    },    
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
        if (!this.CurRows)
            this.CurRows = {};

        // First add all the rows
        var ignoredRows = [];
        var addedRows = [];

        for (var i = 0; i < rows.length; i++) {
            var rowId = rows[i][this.IdField];

            if (this.CurRows["id" + rowId]) { // Won't insert duplicated id's
                ignoredRows.push(rows[i]);
                continue;
            }
            var rowElement = this.Add({
                _: this.Template,
                Data: rows[i],
                onclick: function (e) {
                    if (e && e.target && (e.target.tagName == "INPUT" || e.target.tagName == "SELECT" || e.target.tagName == "TEXTAREA" || e.target.PreventRowClick))
                        return;
                    obj.RowClick(this.Data, e, this);
                    if (obj.EnableFullRowExpand && this.ExpandCollapseButton) {
                        this.ExpandCollapseButton.click();
                    }
                    e.stopPropagation();
                    return false;
                }
            });

            if (rows[i].AlwaysShowExpandButton) {
                this.AddExpandButtonToRowElement(rowElement);
            }

            if (this.CurrentFilter && rowElement.innerText.toLowerCase().indexOf(this.CurrentFilter) < 0) {
                rowElement.style.display = "none";
            }
            this.CurRows["id" + rowId] = rowElement;            
            addedRows.push(rows[i]);
            this.Rows.push(rows[i]);
        }

        // Then move them to the right items
        for (var i = 0; i < rows.length; i++) {            
            if (ignoredRows.indexOf(rows[i]) >= 0)
                continue;
            var rowId = rows[i][this.IdField];
            var parentId = rows[i][this.ParentIdField];

            if (!parentId || !this.CurRows["id" + parentId])
                continue;

            // Add expand button to the parent item
            var parent = this.CurRows["id" + parentId];
            this.AddExpandButtonToRowElement(parent);

            // Move this item to the right parent element
            parent.SubList.appendChild(this.CurRows["id" + rowId]);
        }

        return addedRows;
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
    ApplyFilter: function (filter, showAllChildNodes, callBackFoundRows) {
        filter = filter.toLowerCase();
        if (filter == "") {
            this.Refresh(); // Collapse everything
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
        var filterParts = filter.split(/;/g);
        for (var i = 0; i < filterParts.length; i++) {
            for (var item in this.CurRows) {
                var row = this.CurRows[item];
                var txt = "";
                if (row.SubList) { // Only look at the text of this element
                    for (var j = 0; j < row.childNodes.length; j++) {
                        if (row.childNodes[j] != row.SubList)
                            txt += row.childNodes[j].innerText;
                    }
                } else {
                    txt = row.innerText;
                }

                if (txt.toLowerCase().indexOf(filterParts[i]) >= 0) {
                    row.style.display = "";
                    foundRows.push(row);

                    if (!this.AutoExpandChildNodesDuringFilter && row.className.indexOf("collapsed") < 0) {
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

                            if (!this.AutoExpandChildNodesDuringFilter) {
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
                                        this.Expanded(li.Data, false, curList);
                                    else
                                        this.Collapsed(li.Data, false, curList);

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
                            this.Expanded(row.Data, false, row);
                            if (row.ExpandCollapseButton)
                                row.ExpandCollapseButton.Update();
                        }
                        row.style.display = "";
                    }                    
                }
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
    RowClick: function (rowObj, jsEvent) { }
};
window.TK.AjaxTree = {
    _: window.TK.Tree,
    Url: null,
    Post: "",
    AjaxSettings: {},
    Init: function () {
        this.Clear();
        var obj = this;
        if (this.Url) {
            Ajax.do(this.Url, this.Post, function (response) {
                if (response && response.substr)
                    response = JSON.parse(response);
                obj.Rows = response;
                obj.Refresh();
                obj.Update();
            }, undefined, this.AjaxSettings);
        }
    },
    Update: function () { }
};