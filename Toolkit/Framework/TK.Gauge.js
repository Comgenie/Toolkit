"use strict";
/* Minify Skip */
/* Minify Order(200) */

TK.Gauge = {
    _: "div",
    Ranges: [
        /*
        { MinValue: 0, MaxValue: 5, Color: "#C00" },
        { MinValue: 5, MaxValue: 15, Color: "#FC0" },
        { MinValue: 15, MaxValue: 30, Color: "#090" }
        */
    ],

    Width: 400,
    Height: 200,
    Value: 0,
    StartAngle: -180,
    EndAngle: 0,
    DonutSize: 0.8,
    Label: "",
    EnableValue: true,
    ColorLabel: "#666",    
    FontLabel: "12pt Verdana",
    ColorValue: null, // Automatic (pick range color)
    FontValue: "14pt Verdana",
    TextValue: null, // Automatic (Use actual value)
    EnableShadow: true,
    ColorCursor: "#666",
    AnimationLength: 1000,
    ExtraSpacingBottom: 0,
    Style: 0,  // 0: Circular gauge, 1: Horizontal Gauge
    SizeBar: 20,

    Init: function () {
        this.Clear();
        this.Canvas = this.Add({
            _: TK.Draw,
            Width: this.Width,
            Height: this.Height
        }, "Canvas");
        this.Refresh();

    },
    Refresh: function () {
        this.Canvas.Clear();
        var centerX = this.Width / 2;
        var extraSpacingHeight = (this.Height * 0.1) + this.ExtraSpacingBottom;
        if (this.Label)
            extraSpacingHeight += 25;
        if (this.EnableValue)
            extraSpacingHeight += 25;        

        var centerY = this.Height - extraSpacingHeight;        
        
        var size = this.Width > centerY * 2 ? centerY * 2 : this.Width;
        this.MinValue = this.Ranges.Min(function (a) { return a.MinValue; });
        this.MaxValue = this.Ranges.Max(function (a) { return a.MaxValue; });
        
        this.Difference = this.MaxValue - this.MinValue;
        this.DifferenceAngles = this.EndAngle - this.StartAngle;

        for (var i = 0; i < this.Ranges.length; i++) {            

            if (this.Style == 0) {
                var startAngle = this.StartAngle + (((this.Ranges[i].MinValue - this.MinValue) / this.Difference) * this.DifferenceAngles);
                var sizeAngle = ((this.Ranges[i].MaxValue - this.Ranges[i].MinValue) / this.Difference) * this.DifferenceAngles;
                this.Canvas.Add({
                    _: TK.Draw.Circle,
                    X: centerX, Y: centerY, W: size, H: size,
                    Fill: this.Ranges[i].Color, DonutSize: this.DonutSize, Angle: startAngle, Size: sizeAngle,
                    Anchor: window.TK.Draw.AnchorCenter | window.TK.Draw.AnchorMiddle,
                });

                if (this.EnableShadow) {
                    this.Canvas.Add({
                        _: TK.Draw.Circle,
                        X: centerX, Y: centerY, W: size * (this.DonutSize + 0.05), H: size * (this.DonutSize + 0.05),
                        Fill: "rgba(0,0,0,0.1)", DonutSize: 0.85, Angle: startAngle, Size: sizeAngle,
                        Anchor: window.TK.Draw.AnchorCenter | window.TK.Draw.AnchorMiddle,
                    });
                }
            } else if (this.Style == 1) {
                var fromX = ((this.Ranges[i].MinValue - this.MinValue) / this.Difference) * this.Width;
                var widthX = ((this.Ranges[i].MaxValue - this.Ranges[i].MinValue) / this.Difference) * this.Width;
                this.Canvas.Add({
                    _: TK.Draw.Rect,
                    X: fromX, Y: 10, W: widthX, H: this.SizeBar,
                    Fill: this.Ranges[i].Color, 
                    Anchor: window.TK.Draw.AnchorLeft| window.TK.Draw.AnchorTop,
                });

                if (this.EnableShadow) {
                    this.Canvas.Add({
                        _: TK.Draw.Rect,
                        X: fromX, Y: this.SizeBar + 5, W: widthX, H: 5,
                        Fill: "rgba(0,0,0,0.1)",
                        Anchor: window.TK.Draw.AnchorLeft | window.TK.Draw.AnchorTop,
                    });
                }
            }
        }

        // Draw cursor

        if (this.Style == 0) {
            this.Cursor = this.Canvas.Add({
                _: TK.Draw.Rect,
                X: centerX, Y: centerY, W: size * 0.025, H: size * (0.5 - ((1 - this.DonutSize) * 0.25)),
                Fill: this.ColorCursor,
                Rotate: 0,
                Anchor: window.TK.Draw.AnchorCenter | window.TK.Draw.AnchorBottom,
            });

            this.Canvas.Add({
                _: TK.Draw.Circle,
                X: centerX, Y: centerY, W: size * 0.1, H: size * 0.1,
                Fill: this.ColorCursor,
                Anchor: window.TK.Draw.AnchorCenter | window.TK.Draw.AnchorMiddle,
            });
        } else {

            this.Cursor = this.Canvas.Add({
                _: TK.Draw.Rect,
                X: 0, Y: 0, W: 2, H: this.SizeBar + 20,
                Fill: this.ColorCursor,
                Anchor: window.TK.Draw.AnchorCenter | window.TK.Draw.AnchorTop,
            });
        }
        var curY = centerY + (size * 0.1);

        if (this.Label) {
            this.LabelText = this.Canvas.Add({
                _: TK.Draw.Text,
                X: centerX, Y: curY,
                Fill: this.ColorLabel,
                Font: this.FontLabel,
                Text: this.Label,
                Anchor: window.TK.Draw.AnchorCenter | window.TK.Draw.AnchorMiddle,
            });
            curY += 25;
        }

        if (this.EnableValue) {
            this.ValueText = this.Canvas.Add({
                _: TK.Draw.Text,
                X: centerX, Y: curY,
                Fill: this.ColorValue ? this.ColorValue : "#000",
                Font: this.FontValue,
                Text: this.Value,
                Anchor: window.TK.Draw.AnchorCenter | window.TK.Draw.AnchorMiddle,
            });
        }

        this.SetValue(this.Value);
        this.Canvas.Refresh();        
    },
    SetValue: function (newValue) {
        var animation = window.TK.Draw.EaseExponential;

        if (newValue >= this.MaxValue) {
            animation = window.TK.Draw.EaseBounce;
            newValue = this.MaxValue;
        } else if (newValue <= this.MinValue) {
            animation = window.TK.Draw.EaseBounce;
            newValue = this.MinValue;
        }

        if (this.EnableValue) {
            this.ValueText.Text = this.TextValue ? this.TextValue : newValue;
            var activeRange = this.Ranges.Where(function (a) { return a.MinValue <= newValue && a.MaxValue >= newValue; });

            if (activeRange.length > 0 && !this.ColorValue) {
                this.ValueText.Fill = activeRange[activeRange.length - 1].Color;
            }
        }
        if (this.Style == 0) {
            var valueAngle = this.StartAngle + (((newValue - this.MinValue) / this.Difference) * this.DifferenceAngles);
            this.Cursor.Animate("Rotate", valueAngle + 90, this.AnimationLength, animation);
        } else if (this.Style == 1) {
            var valueX = (((newValue - this.MinValue) / this.Difference) * this.Width - 2) + 1;
            this.Cursor.Animate("X", valueX, this.AnimationLength, animation);
        }
        // Move cursor
        this.Value = newValue;
    }
};