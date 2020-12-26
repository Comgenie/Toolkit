"use strict";
/* Minify Order(200) */

TK.Interface = {
    _Position: ["0px", "0px", "0px", "0px"],
    CurrentUserTemplate: null,
    CurrentLogoTemplate: null,
    DefaultContent: "Index",
    className: "toolkitInterface",
    MenuIconSize: 50,
    MenuTextSize: 150,
    ResponsiveThreshold: 400,
    ResponsiveFullThreshold: 700,
    EnableMenu: true,
    Content: {},
    

    HamburgerIcon: null, // <svg> </svg> data

    Embedded: false,

    ShowMenu: false, // Show menu in mobile view (Hamburger menu icon toggles this)
    
    Init: function () {
        var obj = this;
        if (!this.EnableMenu) {
            this.MenuIconSize = 0;
            this.MenuTextSize = 0;
        }
        var header = this.Add({
            _Position: "0px,0px,,0px,,40px",
            style: {
                zIndex: "1000"
            },
            Elements: {
                CurrentUser: {
                    _Position: "0px,9px",
                    style: {
                        lineHeight: "40px"
                    }
                },
                CurrentLogo: {
                    _Position: "0px,,,9px",
                    style: {
                        lineHeight: "40px"
                    }
                }
            },
            Init: function() {
                if (obj.EnableMenu) {
                    this.Add({
                        innerHTML: obj.HamburgerIcon ? obj.HamburgerIcon : window.Svg && Svg.Icons && Svg.Icons.Hamburger ? Svg.Icons.Hamburger : "",
                        onclick: function() {
                            // Toggle menu
                            obj.ShowMenu = !obj.ShowMenu;
                            obj.ProcessResize();
                        },
                        _Position: "5px,,,5px,30px,30px"
                    }, "HamburgerMenu");
                }
            }
        }, "Header");

        var menu = null;
        if (this.EnableMenu) {
            var menu = this.Add({
                _: "ul",
                style: {
                    listStyle: "none",
                    margin: "0px",
                    padding: "0px",
                    zIndex: "1000",
                    display: "none"
                },
                _Position: "40px,,0px,0px," + (this.MenuIconSize + this.MenuTextSize) + "px,"
            }, "Menu");
        }

        var content = {
            _: TK.Navigator,
            _Position: "40px,0px,0px," + (this.MenuIconSize + this.MenuTextSize) +"px",
            style: {
                overflow: "auto"
            },
            Templates: {},
            DefaultHash: this.DefaultContent,
            Navigate: function(page) {
                if (!menu)
                    return;
                var menuItems = obj.Elements.Menu.Elements.ToArray();
                for (var i = 0; i < menuItems.length;i++) 
                    menuItems[i].className = menuItems[i].className.replace("toolkitActive", "");
                if (menu.Elements["MenuItem" + page])
                    menu.Elements["MenuItem" + page].className += " toolkitActive";
            }
        };
        if (!this.Embedded) {        
            content._Position = null;
            document.body.style.paddingTop = "40px";
            document.body.style.paddingLeft = (this.MenuIconSize + this.MenuTextSize) + "px";
            content.style.overflow = "";
            header.style.position = "fixed";
            if (menu)
                menu.style.position = "fixed";
        }

        for (var name in this.Content) {
            if (!this.Content[name].Hidden && menu) {
                var menuItem = menu.Add({
                    _: "li",
                    style: {
                        position: "relative",
                        //width: (this.MenuIconSize + this.MenuTextSize) + "px",
                        height: this.MenuIconSize + "px",
                        lineHeight: this.MenuIconSize + "px",
                        textAlign: "left",
                        overflow: "hidden"
                    },
                    title: this.Content[name].Name,
                    Hash: name,
                    onclick: function () {
                        if (obj.ShowMenu) {
                            obj.ShowMenu = !obj.ShowMenu;
                            obj.ProcessResize();
                        }
                        window.location.hash = "#" + this.Hash;
                    },
                    Elements: {}
                }, "MenuItem" + name);
                if (this.Content[name].Icon) {
                    menuItem.Add({
                        innerHTML: this.Content[name].Icon,
                        style: {
                            position: "absolute",
                            top: "5px",
                            left: "5px",
                            width: (this.MenuIconSize - 10) + "px",
                            height: (this.MenuIconSize - 10) + "px"
                        }
                    }, "Icon");
                }
                menuItem.Add({
                    _: "span",
                    style: {
                        position: "absolute",
                        top: "0px",
                        left: (this.MenuIconSize+5)+"px",
                        right: "0px",
                        height: this.MenuIconSize + "px"
                    },

                    innerHTML: this.Content[name].Name ? this.Content[name].Name : name
                }, "Title");
            }

            if (this.Content[name].Content) { // Divided in subpages           
                
                content.Templates[name] = {
                    _: "div",                    
                    className: "toolkitInterfaceSubPages",
                    Templates: {},
                    MenuTemplate: {
                        _: "ul",
                        style: {
                            position: !this.Embedded ? "fixed" : "absolute",
                            zIndex: "990",
                        },
                        Elements: {}
                    },
                    Elements: {                        
                        SubContent: {
                            _: TK.Navigator,
                            Templates: {},
                            NavigatorLevel: 1,
                            DefaultHash: this.Content[name].DefaultContent ? this.Content[name].DefaultContent : this.DefaultContent,
                            Navigate: function (page) {                                  
                                if (obj.SubMenu) {
                                    obj.SubMenu.Remove();
                                }
                                obj.SubMenu = obj.Add(this.Parent.MenuTemplate, "SubMenu");

                                var menuItems = obj.SubMenu.Elements.ToArray();
                                for (var i = 0; i < menuItems.length; i++)
                                    menuItems[i].className = menuItems[i].className.replace("toolkitActive", "");
                                if (obj.SubMenu.Elements["MenuItem" + page])
                                    obj.SubMenu.Elements["MenuItem" + page].className += " toolkitActive";
                                obj.ProcessResize();
                            },
                            Destroy: function () {
                                this.Navigate = null;
                                window.removeEventListener("hashchange", this.onHashChangeHandler);
                                if (obj.SubMenu)
                                    obj.SubMenu.Remove();                                
                                obj.ProcessResize();
                            }
                        }
                    }
                };
                for (var subName in this.Content[name].Content) {
                    var contentObj = this.Content[name].Content[subName];
                    if (!contentObj.Hidden) {
                        var menuItemTemplate = {
                            _: "li",
                            className: "toolkitActive",
                            innerHTML: contentObj.Name ? contentObj.Name : subName,
                            Hash: name + "/" + subName,
                            onclick: function () {
                                window.location.hash = "#" + this.Hash;
                            },
                            Elements: {

                            }
                        };

                        if (contentObj.Icon) {
                            menuItemTemplate.className += " menuButtonWithIcon";
                            menuItemTemplate.Elements.Icon = {
                                innerHTML: contentObj.Icon
                            };
                        }
                        content.Templates[name].MenuTemplate.Elements["MenuItem" + subName] = menuItemTemplate;
                    }
                    content.Templates[name].Elements.SubContent.Templates[subName] = contentObj.Template;
                }              
                
            } else {
                content.Templates[name] = this.Content[name].Template;
            }
        }

        this.Add(content, "Content");

        if (this.CurrentUserTemplate) {
            header.Elements.CurrentUser.Add(this.CurrentUserTemplate, "User");
        }
        if (this.CurrentLogoTemplate) {
            header.Elements.CurrentLogo.Add(this.CurrentLogoTemplate, "Logo");
        }

        this.OnResizeListener = function () {
            obj.ProcessResize();
        };
        window.addEventListener("resize", this.OnResizeListener);
        setTimeout(function () {
            obj.ProcessResize();
        },1);
    }, 
    ProcessResize: function () {
        var obj = this;
        var w = (this.Embedded ? this.offsetWidth : document.body.offsetWidth);        
        
        if (w < this.ResponsiveThreshold) { // Small view
            //this.Elements.Menu.style.width = (this.MenuIconSize + this.MenuTextSize) + "px";
            if (this.Elements.Menu) {
                this.Elements.Menu.style.width = "100%";
                this.Elements.Menu.style.display = this.ShowMenu ? "" : "none";

                if (this.Elements.Menu.className.indexOf("toolkitDocked") >= 0) {
                    this.Elements.Menu.className = this.Elements.Menu.className.replace(/toolkitDocked/g, "");
                }

                this.Elements.Header.Elements.HamburgerMenu.style.display = "";
                this.Elements.Header.Elements.HamburgerMenu.className = "Element-HamburgerMenu " + (this.ShowMenu ? "toolkitActive" : "");


                this.Elements.Header.Elements.CurrentLogo.style.left = "43px";
                if (this.Embedded) {
                    this.Elements.Content.style.left = "0px";
                } else {
                    document.body.style.paddingLeft = "0px";
                }
            }

            if (this.className.indexOf("toolkitSizeMedium") >= 0)
                this.className = this.className.replace(/toolkitSizeMedium/g, "");
            if (this.className.indexOf("toolkitSizeSmall") < 0)
                this.className += " toolkitSizeSmall";

            if (this.Embedded) {
                this.Elements.Content.style.top = this.Elements.Header.style.height;
            } else {
                document.body.style.paddingTop = this.Elements.Header.style.height;
            }
            if (this.Elements.SubMenu) {
                this.Elements.SubMenu.style.top = "";
                this.Elements.SubMenu.style.bottom = "0px";
                this.Elements.SubMenu.style.left = "0px";
                this.Elements.SubMenu.style.right = "0px";

                if (this.Embedded) {
                    this.Elements.Content.style.bottom = "60pt";
                } else {
                    document.body.style.paddingBottom = "60pt";
                }
            } else {
                if (this.Embedded) {
                    this.Elements.Content.style.bottom = "0px";
                } else {
                    document.body.style.paddingBottom = "0px";
                }
                
            }

            this.CurrentScrollElement = this.Embedded ? this.Elements.Content : window;
            this.CurrentScrollPosition = this.CurrentScrollElement.scrollY === undefined ? this.CurrentScrollElement.scrollTop : this.CurrentScrollElement.scrollY;
            if (!this.OnScrollListener) {
                var scrollUpCounter = 0;
                var scrollDownCounter = 0;
                this.OnScrollListener = function () {
                    obj.ShowMenu = false;
                    if (obj.Elements.Menu) {
                        obj.Elements.Menu.style.display = "none";
                        obj.Elements.Header.Elements.HamburgerMenu.className = "Element-HamburgerMenu";
                    }

                    if (obj.Embedded) {
                        var newScroll = obj.CurrentScrollElement.scrollTop;
                        var oldScroll = obj.CurrentScrollPosition;
                        obj.CurrentScrollPosition = newScroll;

                        if (newScroll + obj.CurrentScrollElement.offsetHeight + 50 > obj.CurrentScrollElement.scrollHeight)
                            return;
                        if (newScroll < oldScroll) {
                            scrollUpCounter += oldScroll - newScroll;
                            scrollDownCounter = 0;
                        } else {
                            scrollUpCounter = 0;
                            scrollDownCounter += newScroll - oldScroll;
                        }

                        if (scrollDownCounter > 40 && newScroll > 50) {
                            // Hide menu
                            obj.Elements.Header.style.height = "0px";
                            obj.Elements.Content.style.top = "0px";
                            if (obj.Elements.Menu)
                                obj.Elements.Menu.style.top = "0px";
                        } else if (scrollUpCounter > 40) {
                            obj.Elements.Header.style.height = "40px";
                            obj.Elements.Content.style.top = "40px";
                            if (obj.Elements.Menu)
                                obj.Elements.Menu.style.top = "40px";
                        }  
                    } else {
                        var newScroll = obj.CurrentScrollElement.scrollY;
                        var oldScroll = obj.CurrentScrollPosition;
                        obj.CurrentScrollPosition = newScroll;

                        if (newScroll + window.innerHeight + 50 > document.documentElement.scrollHeight)
                            return;

                        if (newScroll < oldScroll) {
                            scrollUpCounter += oldScroll - newScroll;
                            scrollDownCounter = 0;
                        } else {
                            scrollUpCounter = 0;
                            scrollDownCounter += newScroll - oldScroll;
                        }

                        if (scrollDownCounter > 40 && newScroll > 50) {
                            // Hide menu
                            obj.Elements.Header.style.height = "0px";
                        } else if (scrollUpCounter > 40) {
                            obj.Elements.Header.style.height = "40px";
                        }  
                    }
                  
                };
                this.CurrentScrollElement.addEventListener("scroll", this.OnScrollListener);
            }
        } else {
            this.ShowMenu = false;
            var paddingLeft = 0;
            if (this.className.indexOf("toolkitSizeSmall") >= 0)
                this.className = this.className.replace(/toolkitSizeSmall/g, "");

            if (w < this.ResponsiveFullThreshold) { // Medium view                
                paddingLeft = (this.MenuIconSize);                
                if (this.className.indexOf("toolkitSizeMedium") < 0)
                    this.className += " toolkitSizeMedium";
            } else { // Big/default view                
                if (this.className.indexOf("toolkitSizeMedium") >= 0)
                    this.className = this.className.replace(/toolkitSizeMedium/g, "");
                paddingLeft = (this.MenuIconSize + this.MenuTextSize);
            }

            if (this.Elements.Menu) {                
                this.Elements.Menu.style.display = "";
                this.Elements.Header.Elements.HamburgerMenu.style.display = "none";
                this.Elements.Header.Elements.CurrentLogo.style.left = "9px";                

                if (w < this.ResponsiveFullThreshold) { // Medium view
                    // Just show icons
                    if (this.Elements.Menu.className.indexOf("toolkitDocked") < 0)
                        this.Elements.Menu.className += " toolkitDocked";
                } else {
                    // Show icons and text
                    if (this.Elements.Menu.className.indexOf("toolkitDocked") >= 0)
                        this.Elements.Menu.className = this.Elements.Menu.className.replace(/toolkitDocked/g, "");
                }

                if (this.Embedded) {
                    this.Elements.Content.style.left = paddingLeft + "px";
                    this.Elements.Content.style.top = "40px";
                } else {
                    document.body.style.paddingLeft = paddingLeft + "px";
                    document.body.style.paddingTop = "40px";
                }

                this.Elements.Header.style.height = "40px";
                this.Elements.Menu.style.top = "40px";
                this.Elements.Menu.style.width = paddingLeft + "px";

            } else {
                paddingLeft = 0;
            }

            if (this.Elements.SubMenu) {
                this.Elements.SubMenu.style.bottom = "";
                this.Elements.SubMenu.style.top = "40px";
                this.Elements.SubMenu.style.left = paddingLeft + "px";
                this.Elements.SubMenu.style.right = "0px";
                if (this.Embedded) {
                    this.Elements.Content.style.top = "80px";
                } else {
                    document.body.style.paddingTop = "80px";
                }
            }
            if (this.Embedded) {
                this.Elements.Content.style.bottom = "0px";
            } else {
                document.body.style.paddingBottom = "0px";
            }

            if (this.OnScrollListener) {
                this.CurrentScrollElement.removeEventListener("scroll", this.OnScrollListener);
                this.OnScrollListener = null;
            }
        } 
    },
    Destroy: function () {
        window.removeEventListener("resize", this.OnResizeListener);
        if (this.OnScrollListener) {
            this.CurrentScrollElement.removeEventListener("scroll", this.OnScrollListener);
        }
        if (!this.Embedded) {
            document.body.style.paddingTop = "";
            document.body.style.paddingLeft = "";
        }
    },
    Elements: {}
};