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
    }
};
TK.Draw.Line = {
    DrawType: "Line",
    _: TK.Draw.DrawableObject,
    Draw: function (c) {        
        c.beginPath();
        this.Transform(c);
        c.moveTo(this.X, this.Y);
        if (this.X2 != undefined) {
            c.lineTo(this.X2, this.Y2);
        } else {
            c.lineTo(this.X + this.W, this.Y + this.H);
        }
        
        this.DrawFS(c);
        c.closePath();
    }
};
TK.Draw.LineThroughPoints = {
    DrawType: "LineThroughPoints",
    _: TK.Draw.DrawableObject,
    Points: [], // [ [x,y], [x, y] ], optionally a third parameter (direction) can be passed as well [x, y, direction]
    Heights: [], // Array with heights for each point, for creating an area chart or sankey lines
    Smoothing: TK.Draw.SmoothNone,
    DefaultDirection: TK.Draw.DirectionRight, // Default direction if not set at point level, used for smoothing
    CornerRadius: 10, 
    Draw: function (c) {
        c.beginPath();
        if (!this.W) {
            this.W = 0;
            for (var i = 0; i < this.Points.length; i++) {
                if (this.Points[i][0] > this.W)
                    this.W = this.Points[i][0];
                if (this.Points[i][1] > this.H)
                    this.H = this.Points[i][1];
            }
        }
        this.Transform(c);
        var obj = this;

        var passes = this.Heights && this.Heights.length >= this.Points.length ? 2 : 1;
        var points = this.Points.slice();
        var cornersEndPos = function (point, otherPoint, reverseDir) {
            point = point.slice();
            var dir = point.length > 2 && point[2] !== null && point[2] !== undefined ? point[2] : obj.DefaultDirection;
            var cornerSize = obj.CornerRadius;

            if (reverseDir)
                dir = (dir + 2) % 4;
            if (dir == TK.Draw.DirectionTop) {
                point[2] = otherPoint[0] >= point[0] ? TK.Draw.DirectionRight : TK.Draw.DirectionLeft;
                point[1] -= cornerSize;
                point[0] += otherPoint[0] >= point[0] ? cornerSize : -cornerSize;
            } else if (dir == TK.Draw.DirectionRight) {
                point[2] = otherPoint[1] >= point[1] ? TK.Draw.DirectionBottom : TK.Draw.DirectionTop;
                point[1] += otherPoint[1] >= point[1] ? cornerSize : -cornerSize;
                point[0] += cornerSize;
            } else if (dir == TK.Draw.DirectionBottom) {
                point[2] = otherPoint[0] >= point[0] ? TK.Draw.DirectionRight : TK.Draw.DirectionLeft;
                point[1] += cornerSize;
                point[0] += otherPoint[0] >= point[0] ? cornerSize : -cornerSize;
            } else if (dir == TK.Draw.DirectionLeft) {
                point[2] = otherPoint[1] >= point[1] ? TK.Draw.DirectionBottom : TK.Draw.DirectionTop;
                point[1] += otherPoint[1] >= point[1] ? cornerSize : -cornerSize;
                point[0] -= cornerSize;
            }
            return point;
        };
        var cornersDrawCurve = function (point, otherPoint, dir) {
            // Dir should be the direction after the curve
            if (dir == TK.Draw.DirectionTop || dir == TK.Draw.DirectionBottom) {
                c.quadraticCurveTo(otherPoint[0] + obj.X, point[1] + obj.Y, otherPoint[0] + obj.X, otherPoint[1] + obj.Y);
            } else {
                c.quadraticCurveTo(point[0] + obj.X, otherPoint[1] + obj.Y, otherPoint[0] + obj.X, otherPoint[1] + obj.Y);
            }
            //c.lineTo(otherPoint[0], otherPoint[1]);
        };
        for (var pass = 0; pass < passes; pass++) {
            if (pass == 1) {
                // If the heights for all points is set, we will loop through the points a second time
                // in reverse order with the added heights and reversed directions so we can make a full closed loop.
                points = points.map(function (p, index) {
                    var newP = p.slice();
                    newP[1] += obj.Heights[index];
                    newP[2] = ((newP[2] !== undefined && newP[2] !== null ? newP[2] : obj.DefaultDirection) + 2) % 4;
                    return newP;
                });
                points = points.reverse();
            }

            for (var i = 0; i < points.length; i++) {
                var p = points[i];
                var dir = p.length >= 3 && p[2] !== null && p[2] !== undefined ? p[2] : this.DefaultDirection;
                
                if (i == 0) {
                    if (pass == 0)
                        c.moveTo(p[0] + this.X, p[1] + this.Y);
                    else
                        c.lineTo(p[0] + this.X, p[1] + this.Y);
                    continue;
                }
                var lp = points[i - 1];
                var ldir = lp.length >= 3 && lp[2] !== null && lp[2] !== undefined ? lp[2] : this.DefaultDirection;

                var x_mid = (lp[0] + p[0]) / 2;
                var y_mid = (lp[1] + p[1]) / 2;

                if (!this.Smoothing) {
                    c.lineTo(p[0] + this.X, p[1] + this.Y);
                } else if (this.Smoothing == TK.Draw.SmoothQuadratic) {
                    if (ldir == TK.Draw.DirectionRight || ldir == TK.Draw.DirectionLeft) {
                        var cp_x1 = (x_mid + lp[0]) / 2;
                        var cp_x2 = (x_mid + p[0]) / 2;
                        c.quadraticCurveTo(cp_x1 + this.X, lp[1] + this.Y, x_mid + this.X, y_mid + this.Y);
                        c.quadraticCurveTo(cp_x2 + this.X, p[1] + this.Y, p[0] + this.X, p[1] + this.Y);
                    } else if (ldir == TK.Draw.DirectionTop || ldir == TK.Draw.DirectionBottom) {
                        var cp_y1 = (y_mid + lp[1]) / 2;
                        var cp_y2 = (y_mid + p[1]) / 2;
                        c.quadraticCurveTo(lp[0] + this.X, cp_y1 + this.Y, x_mid + this.X, y_mid + this.Y);
                        c.quadraticCurveTo(p[0] + this.X, cp_y2 + this.Y, p[0] + this.X, p[1] + this.Y);
                    }
                } else if (this.Smoothing == TK.Draw.SmoothCorners) {
                    // TODO:
                    // - Check if it's nearby, we might need to reduce the corner radius
                    // - Do multiple corners if we are not in the correct direction yet
                    //var startPoint = cornersEndPos(lp, p);
                    var startPoint = [lp[0], lp[1], ldir];
                    var endPoint = cornersEndPos(p, lp, true);
                    var revDirEnd = (endPoint[2] + 2) % 4;

                    
                    var max = 100;
                    while (startPoint[0] != endPoint[0] || startPoint[1] != endPoint[1]) {
                        max--;
                        if (max == 0) {
                            console.log("max reached");
                            break;
                        }
                        var startDirHorizontal = startPoint[2] == TK.Draw.DirectionLeft || startPoint[2] == TK.Draw.DirectionRight;
                        if (startPoint[2] == revDirEnd && startDirHorizontal && startPoint[1] == endPoint[1]) {
                            // If already at the right height, just need 1 line to connect
                            c.lineTo(endPoint[0] + this.X, endPoint[1] + this.Y);
                            break;
                        } else if (startPoint[2] == revDirEnd && !startDirHorizontal && startPoint[0] == endPoint[0]) {
                            // If already at the right x pos, just need 1 line to connect
                            c.lineTo(endPoint[0] + this.X, endPoint[1] + this.Y);
                            break;
                        } else {
                            // Make a line towards the right direction
                            var newPos = startPoint.slice();
                            if (startPoint[2] == TK.Draw.DirectionRight) {
                                if (endPoint[2] == TK.Draw.DirectionLeft)
                                    newPos[0] = endPoint[0] - (2 * this.CornerRadius);
                                else if (endPoint[2] == TK.Draw.DirectionTop || endPoint[2] == TK.Draw.DirectionBottom)
                                    newPos[0] = endPoint[0] - this.CornerRadius;
                                else
                                    newPos[0] = endPoint[0];
                                startPoint[0] = newPos[0] > startPoint[0] ? newPos[0] : startPoint[0];
                            } else if (startPoint[2] == TK.Draw.DirectionLeft) {
                                if (endPoint[2] == TK.Draw.DirectionRight)
                                    newPos[0] = endPoint[0] + (2 * this.CornerRadius);
                                else if (endPoint[2] == TK.Draw.DirectionTop || endPoint[2] == TK.Draw.DirectionBottom)
                                    newPos[0] = endPoint[0] + this.CornerRadius;
                                else
                                    newPos[0] = endPoint[0];
                                startPoint[0] = newPos[0] < startPoint[0] ? newPos[0] : startPoint[0];
                            } else if (startPoint[2] == TK.Draw.DirectionBottom) {
                                if (endPoint[2] == TK.Draw.DirectionTop)
                                    newPos[1] = endPoint[1] - (2 * this.CornerRadius);
                                else if (endPoint[2] == TK.Draw.DirectionLeft || endPoint[2] == TK.Draw.DirectionRight)
                                    newPos[1] = endPoint[1] - this.CornerRadius;
                                else
                                    newPos[1] = endPoint[1];
                                startPoint[1] = newPos[1] > startPoint[1] ? newPos[1] : startPoint[1];
                            } else if (startPoint[2] == TK.Draw.DirectionTop) {
                                if (endPoint[2] == TK.Draw.DirectionRight)
                                    newPos[1] = endPoint[1] + (2 * this.CornerRadius);
                                else if (endPoint[2] == TK.Draw.DirectionLeft || endPoint[2] == TK.Draw.DirectionRight)
                                    newPos[1] = endPoint[1] + this.CornerRadius;
                                else
                                    newPos[1] = endPoint[1];
                                startPoint[1] = newPos[1] < startPoint[1] ? newPos[1] : startPoint[1];
                            }

                            c.lineTo(startPoint[0] + this.X, startPoint[1] + this.Y);

                            // Corner into the right direction and update our start pos
                            var newStartPoint = cornersEndPos(startPoint, p);
                            cornersDrawCurve(startPoint, newStartPoint, newStartPoint[2]);
                            startPoint = newStartPoint;
                        }
                    }
                    //c.moveTo(p[0],p[1])
                    cornersDrawCurve(startPoint, p, dir);
                }
            }
            if (pass == 1 && this.Points.length > 0) {
                c.lineTo(this.Points[0][0] + this.X, this.Points[0][1] + this.Y);
            }
        }

        this.DrawFS(c);
        c.closePath();
    }
};

TK.Draw.Rect = {
    DrawType: "Rect",
    _: TK.Draw.DrawableObject,
    //RoundCorners: [15,15,15,15],
    ShadeSize: 0,    
    ShadePosition: 1,
    Extrude: 0, // Does not work with RoundCorners yet
    DrawRoundedRect: function (c, x, y, w, h, corners) {
        if (!corners || (corners[0] == 0 && corners[1] == 0 && corners[2] == 0 && corners[3] == 0)) {
            c.rect(x, y, w, h);
            return;
        }        

        c.moveTo(x + corners[0], y);
        c.lineTo(x + w - corners[1], y);
        c.quadraticCurveTo(x + w, y, x + w, y + corners[1]);
        c.lineTo(x + w, y + h - corners[2]);
        c.quadraticCurveTo(x + w, y + h, x + w - corners[2], y + h);
        c.lineTo(x + corners[3], y + h);
        c.quadraticCurveTo(x, y + h, x, y + h - corners[3]);
        c.lineTo(x, y + corners[0]);
        c.quadraticCurveTo(x, y, x + corners[0], y);
    },
    Draw: function (c) {
        c.beginPath();
        this.Transform(c);

        
        var corners = null;
        if (this.RoundCorners && this.RoundCorners.length == 4) {
            corners = this.RoundCorners.slice();
            var w = this.W;
            var h = this.H;
            var f = 2;
            if (corners[0] * f > w || corners[1] * f > w || corners[2] * f > w || corners[3] * f > w || corners[0] * f > h || corners[1] * f > h || corners[2] * f > h || corners[3] * f > h)
                corners = null;
        }

        this.DrawRoundedRect(c, this.X, this.Y, this.W, this.H, corners);

        this.DrawFS(c);
        c.closePath();

        if (this.Extrude) {
            if (this.Extrude > 0) {
                // Outside, Draw lighter color above, darker color on the right
                c.beginPath();
                c.fillStyle = this.FillExtrudeLightColor ? this.FillExtrudeLightColor : TK.Draw.ColorToDifferentColor(this.Fill, "#FFF", 0.4);
                c.moveTo(this.X, this.Y);
                c.lineTo(this.X + this.Extrude, this.Y - this.Extrude);
                c.lineTo(this.X + this.W + this.Extrude, this.Y - this.Extrude);
                c.lineTo(this.X + this.W, this.Y);
                c.lineTo(this.X, this.Y);
                c.fill();
                c.closePath();

                c.beginPath();
                c.fillStyle = this.FillExtrudeDarkColor ? this.FillExtrudeDarkColor : TK.Draw.ColorToDifferentColor(this.Fill, "#000", 0.4);
                c.moveTo(this.X + this.W, this.Y);
                c.lineTo(this.X + this.W + this.Extrude, this.Y - this.Extrude);
                c.lineTo(this.X + this.W + this.Extrude, this.Y + this.H - this.Extrude);
                c.lineTo(this.X + this.W, this.Y + this.H);
                c.lineTo(this.X + this.W, this.Y);
                c.fill();
                c.closePath();
            } else if (this.Extrude < 0) {
                // Inside
                c.beginPath();
                //c.fillStyle = colorToDifferentColor(this.Fill, "#FFF", 0.4);
                c.fillStyle = this.FillExtrudeDarkColor ? this.FillExtrudeDarkColor : TK.Draw.ColorToDifferentColor(this.Fill, "#000", 0.4);                
                c.moveTo(this.X, this.Y);
                c.lineTo(this.X + -this.Extrude, this.Y);
                c.lineTo(this.X + -this.Extrude, this.Y + this.H - -this.Extrude);
                c.lineTo(this.X, this.Y + this.H);
                c.lineTo(this.X, this.Y);
                c.fill();
                c.closePath();

                c.beginPath();
                c.fillStyle = this.FillExtrudeLightColor ? this.FillExtrudeLightColor : TK.Draw.ColorToDifferentColor(this.Fill, "#000", 0.1);
                c.moveTo(this.X, this.Y + this.H);
                c.lineTo(this.X + -this.Extrude, this.Y + this.H - -this.Extrude);
                c.lineTo(this.X + this.W, this.Y + this.H - -this.Extrude);
                c.lineTo(this.X + this.W, this.Y + this.H);
                c.lineTo(this.X, this.Y + this.H);
                c.fill();
                c.closePath();                
            }
        }

        if (this.ShadeSize) {
            c.beginPath();
            this.Transform(c);
            var origFill = this.Fill;
            var origStroke = this.Stroke;
            this.Fill = "rgba(0,0,0,0.2)";
            this.Stroke = null;

            if (!corners)
                corners = [0, 0, 0, 0];

            if (this.ShadePosition == 0)
                this.DrawRoundedRect(c, this.X, this.Y, this.W, this.ShadeSize, [corners[0], corners[1], 0, 0]);                
            else if (this.ShadePosition == 1)
                this.DrawRoundedRect(c, (this.X + this.W) - this.ShadeSize, this.Y, this.ShadeSize, this.H, [0, corners[1], corners[2], 0]);
            else if (this.ShadePosition == 2)
                this.DrawRoundedRect(c, this.X, (this.Y + this.H) - this.ShadeSize, this.W, this.ShadeSize, [0, 0, corners[2], corners[3]]);
            else if(this.ShadePosition == 3)
                this.DrawRoundedRect(c, this.X, this.Y, this.ShadeSize, this.H, [corners[1], 0, 0, 0]);

            this.DrawFS(c);
            c.closePath();
            this.Fill = origFill;
            this.Stroke = origStroke;
        }
    }
};
TK.Draw.Circle = {
    DrawType: "Circle",
    _: TK.Draw.DrawableObject,
    Angle: 0, Size: null, DonutSize: null, Extrude: 0,
    Draw: function (c) {
        c.beginPath();
        this.Transform(c);

        if (this.Size || this.DonutSize) {
            
            // Complicated (slower) method for partial circles
            var outerRadius = this.W * 0.5;
            var innerRadius = outerRadius * this.DonutSize;

            var centerPosX = this.X + this.W * 0.5;
            var centerPosY = this.Y + this.H * 0.5;


            if (this.Extrude) {
                var extrudeAngle = (this.Angle + (this.Size * 0.5)) * Math.PI / 180;
                centerPosX += Math.cos(extrudeAngle) * this.Extrude;
                centerPosY += Math.sin(extrudeAngle) * this.Extrude;
            }

            var th1 = this.Angle * Math.PI / 180; // 0 = begin angle
            var th2 = (this.Size + this.Angle) * Math.PI / 180; // 45 = end angle
            var startOfOuterArcX = outerRadius * Math.cos(th2) + centerPosX;
            var startOfOuterArcY = outerRadius * Math.sin(th2) + centerPosY;


            c.arc(centerPosX, centerPosY, innerRadius, th1, th2, false);
            c.lineTo(startOfOuterArcX, startOfOuterArcY);
            c.arc(centerPosX, centerPosY, outerRadius, th2, th1, true);
        } else {
            // Simple (faster) method for simple circles
            c.ellipse(this.X + this.W * 0.5, this.Y + this.H * 0.5, this.W * 0.5, this.H * 0.5, 0, 0, (2 * Math.PI));
        }
        this.DrawFS(c);
        c.closePath();
    },
    CheckMouseOver: function (x, y) {
        var cx = (this.Anchor & TK.Draw.AnchorLeft) ? this.X + (this.W / 2) : (this.Anchor & TK.Draw.AnchorRight) ? this.X - (this.W / 2) : this.X;
        var cy = (this.Anchor & TK.Draw.AnchorTop) ? this.Y + (this.H / 2) : (this.Anchor & TK.Draw.AnchorBottom) ? this.Y - (this.H / 2) : this.Y;
        if (this.Extrude) {
            var extrudeAngle = (this.Angle + (this.Size * 0.5)) * Math.PI / 180;
            cx += Math.cos(extrudeAngle) * this.Extrude;
            cy += Math.sin(extrudeAngle) * this.Extrude;
        }
        if (this.Size && this.Size < 360) {
            var deg = Math.atan2(y - cy, x - cx) * 180.0 / Math.PI;
            if (deg < 0)
                deg = 360 + deg; // Turn into a value between 0 and 360

            var checkFrom = this.Angle % 360;
            if (checkFrom < 0)
                checkFrom = 360 + checkFrom; // Start is also in a value between 0 and 360
            var checkTo = (checkFrom + this.Size) % 360;

            if (deg < checkFrom && (checkTo > checkFrom || deg > checkTo))
                return false;
            if (deg > checkTo && (checkFrom < checkTo || deg < checkTo))
                return false;

        }
        var dist = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2));
        if (this.DonutSize && dist <= (this.W / 2) * this.DonutSize)
            return false;
        return (dist <= this.W / 2);
    }
};
TK.Draw.Text = {
    DrawType: "Text",
    _: TK.Draw.DrawableObject,
    DrawAndTransformDisabled: true,
    Text: "Blabla", Font: "30pt Arial", 
    Draw: function (c) {
        c.beginPath();
        this.Transform(c);

        c.font = this.Font;

        if ((this.Anchor & TK.Draw.AnchorCenter) > 0) {
            c.textAlign = "center";
        } else if ((this.Anchor & TK.Draw.AnchorLeft) > 0) {
            c.textAlign = "left";
        } else if ((this.Anchor & TK.Draw.AnchorRight) > 0) {
            c.textAlign = "right";
        }

        if ((this.Anchor & TK.Draw.AnchorMiddle) > 0) {
            c.textBaseline = "middle";
        } else if ((this.Anchor & TK.Draw.AnchorTop) > 0) {
            c.textBaseline = "top";
        } else if ((this.Anchor & TK.Draw.AnchorBottom) > 0) {
            c.textBaseline = "bottom";
        }

        this.DrawFS(c);



        if (!this.W) {
            var rect = c.measureText(this.Text);
            this.W = rect.width;         
        }
        if (!this.H) {
            this.H = this.MeasureHeight(this.Text, this.Font);
        }

        if (this.Rotate) {
            var translateX = this.X;
            var translateY = this.Y;

            c.translate(translateX, translateY);
            //c.ellipse(0, 0, 35, 35, 0, 0, (2 * Math.PI));

            c.rotate(this.Rotate * Math.PI / 180);
            c.translate(-translateX, -translateY);
        }

        if (this.Fill)
            c.fillText(this.Text, this.X, this.Y);
        if (this.Stroke)
            c.strokeText(this.Text, this.X, this.Y);
        c.closePath();
    },
    FillWidthHeight: function () {
        this.W = this.MeasureWidth(this.Text, this.Font);
        this.H = this.MeasureHeight(this.Text, this.Font);
    },
    MeasureHeight: function (txt, font) {
        var height = 16;
        var f = font.split(' ');
        if (f.length > 1) {
            height = parseInt(f[0]);
            if (f[0].indexOf("pt") > 0) {
                height *= 1.34; // TODO: Fix for different user settings
            } else if (f[0].indexOf("em") > 0) {
                height *= 16;
            }
        }    
        return height;
    },
    MeasureWidth: function (txt, font) {
        if (txt == undefined)
            txt = this.Text;
        if (font == undefined)
            font = this.Font;
        var c = document.createElement("CANVAS");
        c = c.getContext("2d");
        c.textAlign = "left";
        c.textBaseline = "top";
        c.font = font;        
        return c.measureText(txt).width;
    }
};


TK.Draw.Image = {
    DrawType: "Image",
    _: TK.Draw.DrawableObject,
    //RoundCorners: [15,15,15,15],
    Img: null,
    Src: null,
    Draw: function (c) {
        var obj = this;
        if (!this.Img && this.Src) {
            this.Img = new Image();
            this.Img.onload = function () {
                // Refresh draw
                c.CanvasObj.Refresh();                
            };
            this.Img.src = this.Src;
            return;
        }
        if (!this.Img)
            return;
        
        c.beginPath();
        this.Transform(c);
        this.DrawFS(c);
        try {
            c.globalAlpha = this.Opacity;
            c.drawImage(this.Img, this.X, this.Y, this.W, this.H);
            c.globalAlpha = 1;
        } catch (errie) { }
        c.closePath();        
    }
};