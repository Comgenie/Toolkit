"use strict";
/* Minify Skip */
/* Minify Order(150) */

TK.Draw = {
    _: "canvas",
    Width: 100,
    Height: 100,
    Scale: 2, // Rendering scale, increase to keep sharpness when zooming in on the page but decrease performance
    Zoom: 1,
    ViewPortX: 0,
    ViewPortY: 0,
    EnableNavigation: false, // If true, the canvas can be dragged around and zoomed in/out using mouse wheel
    EnableZoom: false,
    MinZoom: 0.2,
    MaxZoom: 10,
    Animations: [],
    Init: function () {
        this.width = this.Width * this.Scale;
        this.height = this.Height * this.Scale;
        this.style.width = this.Width + "px";
        this.style.height = this.Height + "px";
        this.Context = this.GetContext();
        this.Context.CanvasObj = this;
        this.Refresh();        
    },
    GetContext: function () {
        return this.getContext("2d");
    },
    Refresh: function (skipSortElements) {
        if (this.RefreshAlreadyQueued) {
            if (!skipSortElements)
                this.ForceSortElements = true;
            return;
        }
        if (this.width != this.Width * this.Scale || this.height != this.Height * this.Scale) {
            this.width = this.Width;
            this.height = this.Height;
        }
        var obj = this;
        
        var hasAnimation = this.ProcessAnimations();

        // TODO: If EnableNavigation is true, Draw on an offscreen canvas
        // TODO: Find a way to only redraw whats needed

        this.Context.setTransform(this.Scale, 0, 0, this.Scale , 0, 0);
        this.Context.clearRect(0, 0, this.Width, this.Height);        

        if (!skipSortElements || !this.SortedElements || this.ForceSortElements) {
            this.SortElements();
        }

        for (var i = 0; i < this.SortedElements.length; i++) {
            this.Context.OffsetX = -this.ViewPortX;
            this.Context.OffsetY = -this.ViewPortY;
            this.Context.Scale = this.Scale * this.Zoom;
            if (this.SortedElements[i].Draw)
                this.SortedElements[i].Draw(this.Context);
        }

        if (hasAnimation) {
            this.RefreshAlreadyQueued = true;
            requestAnimationFrame(function () { obj.RefreshAlreadyQueued = false; obj.Refresh(true); });
        }
    },
    ProcessAnimations: function () {
        // Process animations
        var ms = new Date().getTime();
        var hasAnimation = false;
        for (var i = 0; i < this.Animations.length; i++) {
            if (!this.Animations[i])
                continue;
            var a = this.Animations[i];
            var r = (ms - a.S) / a.L;

            if (r >= 1) {
                r = 1;
                if (a.I.AnimationEnded)
                    a.I.AnimationEnded(a.P);
                delete this.Animations[i];
            }
            if (Array.isArray(a.O)) {
                var rgba = [0, 0, 0, 0];
                for (var j = 0; j < a.O.length; j++) {
                    if (Array.isArray(a.O[j])) {
                        // Point array                        
                        for (var n = 0; n < a.O[j].length; n++) {
                            a.I[a.P][j][n] = a.E(a.O[j][n], a.T[j][n], r);

                        }
                    } else if (a.O.length == 4) {
                        // Colors
                        rgba[j] = a.E(a.O[j], a.T[j], r);
                    }
                }
                if (a.O.length == 4) {
                    a.I[a.P] = "rgba(" + rgba.join(",") + ")";
                }
            } else {
                a.I[a.P] = a.E(a.O, a.T, r);
            }
            //a.I[a.P] = a.O + ((a.T - a.O) * r);            
            hasAnimation = true;
            if (a.I.Invalidate) {
                a.I.Invalidate();
            }
        }
        return hasAnimation;
    },
    SortElements: function () {
        this.ForceSortElements = false;
        this.SortedElements = [];
        for (var ele in this.Elements) {
            if (this.Elements[ele].Draw) {
                this.SortedElements.push(this.Elements[ele]);
            }
        }
        this.SortedElements = this.SortedElements.OrderBy(function (a) {
            return a.ZIndex;
        });           
    },
    onclick: function (e) {
        this.HandleMouseEvent(e, "Click");
    },
    onmousemove: function (e) {
        this.HandleMouseEvent(e, "MouseOver"); 
        this.HandleMouseEvent(e, "MouseMove");
        this.HandleMouseEvent(e, "MouseOut");
    },
    ontouchmove: function (e) {
        this.HandleMouseEvent(e, "MouseOver");
        this.HandleMouseEvent(e, "MouseMove");
        this.HandleMouseEvent(e, "MouseOut");
    },
    onmouseout: function (e) {
        this.HandleMouseEvent(e, "MouseOut");
    },
    onmousedown: function (e) {
        this.HandleMouseEvent(e, "MouseDown");
    },
    ontouchstart: function (e) {
        this.HandleMouseEvent(e, "MouseDown");
    },
    onmouseup: function (e) {
        this.HandleMouseEvent(e, "MouseUp");
    },
    ontouchend: function (e) {
        this.HandleMouseEvent(e, "MouseUp");
    },
    onwheel: function (event) {
        if (this.EnableZoom) {
            if (!event)
                event = window.event;
            if (event.preventDefault)
                event.preventDefault();            
            var zoomInPos = [this.ViewPortX + (this.Width / 2 / this.Zoom), this.ViewPortY + (this.Height / 2 / this.Zoom)];
            
            this.Zoom -= event.deltaY < 0 ? -0.25 : 0.25;
            if (this.Zoom < this.MinZoom)
                this.Zoom = this.MinZoom;
            else if (this.Zoom > this.MaxZoom)
                this.Zoom = this.MaxZoom;
            
            // Adjust viewport as we want to zoom in with zoomInPos as center
            this.Center(zoomInPos[0], zoomInPos[1]);
            this.Refresh(true);
        }
    },
    Center: function (x, y, animateLength, animateEase) { // world space px
        // Adjust ViewPortX and ViewPortY so that the x and y positions are in the middle
        x = x - ((this.Width / 2) / this.Zoom); // world space px
        y = y - ((this.Height / 2) / this.Zoom);        
        if (animateLength) {
            this.Animations.push({ I: this, P: "ViewPortX", O: this.ViewPortX, T: x, L: animateLength, E: animateEase ? animateEase : TK.Draw.EaseExponential, S: new Date().getTime() });
            this.Animations.push({ I: this, P: "ViewPortY", O: this.ViewPortY, T: y, L: animateLength, E: animateEase ? animateEase : TK.Draw.EaseExponential, S: new Date().getTime() });
            this.Refresh();
        } else {
            this.ViewPortX = x;
            this.ViewPortY = y;
        }
    },
    HandleMouseEvent: function (e, func) {
        var eventHandled = false;
        var x, y;
        try { x = e.clientX; y = e.clientY; } catch (errie) { var e2 = window.event; x = e2.clientX; y = e2.clientY; }
        
        var rect = this.getBoundingClientRect();        
        // Make sure top/left is always 0,0, then Compensate for the zoom level, then Add the offset from the viewport
        x = ((x - rect.left) / this.Zoom) + this.ViewPortX;
        y = ((y - rect.top) / this.Zoom) + this.ViewPortY;
        var stoppedPropagation = false;

        if (!this.SortedElements || this.ForceSortElements) {
            this.SortElements();
        }

        for (var i = this.SortedElements.length - 1; i >= 0; i--) {
            var el = this.SortedElements[i];
            if (!el[func] || !el.GetRect)
                continue;
            var r = el.GetRect();
            //r[0] -= this.ViewPortX;
            //r[1] -= this.ViewPortY;
            var match = false;
            for (var j = 0; this.CurrentMouseDownElements && j < this.CurrentMouseDownElements.length; j++) {
                if (this.CurrentMouseDownElements[j] == el) {
                    match = true;
                    break;
                }
            }
            if (match || (r[0] < x && r[0] + r[2] > x && r[1] < y && r[1] + r[3] > y && (!el.CheckMouseOver || el.CheckMouseOver(x, y))) && !stoppedPropagation) {                                                                    
                if (func != "MouseOut" && (func != "MouseOver" || !el.CurrentlyMouseOver) ) {                    
                    if (el[func](x, y) === true) {
                        stoppedPropagation = true;
                        el.StoppedPropagation = true;
                    }
                    eventHandled = true;
                }
                if (el.CurrentlyMouseOver && el.StoppedPropagation) {
                    stoppedPropagation = true;
                }
                if (func == "MouseDown") {
                    if (!this.CurrentMouseDownElements)
                        this.CurrentMouseDownElements = [];
                    this.CurrentMouseDownElements.push(el);
                }

                el.CurrentlyMouseOver = true;
            } else if (func == "MouseOut" && el.CurrentlyMouseOver) {
                el[func](x, y);
                eventHandled = true;
                el.CurrentlyMouseOver = false;
                el.StoppedPropagation = false;
            }
        }

        
        if (func == "MouseUp" && this.CurrentMouseDownElements) {
            this.CurrentMouseDownElements = null;
        }

        x = (x - this.ViewPortX) * this.Zoom;
        y = (y - this.ViewPortY) * this.Zoom;
        if (this.CurrentCanvasInteraction) {
            if (func == "MouseMove") {
                this.ViewPortX = this.CurrentCanvasInteraction[2] + ((this.CurrentCanvasInteraction[0] - x) / this.Zoom);
                this.ViewPortY = this.CurrentCanvasInteraction[3] + ((this.CurrentCanvasInteraction[1] - y) / this.Zoom);
            } else if (func == "MouseUp") {
                this.CurrentCanvasInteraction = null;
            }
        } else if (!eventHandled && !this.CurrentMouseDownElements && this.EnableNavigation && func == "MouseDown") {
            // Interaction on the canvas itself
            this.CurrentCanvasInteraction = [x, y, this.ViewPortX, this.ViewPortY];
        }
        this.Refresh();
    }
};
TK.Draw.AnimationsEnabled = true;
TK.Draw.AnchorLeft = 1;
TK.Draw.AnchorCenter = 2;
TK.Draw.AnchorRight = 4;
TK.Draw.AnchorTop = 8;
TK.Draw.AnchorMiddle = 16;
TK.Draw.AnchorBottom = 32;

TK.Draw.SmoothNone = 0;
TK.Draw.SmoothQuadratic = 1; // Quadratic curvers with the center in between the two points
TK.Draw.SmoothCorners = 2; // Only use horizontal and vertical lines, or small 90 degree corners

TK.Draw.DirectionTop = 0;
TK.Draw.DirectionRight = 1;
TK.Draw.DirectionBottom = 2;
TK.Draw.DirectionLeft = 3;

TK.Draw.EaseLinear = function (a, b, r) { return a + ((b - a) * r); };
TK.Draw.EaseExponential = function (a, b, r) {
    var m;
    if (r < 0.5) {
        m = ((r == 0) ? 0 : Math.pow(2, 10 * (r * 2 - 1)) - 0.001) * 0.5;
    } else {
        r = (r * 2) - 1;
        m = (r == 1) ? 1 : (-Math.pow(2, -10 * r) + 1);
        m = 0.5 + 0.5 * m;
    }
    return a + ((b - a) * m);
};
TK.Draw.EaseBack = function (a, b, r) {
    return a + ((b - a) * (r * r * ((2.70158) * r - 1.70158)));
};
TK.Draw.EaseCircular = function(a, b, r) {
    return a + ((b - a) * -(Math.sqrt(1 - r * r) - 1.0));
};
TK.Draw.EaseBounce = function (a, b, r) {
    var multiplier = 1;
    if (r < (1 / 2.75)) {
        multiplier = 7.5625 * r * r;
    } else if (r < (2 / 2.75)) {
        var t = r - (1.5 / 2.75);
        multiplier = 7.5625 * t * t + 0.75;
    } else if (r < (2.5 / 2.75)) {
        var t = r - (2.25 / 2.75);
        multiplier = 7.5625 * t * t + 0.9375;
    } else {
        var t = r - (2.625 / 2.75);
        multiplier = 7.5625 * t * t + 0.984375;
    }
    return a + ((b - a) * multiplier);
};
TK.Draw.EaseCubic = function (a, b, r) {
    return a + ((b - a) * (r * r * r));
};
TK.Draw.EaseElastic = function (a, b, r) {                  
    return a + ((b - a) * (1 + Math.pow(2, -10 * r) * Math.sin((r - (0.3 / 4)) * (Math.PI * 2) / 0.3)));
};
TK.Draw.EaseSine = function (a, b, r) {
    return a + ((b - a) * (-Math.cos(r * (Math.PI / 2)) + 1));
};
TK.Draw.EaseStrong = function (a, b, r) {
    return a + ((b - a) * (r * r * r * r * r));
};

TK.Draw.GetColor = function (s) {
    if (s.substr(0, 4) == "rgba") {
        return s.replace("rgba(", "").replace(")", "").split(",").Select(function (a) { return parseFloat(a); });
    } else if (s.substr(0, 3) == "rgb") {
        return (s.replace("rgb(", "").replace(")", "") + ",1").split(",").Select(function (a) { return parseFloat(a); });
    } else if (s.substr(0, 1) == "#") {
        var c = s.substring(1).split('');
        if (c.length == 3)
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        c = '0x' + c.join('');
        return [(c >> 16) & 255, (c >> 8) & 255, c & 255, 1];
    }
};
TK.Draw.ColorToDifferentColor = function (s, s2, ratio) {
    s = TK.Draw.GetColor(s);
    s2 = TK.Draw.GetColor(s2);
    if (s.length < 4)
        s.push(1);
    if (s2.length < 4)
        s2.push(1);
    for (var i = 0; i < 4; i++) {
        s[i] = TK.Draw.EaseLinear(s[i], s2[i], ratio);
    }
    return "rgba(" + s.join(",") + ")";
};
// Draws all child elements
TK.Draw.Group = {
    DrawType: "Group",
    X: 0,
    Y: 0,
    Draw: function (c) {
        c.OffsetX += this.X;
        c.OffsetY += this.Y;
        for (var i in this.Elements) {
            if (this.Elements[i].Draw)
                this.Elements[i].Draw(c);
        }
        c.OffsetX -= this.X;
        c.OffsetY -= this.Y;
    }
};
TK.Draw.DrawableObject = {
    DrawType: "DrawableObject",
    Fill: null, // Color
    Stroke: null, // Color
    BlendMode: null, // Any value of globalCompositeOperation
    LineWidth: 1,
    LineCap: null,
    Rotate: null,
    Shadow: null, // [X, Y, Size, Color]
    ShadowForLine: false,
    Anchor: TK.Draw.AnchorLeft | TK.Draw.AnchorTop,
    ZIndex: 1,
    X: 0, Y: 0, W: 0, H: 0,
    Opacity: 1,
    Transform: function (c) {
        if (this.DrawAndTransformDisabled) {
            c.setTransform(c.Scale, 0, 0, c.Scale, c.OffsetX * c.Scale, c.OffsetY * c.Scale);
            return;
        }
        var x = 0;
        var y = 0;        

        if ((this.Anchor & TK.Draw.AnchorCenter) > 0) {
            x = -(this.W * 0.5);
        } else if ((this.Anchor & TK.Draw.AnchorRight) > 0) {
            x = -this.W;
        }

        if ((this.Anchor & TK.Draw.AnchorMiddle) > 0) {
            y = -(this.H * 0.5);
        } else if ((this.Anchor & TK.Draw.AnchorBottom) > 0) {
            y = -this.H;
        }        

        c.setTransform(c.Scale, 0, 0, c.Scale, (c.OffsetX + x) * c.Scale, (c.OffsetY + y) * c.Scale);        

        if (this.Rotate) {
            var translateX = this.X - x;
            var translateY = this.Y - y;
            
            c.translate(translateX, translateY);            
            //c.ellipse(0, 0, 35, 35, 0, 0, (2 * Math.PI));
            
            c.rotate(this.Rotate * Math.PI / 180);
            c.translate(-translateX, -translateY);
        }
    },
    DrawFS: function (c) {
        if (this.BlendMode) {
            c.globalCompositeOperation = this.BlendMode;
        }
        if (this.Shadow) {
            c.shadowOffsetX = this.Shadow[0];
            c.shadowOffsetY = this.Shadow[1];
            c.shadowBlur = this.Shadow[2];
            c.shadowColor = this.Shadow[3];
        } else {
            c.shadowColor = "rgba(0,0,0,0)";
            c.shadowBlur = 0;
        }

        c.globalAlpha = this.Opacity;

        if (this.Fill) {
            c.fillStyle = this.Fill;
            if (!this.DrawAndTransformDisabled)
                c.fill();
        }
        if (this.LineCap) {
            c.lineCap = this.LineCap;
        }

        if (!this.ShadowForLine) {
            c.shadowColor = "rgba(0,0,0,0)";
            c.shadowBlur = 0;
        }        

        c.lineWidth = this.LineWidth;
        if (this.Stroke) {
            c.strokeStyle = this.Stroke;
            if (!this.DrawAndTransformDisabled)
                c.stroke();
        }

        c.globalAlpha = 1;
        if (this.BlendMode) {
            c.globalCompositeOperation = "source-over"; // default
        }
    },
    Animate: function (propName, targetValue, ms, easing) {        
        if (!easing)
            easing = TK.Draw.EaseLinear;
        var p = this.Parent;
        while (p !== undefined && p.ProcessAnimations === undefined) // find the TK.Draw component
            p = p.Parent;
        if (!TK.Draw.AnimationsEnabled) {
            this[propName] = targetValue;
            if (this.AnimationEnded)
                this.AnimationEnded();
            if (p)
                p.Refresh();
            return this;
        }

        if (p) {
            if (p.Animations.length > 100) // Clear all deleted animations from the array
                p.Animations = p.Animations.Where(function (a) { return a; });
            
            if (typeof this[propName] === 'string' && typeof targetValue === 'string') {
                // Colors                      
                p.Animations.push({ I: this, P: propName, O: TK.Draw.GetColor(this[propName]), T: TK.Draw.GetColor(targetValue), L: ms, E: easing, S: new Date().getTime() });
            } else if (Array.isArray(this[propName])) {
                p.Animations.push({ I: this, P: propName, O: JSON.parse(JSON.stringify(this[propName])), T: targetValue, L: ms, E: easing, S: new Date().getTime() });                
            } else {
                p.Animations.push({ I: this, P: propName, O: parseFloat(this[propName]), T: targetValue, L: ms, E: easing, S: new Date().getTime() });                
            }
            p.Refresh();
        }
        return this;
    },
    GetRect: function () {
        var x = this.X;
        var y = this.Y;
        
        if ((this.Anchor & TK.Draw.AnchorCenter) > 0) {
            x -= this.W * 0.5;
        } else if ((this.Anchor & TK.Draw.AnchorRight) > 0) {
            x -= this.W;
        }

        if ((this.Anchor & TK.Draw.AnchorMiddle) > 0) {
            y -= this.H * 0.5;
        } else if ((this.Anchor & TK.Draw.AnchorBottom) > 0) {
            y -= this.H;
        }

        return [x, y, this.W, this.H];
    },
    Overlaps: function (otherDrawableObject) {
        var rectA = this.GetRect();
        var rectB = otherDrawableObject.GetRect();
        
        return (rectA[0] < (rectB[0] + rectB[2]) && (rectA[0] + rectA[2]) > rectB[0] && rectA[1] < (rectB[1] + rectB[3]) && (rectA[1] + rectA[3]) > rectB[1]);
    },
    Invalidate: function () {
        // Called whenever a property is changed
    }
};
