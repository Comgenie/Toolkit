"use strict";
/* Minify Order(110) */
TK.HtmlEditor = {
    className: "toolkitHtmlEditor",
    FillContainer: false,
    Buttons: ["IncreaseFontSize", "DecreaseFontSize", "Bold", "Italic", "Underline", "AlignLeft", "AlignCenter", "AlignRight", "Indent", "Outdent", "Paragraph", "Header1", "Header2", "Header3", "CodeBlock", "QuoteBlock"],
    __RecursivePropertiesButtonTemplates: true,
    EnableHTMLPasting: true,
    RemoveScripts: true,
    RemoveScriptsHandler: function (html) {
        var len = -1;
        while (len != html.length) {
            len = html.length;
            html = html.replace(/<(script|link|iframe|noscript|meta|object|embed|frameset|style)/ig, "<r ").replace(/javascript:/ig, "removed:").replace(/ (href|src)=(?!"http|"data|"\/)/ig, " r=\"").replace(/\/\*[\S]*\*\//ig, "").replace(/\&\#(010|X0A);/ig, "").replace(/expression\(/ig, "r(").replace(/( |\/)on(\w+)( *)=/ig, " r=");
        }
        return html;
    },
    ButtonTemplates: {
        IncreaseFontSize: {
            innerHTML: Svg.Icons.TextIncrease,
            onmousedown: function () {
                if (this.Parent.CurSize < 7)
                    this.Parent.CurSize++;
                document.execCommand("fontSize", false, this.Parent.CurSize);
                this.Near("Editor").focus();
            }
        },
        DecreaseFontSize: {
            innerHTML: Svg.Icons.TextDecrease,
            onmousedown: function () {
                if (this.Parent.CurSize > 1)
                    this.Parent.CurSize--;
                document.execCommand("fontSize", false, this.Parent.CurSize);
                this.Near("Editor").focus();
            }
        },
        Bold: {
            innerHTML: Svg.Icons.TextBold,
            onmousedown: function () {
                document.execCommand("bold", false, null);
                this.Near("Editor").focus();
            }
        },
        Italic: {
            innerHTML: Svg.Icons.TextItalic,
            onmousedown: function () {
                document.execCommand("italic", false, null);
                this.Near("Editor").focus();
            }
        },
        Underline: {
            innerHTML: Svg.Icons.TextUnderline,
            onmousedown: function () {
                document.execCommand("underline", false, null);
                this.Near("Editor").focus();
            }
        },
        AlignLeft: {
            innerHTML: Svg.Icons.TextAlignLeft,
            onmousedown: function () {
                document.execCommand("justifyLeft", false, null);
                this.Near("Editor").focus();
            }
        },
        AlignCenter: {
            innerHTML: Svg.Icons.TextAlignCenter,
            onmousedown: function () {
                document.execCommand("justifyCenter", false, null);
                this.Near("Editor").focus();
            }
        },
        AlignRight: {
            innerHTML: Svg.Icons.TextAlignRight,
            onmousedown: function () {
                document.execCommand("justifyRight", false, null);
                this.Near("Editor").focus();
            }
        },
        Indent: {
            innerHTML: Svg.Icons.TextIndent,
            onmousedown: function () {
                document.execCommand("indent", false, null);
                this.Near("Editor").focus();
            }
        },
        Outdent: {
            innerHTML: Svg.Icons.TextOutdent,
            onmousedown: function () {
                document.execCommand("outdent", false, null);
                this.Near("Editor").focus();
            }
        },
        Paragraph: {
            title: "Paragraph",
            innerHTML: Svg.Icons.TextParagraph,
            onmousedown: function () {
                document.execCommand("formatBlock", false, "p");
                this.Near("Editor").focus();
            }
        },
        Header1: {
            title: "Header 1",
            innerHTML: Svg.Icons.TextHeader1,
            onmousedown: function () {
                document.execCommand("formatBlock", false, "h1");
                this.Near("Editor").focus();
            }
        },
        Header2: {
            title: "Header 2",
            innerHTML: Svg.Icons.TextHeader2,
            onmousedown: function () {
                document.execCommand("formatBlock", false, "h2");
                this.Near("Editor").focus();
            }
        },
        Header3: {
            title: "Header 3",
            innerHTML: Svg.Icons.TextHeader3,
            onmousedown: function () {
                document.execCommand("formatBlock", false, "h3");
                this.Near("Editor").focus();
            }
        },
        CodeBlock: {
            title: "Code block",
            innerHTML: Svg.Icons.TextCodeBlock,
            onmousedown: function () {
                document.execCommand("formatBlock", false, "pre");
                this.Near("Editor").focus();
            }
        },
        QuoteBlock: {
            title: "Quote block",
            innerHTML: Svg.Icons.TextQuoteBlock,
            onmousedown: function () {
                document.execCommand("formatBlock", false, "blockquote");
                
            }
        }
    },
    Data: null,
    Init: function () {
        if (this.Data)
            this.Elements.Editor.innerHTML = this.RemoveScripts ? this.RemoveScriptsHandler(this.Data) : this.Data;
        if (this.FillContainer) {
            this.style.position = "absolute";
            this.style.top = "0px";
            this.style.left = "0px";
            this.style.right = "0px";
            this.style.bottom = "0px";

            this.Elements.MenuBar.style.position = "absolute";
            this.Elements.MenuBar.style.top = "0px";
            this.Elements.MenuBar.style.left = "0px";
            this.Elements.MenuBar.style.right = "0px";
            this.Elements.MenuBar.style.height = "35px";

            this.Elements.Editor.style.position = "absolute";
            this.Elements.Editor.style.top = "35px";
            this.Elements.Editor.style.left = "0px";
            this.Elements.Editor.style.right = "0px";
            this.Elements.Editor.style.bottom = "0px";
        }
    },
    GetValue: function () {
        return this.Elements.Editor.innerHTML.replace(/<b>/g, "<strong>").replace(/<\/b>/g, "</strong>").replace(/<i>/g, "<em>").replace(/<\/i>/g, "</em>");
    },
    Elements: {
        MenuBar: {
            CurSize: 3,
            Init: function () {
                for (var i = 0; i < this.Parent.Buttons.length;i++) {
                    if (this.Parent.ButtonTemplates[this.Parent.Buttons[i]])
                        this.Add({
                            _: this.Parent.ButtonTemplates[this.Parent.Buttons[i]],
                            onmouseup: function () {
                                this.Near("Editor").focus();
                            }
                        });
                }                
            },
            onselectstart: function () { return false; }
        },
        Editor: {
            contentEditable: true,
            onclick: function () {
                this.Near("MenuBar").CurSize = 3; // TODO: Handle this a lot better.. but at least this works in Chrome
            },
            onpaste: function (e) {
                if (e.clipboardData) {
                    e.preventDefault();
                    if (this.Parent.EnableHTMLPasting && e.clipboardData.types && e.clipboardData.types.indexOf("text/html") >= 0) {
                        try {
                            var html = e.clipboardData.getData("text/html");
                            document.execCommand("insertHTML", false, this.Parent.RemoveScripts ? this.Parent.RemoveScriptsHandler(html) : html);
                            return;
                        } catch (errie) { } // If insertHTML is not supported for any reason, we will still paste it as text                        
                    }

                    var text = e.clipboardData.getData("text");
                    document.execCommand("insertText", false, text);                    
                }
            },
            onkeydown: function (e) {
                if (e.keyCode === 13 && !e.shiftKey) {
                    this.RemoveFormat = true;
                }
            },
            onkeyup: function (e) {
                if (this.RemoveFormat) {
                    document.execCommand("formatBlock", false, "div");
                    this.RemoveFormat = null;
                }
            }
        }
    }
};

if (window.TK.Form) {
    window.TK.Form.DefaultTemplates.html = {
        _: TK.HtmlEditor
    };
}
