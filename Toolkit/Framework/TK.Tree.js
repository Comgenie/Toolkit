"use strict";
window.TK.Tree = {
    _: "ul",    
    IdField: "Id",
    ParentIdField: "ParentId",
    Rows: [],
    className: "tree toolkitTree",
    EnableFullRowExpand: false,
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
    Init: function () {
        if (this.Rows.length == 0)
            return;
        this.Refresh();
    },
    Refresh: function () {
        this.Clear();
        var curRows = {};
        var obj = this;

        // First add all the rows
        for (var i = 0; i < this.Rows.length; i++) {
            var rowId = this.Rows[i][this.IdField];
            curRows["id" + rowId] = this.Add({
                _: this.Template,
                Data: this.Rows[i],
                onclick: function (e) {
                    obj.RowClick(this.Data);                    
                    if (obj.EnableFullRowExpand && this.ExpandCollapseButton) {
                        this.ExpandCollapseButton.click();
                    }
                    e.stopPropagation();
                    return false;
                }
            });
        }

        // Then move them to the right items
        for (var i = 0; i < this.Rows.length; i++) {
            var rowId = this.Rows[i][this.IdField];
            var parentId = this.Rows[i][this.ParentIdField];

            if (!parentId || !curRows["id" + parentId])
                continue;

            // Move this item to the right parent element
            var parent = curRows["id" + parentId];
            if (!parent.SubList) {
                parent.SubList = document.createElement("UL");
                parent.SubList.style.display = "none";
                parent.className += " collapsed";
                parent.appendChild(parent.SubList);
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
                        this.parentNode.SubList.style.display = "none";
                        this.parentNode.className = this.parentNode.className.replace(/expanded/g, "") + " collapsed";
                    } else {
                        this.parentNode.SubList.style.display = "";
                        this.parentNode.className = this.parentNode.className.replace(/collapsed/g, "") + " expanded";
                    }
                    this.Update();
                    if (e)
                        e.stopPropagation();
                    return false;
                };
                parent.ExpandCollapseButton = expandButton;
                parent.insertBefore(expandButton, parent.firstChild);
            }
            parent.SubList.appendChild(curRows["id" + rowId]);
        }
        this.CurRows = curRows;
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
                    
                    if (showAllChildNodes && row.SubList) {                        
                        var subLists = [row.SubList];
                        for (var j = 0; j < subLists.length; j++) {
                            var curList = subLists[j];
                            if (curList.className.indexOf("expanded") < 0) {
                                curList.className = curList.className.replace(/collapsed/g, "") + " expanded";
                                if (curList.ExpandCollapseButton)
                                    curList.ExpandCollapseButton.Update();
                            }
                            curList.style.display = "";

                            for (var n = 0; n < curList.childNodes.length; n++) {
                                if (curList.childNodes[n].style)
                                    curList.childNodes[n].style.display = "";
                                if (curList.childNodes[n].SubList)
                                    subLists.push(curList.childNodes[n].SubList);
                            }
                        }
                    }

                    while (row.parentNode.Rows == undefined) {
                        row = row.parentNode;
                        if (row.SubList && row.className.indexOf("expanded") < 0) {
                            row.className = row.className.replace(/collapsed/g, "") + " expanded";
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
            row.className = row.className.replace(/collapsed/g, "") + " expanded";
            row.SubList.style.display = "";
        }
        while (row.parentNode.Rows == undefined) {
            row = row.parentNode;
            if (row.SubList)
                row.className = row.className.replace(/collapsed/g, "") + " expanded";
            row.style.display = "";
        }
        currentRow.scrollIntoView();

        return currentRow;
    },
    RowClick: function (rowObj) { }
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