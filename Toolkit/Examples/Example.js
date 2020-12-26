window.addEventListener("load", function () {
    var all = document.body.querySelectorAll("pre");
    for (var i = 0; i < all.length; i++) {
        var json = all[i].innerText;
        if (json.trim().substr(0,1) == "{") {
            var exampleContainer = document.createElement("DIV");
            exampleContainer.className = "example";
            exampleContainer.appendChild(TK.Initialize(eval('(' + json + ')')));
            all[i].parentNode.insertBefore(exampleContainer, all[i]);
            all[i].contentEditable = true;
            all[i].currentExampleContainer = exampleContainer;
            all[i].currentContent = all[i].innerText;
            all[i].spellcheck = false;
            all[i].className = "editable";
            all[i].onblur = function () {
                if (this.currentContent == this.innerText)
                    return;
                this.currentContent = this.innerText;
                if (this.currentExampleContainer.childNodes.length > 0 && this.currentExampleContainer.childNodes[0].Remove) {
                    this.currentExampleContainer.childNodes[0].Remove();
                }
                this.currentExampleContainer.innerHTML = "";
                try {
                    this.currentExampleContainer.appendChild(TK.Initialize(eval('(' + this.innerText + ')')));
                } catch (errie) {
                    this.currentExampleContainer.innerHTML = errie;
                }
            }
        }
    }

    
    var title = document.body.querySelector("H1");
    if (title) {
        var usedFiles = document.createElement("DIV");
        usedFiles.className = "usedFiles";
        usedFiles.innerHTML = "Script files used on this page: ";
        var scriptTags = document.head.querySelectorAll("script");
        for (var i = 0; i < scriptTags.length; i++) {
            var name = scriptTags[i].src;
            var shortName = name.substr(name.lastIndexOf("/") + 1);
            if (shortName != "Example.js")
                usedFiles.innerHTML += "<a href=\"" + name + "\">" + shortName + "</a> ";
        }
        title.parentNode.insertBefore(usedFiles, title.nextSibling);
    }
});