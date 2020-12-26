"use strict";
/* Minify Skip */
/* Minify Order(200) */

TK.Donut = {
    _: "div",
    Values: [
        /*
        { Name: "Value A", Color: "#F00", ColorLabel: "#F00", Value: 1, Extrude: 10, Label: "Label 123" },
        { Name: "Value B", Color: "#090", Value: 2 },
        { Name: "Value B", Color: "#009", Value: 2 } */
    ],

    Width: 400,
    Height: 200,
    Size: null,    
    DonutStartX: null,
    DonutStartY: null,
    FinalSizeRatio: 0.8,
    DonutSize: 0.5,
    StartAngle: -90,
    EnableLabels: true,
    FontLabels: "10pt Verdana",
    ColorLabels: "rgba(0,0,0,0.5)",
    ColorLabelLines: "rgba(0,0,0,0.5)",
    LabelStyle: 2,  // 0 = Name only, 1 = Value only, 2 = Both
    ShowValueAsPercentage: true,
    AnimationLength: 1000,
    HideZeroes: true,

    EnableLegend: false,
    LocationLegend: 1, // 0 = Top, 1 = Right, 2 = Bottom, 3 = Left
    ColorLegend: "rgba(0,0,0,0.8)",
    FontLegend: "10pt Verdana",
    LegendStyle: 0, // 0 = Name only, 1 = Value only, 2 = Both
    LegendSize: 0, // 0 = Auto
    LegendLineHeight: 25,

    Init: function () {
        if (!this.Size)
            this.Size = (this.Width > this.Height ? this.Height : this.Width);
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

        var total = 0;
        var countLegend = 0;
        for (var i = 0; i < this.Values.length; i++) {
            if (this.Values[i].HideZeroes && !this.Values[i].Value)
                continue;
            total += this.Values[i].Value;
            countLegend++;
        }
        var donutStartX = this.DonutStartX;
        var donutStartY = this.DonutStartY;

        if (donutStartX === null)
            donutStartX = Math.round((this.Width - this.Size) / 2);
        if (donutStartY === null)
            donutStartY = Math.round((this.Height - this.Size) / 2);



        if (this.EnableLegend) {
            if (this.LegendSize == 0) {
                if (this.LocationLegend == 0 || this.LocationLegend == 2)
                    this.LegendSize = this.Width * 0.9;
                else
                    this.LegendSize = 150;
            }

            var legendSize = (this.LocationLegend == 0 || this.LocationLegend == 2) ? this.LegendLineHeight * countLegend : this.LegendSize;
            if ((this.LocationLegend == 0 || this.LocationLegend == 2) && this.Size > this.Height - legendSize) {
                this.Size = this.Height - legendSize;
                donutStartX = Math.round((this.Width - this.Size) / 2);
                donutStartY = Math.round((this.Height - this.Size) / 2);
            } else if ((this.LocationLegend == 1 || this.LocationLegend == 3) && this.Size > this.Width - legendSize) {
                this.Size = this.Width - legendSize;
                donutStartX = Math.round((this.Width - this.Size) / 2);
                donutStartY = Math.round((this.Height - this.Size) / 2);
            }

            if (this.LocationLegend == 0)
                donutStartY = legendSize + (((this.Height - legendSize) / 2) - (this.Size / 2));
            else if (this.LocationLegend == 1)
                donutStartX = ((this.Width - legendSize) - this.Size) / 2;
            else if (this.LocationLegend == 2)
                donutStartY = ((this.Height - legendSize) - this.Size) / 2;
            else if (this.LocationLegend == 3)
                donutStartX = legendSize + (((this.Width - legendSize) / 2) - (this.Size / 2));
        }

        var middlePointX = (this.Size * 0.5) + donutStartX;
        var middlePointY = (this.Size * 0.5) + donutStartY;

        var curAngle = this.StartAngle;
        var textElements = [];
        for (var i = 0; i < this.Values.length; i++) {
            if (this.Values[i].HideZeroes && !this.Values[i].Value)
                continue;
            var size = (this.Values[i].Value / total) * 360;
            
            var donutPart = this.Canvas.Add({
                _: TK.Draw.Circle,
                DonutSize: this.DonutSize,
                X: middlePointX, Y: middlePointY, W: this.Size, H: this.Size, Size: size, Angle: curAngle, Extrude: 10,
                Fill: this.Values[i].Color,
                Anchor: window.TK.Draw.AnchorCenter | window.TK.Draw.AnchorMiddle,
            });            
            donutPart.Animate("W", this.Size * this.FinalSizeRatio, this.AnimationLength, window.TK.Draw.EaseBounce);

            donutPart.Animate("Extrude", this.Values[i].Extrude ? this.Values[i].Extrude : 0, this.AnimationLength, window.TK.Draw.EaseBounce);            

            // Generate labels (line from the middle)
            var label = this.Values[i].Name;
            if (this.LabelStyle != 0) {
                label = (this.LabelStyle == 2 ? label + ": " : "") + (this.ShowValueAsPercentage ? Math.round(this.Values[i].Value / total * 100) + " %" : this.Values[i].Value);
            }
            if (this.Values[i].Label) {
                label = this.Values[i].Label;
            }

            var labelLegend = this.Values[i].Name;
            if (this.LegendStyle != 0) {
                labelLegend = (this.LegendStyle == 2 ? labelLegend + ": " : "") + (this.ShowValueAsPercentage ? Math.round(this.Values[i].Value / total * 100) + " %" : this.Values[i].Value);
            }

            if (this.EnableLabels && label && !this.Values[i].DisableLabel) {                                                     
                var maxSizeFromMiddle = this.Size * this.FinalSizeRatio * 0.5;
                if (this.Values[i].Extrude) {
                    maxSizeFromMiddle += this.Values[i].Extrude;
                }                
                

                var middleRad = (curAngle + (size * 0.5)) * Math.PI / 180;
                var x = Math.cos(middleRad) * maxSizeFromMiddle * (this.DonutSize * 1.5);
                var y = Math.sin(middleRad) * maxSizeFromMiddle * (this.DonutSize * 1.5);
                var xText = Math.cos(middleRad) * maxSizeFromMiddle * 1.1;
                var yText = Math.sin(middleRad) * maxSizeFromMiddle * 1.1;

                var middleCircle, line1, line2, text;

                middleCircle = this.Canvas.Add({
                    _: TK.Draw.Circle,
                    X: middlePointX + x, Y: middlePointY + y, W: 10, H: 10,
                    ZIndex: 10,
                    Fill: "rgba(0,0,0,0)",
                    Anchor: window.TK.Draw.AnchorCenter | window.TK.Draw.AnchorMiddle,
                });

                line1 = this.Canvas.Add({
                    _: TK.Draw.Line,
                    X: middlePointX + x, Y: middlePointY + y, X2: middlePointX + xText, Y2: middlePointY + yText,
                    ZIndex: 10,
                    Stroke: "rgba(0,0,0,0)",
                    Anchor: window.TK.Draw.AnchorTop | window.TK.Draw.AnchorLeft,
                });

                if (xText < 0) {
                    line2 = this.Canvas.Add({
                        _: TK.Draw.Line,
                        X: middlePointX + xText, Y: middlePointY + yText, X2: middlePointX + xText + -5, Y2: middlePointY + yText,
                        ZIndex: 10,
                        Stroke: "rgba(0,0,0,0)",
                        Anchor: window.TK.Draw.AnchorTop | window.TK.Draw.AnchorLeft,
                    });

                    text = this.Canvas.Add({
                        _: TK.Draw.Text,
                        X: middlePointX + xText + -10, Y: middlePointY + yText,
                        ZIndex: 100,
                        Fill: "rgba(0,0,0,0)",
                        Text: label,
                        Font: this.FontLabels,
                        Anchor: window.TK.Draw.AnchorMiddle | window.TK.Draw.AnchorRight,
                    });
                    
                } else {
                    line2 = this.Canvas.Add({
                        _: TK.Draw.Line,
                        X: middlePointX + xText, Y: middlePointY + yText, X2: middlePointX + xText + 5, Y2: middlePointY + yText,
                        ZIndex: 10,
                        Stroke: "rgba(0,0,0,0)",
                        Anchor: window.TK.Draw.AnchorTop | window.TK.Draw.AnchorLeft,
                    });

                    text = this.Canvas.Add({
                        _: TK.Draw.Text,
                        X: middlePointX + xText + 10, Y: middlePointY + yText, 
                        ZIndex: 100,
                        Fill: "rgba(0,0,0,0)",
                        Text: label,
                        Font: this.FontLabels,
                        Anchor: window.TK.Draw.AnchorMiddle | window.TK.Draw.AnchorLeft,
                    });
                }
                text.FillWidthHeight();
                //console.log(text.GetRect());
                for (var textI = 0; textI < textElements.length; textI++) {
                    while (text.Overlaps(textElements[textI])) {
                        if (xText < 0)
                            text.Y -= 1;
                        else 
                            text.Y += 1;

                        line1.Y2 = text.Y;
                        line2.Y = text.Y;
                        line2.Y2 = text.Y;
                    }
                }

                textElements.push(text);

                var finalColor = this.Values[i].ColorLabel ? this.Values[i].ColorLabel : this.ColorLabels;
                var finalColorLine = this.Values[i].ColorLabelLine ? this.Values[i].ColorLabelLine : this.ColorLabelLines;
                middleCircle.Animate("Fill", finalColorLine, this.AnimationLength, TK.Draw.EaseExponential);
                line1.Animate("Stroke", finalColorLine, this.AnimationLength, TK.Draw.EaseExponential);
                line2.Animate("Stroke", finalColorLine, this.AnimationLength, TK.Draw.EaseExponential);
                text.Animate("Fill", finalColor, this.AnimationLength, TK.Draw.EaseExponential);
            }

            if (this.EnableLegend) {
                var obj = this;
                var legend = {
                    _: TK.Draw.Group,
                    DonutPart: donutPart,
                    ValuesObj: this.Values[i],
                    X: 0, Y: i * 25,
                    Anchor: window.TK.Draw.AnchorMiddle | window.TK.Draw.AnchorLeft,
                    Elements: {
                        Circle: {
                            _: TK.Draw.Circle,
                            X: 0, Y: this.LegendLineHeight / 2, W: 10, H: 10,
                            Fill: this.Values[i].Color,
                            Anchor: window.TK.Draw.AnchorMiddle | window.TK.Draw.AnchorLeft,
                        },
                        Text: {
                            _: TK.Draw.Text,
                            X: 15, Y: this.LegendLineHeight / 2, 
                            Fill: this.ColorLegend,
                            Text: labelLegend,
                            Font: this.FontLegend,
                            Anchor: window.TK.Draw.AnchorMiddle | window.TK.Draw.AnchorLeft,
                        }
                    },
                    GetRect: function () {
                        return [this.X, this.Y, obj.LegendSize, obj.LegendLineHeight];
                    },
                    MouseOver: function () {                        
                        this.DonutPart.Animate("Extrude", 10, 150);
                    },
                    MouseOut: function () {
                        this.DonutPart.Animate("Extrude", this.ValuesObj.Extrude ? this.ValuesObj.Extrude : 0, 150);
                    }
                };
                if (this.LocationLegend == 0) {
                    legend.Y = (i * this.LegendLineHeight);
                    legend.X = (this.Width / 2) - (this.LegendSize / 2);
                    legend.Anchor = window.TK.Draw.AnchorTop | window.TK.Draw.AnchorLeft;
                } else if (this.LocationLegend == 1) {
                    legend.X = this.Width - this.LegendSize;
                    legend.Y = ((this.Height / 2) - ((this.LegendLineHeight * countLegend) / 2)) + (i * this.LegendLineHeight);
                } else if (this.LocationLegend == 2) {
                    legend.Y = (this.Height - (this.LegendLineHeight * countLegend)) + (i * this.LegendLineHeight);
                    legend.X = (this.Width / 2) - (this.LegendSize / 2);
                    legend.Anchor = window.TK.Draw.AnchorTop | window.TK.Draw.AnchorLeft;
                } else if (this.LocationLegend == 3) {
                    legend.Y = ((this.Height / 2) - ((this.LegendLineHeight * countLegend) / 2)) + (i * this.LegendLineHeight);
                }

                this.Canvas.Add(legend);
            }

            curAngle += size;
        }

        this.Canvas.Refresh();
    }
};