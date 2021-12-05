"use strict";
/* Minify Skip */
/* Minify Order(200) */

TK.Chart = {
    _: "div",
    DefaultColors: ["#0081D5", "#FF9947", "#03BD5B", "#A939B9", "#D1335B", "#53657D", "#339999", "#999933", "#993399", "#333399", "#999933"],
    Width: 700,
    Height: 400,
    __RecursivePropertiesSeries: true,
    Series: [
        // Style (flags): 1 Line, 2 Bar, 4 Points, 8 Area, 16 Text with line and point to the value position
        // Data is array with X,Y values, X value can be a number, or date-string, or a color
        //{ Title: "Test series 1", Axis: "X,Y1", Color: "#0081D5",StackGroup: "b",  Style: 2, Smoothing: 1, Data: [["2010-01-01", 100], ["2010-01-02", 100], ["2010-01-03", 50], ["2010-01-04", 100], ["2010-01-05", 75]] },
        //{ Title: "Test series 2", Axis: "X,Y1", Color: "#FF9947", StackGroup: "b", Style: 2, Smoothing: 1, LineWidth: 2, Data: [["2010-01-01", 10], ["2010-01-02", 20], ["2010-01-03", 10], ["2010-01-04", 10], ["2010-01-05", 20]] },
        //{ Title: "Test series 3", Axis: "X,Y1", Color: "#990000", Style: 2, Smoothing: 1, LineWidth: 2, Data: [["2010-01-01", 20], ["2010-01-02", 30], ["2010-01-03", 20], ["2010-01-04", 30], ["2010-01-05", 20]] },
    ],
    __RecursivePropertiesAxis: true,
    Axis: {
        X: {
            //Type: 0, // 0 - Numbers, 1 - DateTime
            Type: 1,
            Labels: 0, // 0 - Automatic
            Range: null, // [null, null]  Fixed min/max, null/undefined for automatic, values outside this range will be filtered
            LabelFormat: null,
            LabelFormatEdge: null,
            Title: "",
            Location: 2, // Bottom  ( Top,Right,Bottom,Left,Hidden X,Hidden Y,Size,Color)
        },
        Y1: {
            Type: 0, // 0 - Numbers, 1 - DateTime (Mapped on epoch), 2 - DateTime (Mapped on labels), 3 - Labels
            Labels: 0, // 0 - Automatic
            Range: null, // [null, null]  Fixed min/max, null/undefined for automatic, values outside this range will be filtered
            Title: null,
            ColorLine: "#1d1d1d",
            ColorSteps: "#999",
            ColorMinorSteps: "#CCC",
            ColorLabels: "#999",
            ColorTitle: "#999",
            FontTitle: "12pt Arial",
            Location: 3, // Left      
            Reverse: true,
            Title: ""
        },
        Size: {
            RangeResult: null, // [10, 25],
            Location: 8 
        },
        Color: {
            RangeResult: null, //["#CCC", "#F00"],
            Location: 7
        }
    },
    AxisPadding: 5,    
    LabelSpacing: 60,
    LegendLocation: 2,
    FontLegend: "10pt Arial",
    ColorLegend: "#333",
    TimeZone: "UTC",
    ShadeSize: 0.1,
    RoundCorners: [5, 5, 5, 5],
    Scale: 2,
    MinChartPadding: 35,
    EnableNavigator: false,
    Navigate: function (minValue, maxValue, final) {
        
    },
    NavigatorLineWidth: 1,
    ColorNavigatorActive: "#999",
    ColorNavigatorInactive: "#EEE",
    ColorNavigatorLine: "#333",
    ColorNavigatorOutside: "rgba(0,0,0,0.3)",
    LegendTemplate: {
        _: TK.Draw.Group,
        Series: null,
        Chart: null,
        Init: function () {
            this.Add({
                _: TK.Draw.Rect,
                X: 0, Y: 0, W: 14, H: 14,
                Fill: this.Series.Color,
                ShadePosition: 2,
                ShadeSize: 3,
                RoundCorners: [3, 3, 3, 3],
                Anchor: TK.Draw.AnchorLeft | TK.Draw.AnchorTop,
            });
            this.Add({
                _: TK.Draw.Text,
                X: 20, Y: 0,
                Fill: this.Chart.ColorLegend,
                Font: this.Chart.FontLegend,
                Text: this.Series.Title,
                Anchor: TK.Draw.AnchorLeft | TK.Draw.AnchorTop,
            });
        },
        GetWidth: function () {
            return TK.Draw.Text.MeasureWidth(this.Series.Title, this.Chart.FontLegend) + 40;
        }
    },

    FormatDate: function (timeStamp, format) {
        var disableAutoSmaller = false;
        if (format.substr(0, 1) == "!") {
            disableAutoSmaller = true;
            format = format.substr(1);
        }
        var date = new Date(timeStamp);
        var p = function (d) { return (d < 10 ? "0" + d : d.toString()); };
        if (this.TimeZone == "UTC") {
            format = format.replace("YYYY", date.getUTCFullYear()).replace("MM", date.getUTCMonth() + 1).replace("DD", date.getUTCDate()).replace("HH", p(date.getUTCHours())).replace("mm", p(date.getUTCMinutes())).replace("ss", p(date.getUTCSeconds()));
        } else {
            if (this.TimeZone != "Local" && window.moment && window.moment.tz) {
                format = moment(timeStamp).tz(this.TimeZone).format(format);
            } else {
                format = format.replace("YYYY", date.getFullYear()).replace("MM", date.getMonth() + 1).replace("DD", date.getDate()).replace("HH", p(date.getHours())).replace("mm", p(date.getMinutes())).replace("ss", p(date.getSeconds()));
            }
        }
        return disableAutoSmaller ? format : format.replace("00:00:00", "").replace(" 00:00", "").replace(/:00$/, "");
    }, 
    Init: function () {
        this.Refresh();
    },
    Refresh: function () {
        if (!this.Elements.Canvas) {
            this.Add({
                _: TK.Draw,
                Scale: this.Scale,
                Width: this.Width,
                Height: this.Height
            }, "Canvas");
        } else {
            this.Elements.Canvas.Clear();
            this.Elements.Canvas.Width = this.Width;
            this.Elements.Canvas.Height = this.Height;
            this.Elements.Canvas.Scale = this.Scale;
            this.Elements.Canvas.Init();
        }
        
        this.RefreshAxises();
        this.RefreshData();
        if (this.EnableNavigator) {
            this.AddNavigator();
        } else {
            delete this.AxisesDetected;
        }
        //console.log(this.AxisesDetected);
        //delete this.AxisesDetected;
        this.Elements.Canvas.Refresh();
    },
    
    AddNavigator: function (from, till) { // Add or set navigator points       
        var obj = this;
        var d = this.AxisesDetected["X"];

        var minPX = d.Position[0];
        var maxPX = d.Position[0] + d.Position[2];
        var heightPX = d.Position[1];
        if (heightPX == 0)
            heightPX = this.Height;

        var fromPX = minPX;
        var tillPX = maxPX;
        if (from !== undefined && from !== null)
            fromPX = d.ValueToPX(from);
        if (till !== undefined && till !== null)
            tillPX = d.ValueToPX(till);
        var cObj = this.Elements.Canvas.Elements;
        if (cObj.NavigatorMaxBlock) {
            // Already added, just update
            cObj.NavigatorMinBlock.X = fromPX;
            cObj.NavigatorMaxBlock.X = tillPX;
            cObj.NavigatorMinLine.X = fromPX;
            cObj.NavigatorMinOutside.W = fromPX - minPX;
            cObj.NavigatorMaxLine.X = tillPX;
            cObj.NavigatorMaxOutside.X = tillPX;
            cObj.NavigatorMaxOutside.W = maxPX - tillPX;
            this.Elements.Canvas.Refresh();
            return;
        }
        

        var outsideConfig = {
            _: TK.Draw.Rect,
            Fill: this.ColorNavigatorOutside,
            X: 0, Y: 0, W: 0, H: heightPX,
            Anchor: TK.Draw.AnchorLeft | TK.Draw.AnchorTop,
        };

        var lineConfig = {
            _: TK.Draw.Line,
            Stroke: this.ColorNavigatorLine,
            LineWidth: this.NavigatorLineWidth,
            X: 0, Y: 0, W: 1, H: heightPX,
            Anchor: TK.Draw.AnchorCenter | TK.Draw.AnchorTop,
        };
        var blockConfig = {
            _: TK.Draw.Rect,
            X: 0, Y: (heightPX / 2) - Math.round(heightPX * 0.15), W: 10, H: Math.round(heightPX * 0.3), Fill: this.ColorNavigatorInactive, Stroke: this.ColorNavigatorLine, LineWidth: this.NavigatorLineWidth,
            Anchor: TK.Draw.AnchorRight | TK.Draw.AnchorTop,
            MouseDown: function (x, y) {
                this.Fill = obj.ColorNavigatorActive;
                var offsetX = this.X - x;
                
                this.MouseMove = function (x2, y2) {
                    this.X = x2 + offsetX;
                    if (this.X < minPX)
                        this.X = minPX;
                    if (this.X > maxPX)
                        this.X = maxPX;

                    if (this.LeftSide && this.X > cObj.NavigatorMaxBlock.X) {
                        this.X = cObj.NavigatorMaxBlock.X;
                    } else if (!this.LeftSide && this.X < cObj.NavigatorMinBlock.X) {
                        this.X = cObj.NavigatorMinBlock.X;
                    }
                    //this.Y = y2 + offsetY;
                    if (this.LeftSide) {
                        cObj.NavigatorMinLine.X = this.X;
                        cObj.NavigatorMinOutside.W = this.X - minPX;
                    } else {
                        cObj.NavigatorMaxLine.X = this.X;
                        cObj.NavigatorMaxOutside.X = this.X;
                        cObj.NavigatorMaxOutside.W = maxPX - this.X;
                        
                    }
                    cObj.NavigatorCenterBlock.W = cObj.NavigatorMaxLine.X - cObj.NavigatorMinLine.X;
                    cObj.NavigatorCenterBlock.X = cObj.NavigatorMinLine.X;

                    if (obj.Navigate)
                        obj.Navigate(cObj.NavigatorMinBlock.GetPositionAsValue(), cObj.NavigatorMaxBlock.GetPositionAsValue(), false);
                    return true;
                };
            },
            MouseUp: function (x, y) {
                this.Fill = obj.ColorNavigatorInactive;
                this.MouseMove = null;
                
                if (obj.Navigate)
                    obj.Navigate(cObj.NavigatorMinBlock.GetPositionAsValue(), cObj.NavigatorMaxBlock.GetPositionAsValue(), true);
            },
            GetPositionAsValue: function () { // Convert X value to actual value
                var r = (this.X - minPX) / (maxPX - minPX);
                if (this.X - 3 < minPX) // If its near start end, pick the start value
                    r = 0;
                if (this.X + 3 > maxPX) // If its near the end, pick the end value
                    r = 1;
                return (r * (d.ScaleMax - d.ScaleMin)) + d.ScaleMin;                
            }
        };

        this.Elements.Canvas.Add({ _: outsideConfig, X: minPX, W: fromPX - minPX }, "NavigatorMinOutside");
        this.Elements.Canvas.Add({ _: outsideConfig, X: tillPX, W: maxPX - tillPX }, "NavigatorMaxOutside");
        this.Elements.Canvas.Add({ _: lineConfig, X: fromPX }, "NavigatorMinLine");
        this.Elements.Canvas.Add({ _: lineConfig, X: tillPX }, "NavigatorMaxLine");
        var minBlock = this.Elements.Canvas.Add({ _: blockConfig, X: fromPX, LeftSide: true }, "NavigatorMinBlock");
        var maxBlock = this.Elements.Canvas.Add({ _: blockConfig, Anchor: TK.Draw.AnchorLeft | TK.Draw.AnchorTop, X: tillPX, LeftSide: false }, "NavigatorMaxBlock");
        this.Elements.Canvas.Add({
            _: TK.Draw.Rect,
            X: fromPX,
            Y: 0,
            W: (tillPX - fromPX),
            H: heightPX,
            Fill: "rgba(0,0,0,0)",
            MouseDown: function (x, y) {
                minBlock.MouseDown(x, y);
                maxBlock.MouseDown(x, y);
                return true;
            },
            MouseMove: function (x, y) {
                if (minBlock.MouseMove)
                    minBlock.MouseMove(x, y);
                if (maxBlock.MouseMove)
                    maxBlock.MouseMove(x, y);
                return true;
            },
            MouseUp: function (x, y) {
                minBlock.MouseUp(x, y);
                maxBlock.MouseUp(x, y);
            }
        }, "NavigatorCenterBlock");
    },
    RefreshAxises: function () {
        var defaultColorIndex = 0;
        // Analyse data so we know what Axises we have to generate
        var detected = {};
        var stackGroupData = {};
        for (var i = 0; i < this.Series.length; i++) {            
            if (!this.Series[i].Data || this.Series[i].Data.length == 0 || !this.Series[i].Axis)
                continue;
            if (!this.Series[i].Color)
                this.Series[i].Color = this.DefaultColors[defaultColorIndex++];
            
            var sizePerValue = null;
            if ((this.Series[i].Style & 4) > 0)
                sizePerValue = 8;
            else if ((this.Series[i].Style & 2) == 0)
                sizePerValue = 1;

            var axisesUsed = this.Series[i].Axis.split(',');
            var axises = [];
            
            for (var j = 0; j < axisesUsed.length; j++) {
                var axisName = axisesUsed[j];

                if (!detected[axisName]) {
                    detected[axisName] = {
                        Min: this.Axis[axisName] && this.Axis[axisName].Range ? this.Axis[axisName].Range[0] : null,
                        Max: this.Axis[axisName] && this.Axis[axisName].Range ? this.Axis[axisName].Range[1] : null,
                        RangeResult: this.Axis[axisName] && this.Axis[axisName].RangeResult ? this.Axis[axisName].RangeResult : null,
                        Location: this.Axis[axisName] && this.Axis[axisName].Location !== undefined ? this.Axis[axisName].Location : axisName == "X" ? 2 : axisName == "Y1" ? 3 : 1,
                        Type: this.Axis[axisName] ? this.Axis[axisName].Type : 0,
                        Reverse: this.Axis[axisName] && this.Axis[axisName].Reverse !== undefined ? this.Axis[axisName].Reverse : axisName == "X" || axisName.length > 2 ? false : true,
                        Size: this.Axis[axisName] && this.Axis[axisName].Size ? this.Axis[axisName].Size : sizePerValue,
                        Color: this.Axis[axisName] && this.Axis[axisName].Color ? this.Axis[axisName].Color : "#999",
                        ColorLine: this.Axis[axisName] && this.Axis[axisName].ColorLine ? this.Axis[axisName].ColorLine : "#333",
                        ColorSteps: this.Axis[axisName] && this.Axis[axisName].ColorSteps ? this.Axis[axisName].ColorSteps : "#333",
                        ColorMinorSteps: this.Axis[axisName] && this.Axis[axisName].ColorMinorSteps ? this.Axis[axisName].ColorMinorSteps : "#999",
                        ColorLabels: this.Axis[axisName] && this.Axis[axisName].ColorLabels ? this.Axis[axisName].ColorLabels : "#999",
                        FontLabels: this.Axis[axisName] && this.Axis[axisName].FontLabels ? this.Axis[axisName].FontLabels : "9pt Arial",
                        ColorTitle: this.Axis[axisName] && this.Axis[axisName].ColorTitle ? this.Axis[axisName].ColorTitle : "#999",
                        FontTitle: this.Axis[axisName] && this.Axis[axisName].FontTitle ? this.Axis[axisName].FontTitle : "12pt Arial",
                        Title: this.Axis[axisName] && this.Axis[axisName].Title ? this.Axis[axisName].Title : "",
                        Labels: this.Axis[axisName] && this.Axis[axisName].Labels ? this.Axis[axisName].Labels : 0,
                        LabelFormat: this.Axis[axisName] && this.Axis[axisName].LabelFormat ? this.Axis[axisName].LabelFormat : "dd-MM-yyyy",
                        LabelFormatEdge: this.Axis[axisName] && this.Axis[axisName].LabelFormatEdge ? this.Axis[axisName].LabelFormatEdge : "dd-MM-yyyy",
                        ValueCount: this.Series[i].Data.length,
                        SizeBetweenValues: null,
                        Series: []
                    };
                }
                axises.push(detected[axisName]);
                detected[axisName].Series.push(i);
            }

            var primaryAxis = null;
            var secondaryAxis = null;
            if (this.Series[i].StackGroup) {
                if (!stackGroupData[this.Series[i].StackGroup])
                    stackGroupData[this.Series[i].StackGroup] = {};
                var sg = stackGroupData[this.Series[i].StackGroup];
            }

            // Find our primary axis and secondary axis
            for (var n = 0; n < axises.length; n++) {
                if (axises[n].Location >= 0 || axises[n].Location < 6) {
                    if (primaryAxis === null) {
                        primaryAxis = n;
                    } else if (secondaryAxis === null) {
                        secondaryAxis = n;
                    }
                }
            }

            if (this.Series[i].StackGroup) {
                // Merge with existing stackGroup
                this.Series[i].Offsets = [];

                for (var n = 0; n < this.Series[i].Data.length; n++) {
                    var item = this.Series[i].Data[n];
                    if (sg[item[primaryAxis]] === undefined) {
                        this.Series[i].Offsets.push(0);
                        sg[item[primaryAxis]] = item[secondaryAxis];
                    } else {
                        this.Series[i].Offsets.push(sg[item[primaryAxis]]);
                        sg[item[primaryAxis]] += item[secondaryAxis];
                    }
                }
            }

            for (var j = 0; j < axises.length; j++) {            
                var d = axises[j];

                var first = this.Series[i].Data[0][j];
                var isDate = first.toLowerCase && d.Location != 7 ? true : false;
                if (d.Location < 6 && first.toLowerCase && (d.Type === undefined || d.Type === null)) {
                    d.Type = 1;
                }
                if (d.Type == 3) { // Labels
                    if (!d.LabelMapping) {
                        d.LabelMapping = {};
                        d.CustomSteps = [];
                    }
                    d.Min = 0;
                    
                    for (var n = 0; n < this.Series[i].Data.length; n++) {
                        if (d.LabelMapping[this.Series[i].Data[n][j]] !== undefined)
                            continue;
                        d.LabelMapping[this.Series[i].Data[n][j]] = d.CustomSteps.length;
                        d.CustomSteps.push({ Text: this.Series[i].Data[n][j], Value: d.CustomSteps.length });
                        
                    }
                    d.Max = d.CustomSteps.length - 1;
                    continue;
                }
                
                for (var n = 0; n < this.Series[i].Data.length; n++) {
                    var value = isDate ? new Date(this.Series[i].Data[n][j]).getTime() : this.Series[i].Data[n][j];
                    if (value == null || isNaN(value))
                        continue;

                    if (j == secondaryAxis && this.Series[i].Offsets) {
                        value += this.Series[i].Offsets[n];

                    } else if (j == primaryAxis && n > 0) {
                        var difference = (this.Series[i].Data[n][j].toLowerCase) ? new Date(this.Series[i].Data[n][j]).getTime() - new Date(this.Series[i].Data[n - 1][j]).getTime() : this.Series[i].Data[n][j] - this.Series[i].Data[n - 1][j];
                        if (d.SizeBetweenValues === null || d.SizeBetweenValues > difference)
                            d.SizeBetweenValues = difference;
                    }                    
                    
                    if (d.Min === null || d.Min > value)
                        d.Min = value;
                    if (d.Max === null || d.Max < value)
                        d.Max = value;
                }
                
                if (d.Location >= 6 && !d.RangeResult) {
                    d.RangeResult = [d.Min, d.Max];
                }
            }            
        }

        // Calculated required widths/heights
        var offsets = [0, 0, 0, 0];  // top, right, bottom, left
        for (var axisName in detected) {
            var d = detected[axisName];

            if (d.Min == d.Max) {
                if (d.Max > 0)
                    d.Min = 0;
                else if (d.Min < 0)
                    d.Max = 0;
                else if (d.Min == 0)
                    d.Max += 1;
                else {
                    d.Min -= 1;
                    d.Max += 1;
                }
            }

            d.Position = [0, 0, 0, 0];  // left, top, width, height
            
            if (d.Location == 0 || d.Location == 2) { // Top, Bottom
                var reqSize = 35 + (this.LegendLocation % 2 == d.Location % 2 ? 25 : 0);
                d.Position[3] = reqSize;
                d.Position[1] = (d.Location == 0 ? 0 : this.Height - reqSize);
            } else if (d.Location == 1 || d.Location == 3) { // Right, Left
                var reqSize = 75 + (this.LegendLocation % 2 == d.Location % 2 ? 100 : 0);
                d.Position[2] = reqSize;
                d.Position[0] = (d.Location == 3 ? 0 : this.Width - reqSize);
            }
            offsets[d.Location] += reqSize;
        }        
        
        for (var i = 0; i < 4; i++)
            offsets[i] = offsets[i] == 0 ? this.MinChartPadding : offsets[i] + this.AxisPadding; // Generic axis padding

        for (var axisName in detected) {
            var d = detected[axisName];
            if (d.Location == 0 || d.Location == 2 || d.Location == 4) { // Top/Bottom, use max width minus any offsets claimed on the left/right
                d.Position[2] = this.Width - (offsets[1] + offsets[3]);
                d.Position[0] = offsets[3];

                if (!d.Size) {         
                    var pxPerValue = d.Position[2] / (d.Max - d.Min);
                    if (d.SizeBetweenValues && !isNaN(d.SizeBetweenValues)) {
                        d.Size = pxPerValue * d.SizeBetweenValues * 0.7;
                    } else if (d.CustomSteps) {
                        d.Size = (d.Position[2] / d.CustomSteps.length) * 0.7;
                    }

                    if (d.Size < 1)
                        d.Size = 1;
                    d.Position[0] += Math.ceil(d.Size / 1.2);
                    d.Position[2] -= Math.ceil(d.Size / 1.2) * 2;
                }
            } else if (d.Location == 1 || d.Location == 3 || d.Location == 5) { // Right/Left
                d.Position[3] = this.Height - (offsets[0] + offsets[2]);
                d.Position[1] = offsets[0];

                if (!d.Size) {
                    var pxPerValue = d.Position[3] / (d.Max - d.Min);
                    if (d.SizeBetweenValues && !isNaN(d.SizeBetweenValues)) {
                        d.Size = pxPerValue * d.SizeBetweenValues * 0.7;
                    } else if (d.CustomSteps) {
                        d.Size = (d.Position[3] / d.CustomSteps.length) * 0.7;
                    }

                    if (d.Size < 1)
                        d.Size = 1;
                    d.Position[1] += Math.ceil(d.Size / 1.2);
                    d.Position[3] -= Math.ceil(d.Size / 1.2) * 2;
                }
            } else if (d.Location >= 6) {
                continue;
            }           
            // Find out the optimal label count/step
            var stepCount = Math.floor(d.Position[(d.Location % 2) == 0 ? 2 : 3] / this.LabelSpacing); // Optimal(max) label count
            if (stepCount < 2)
                stepCount = 2;

            if (d.Type == 1 || d.Type == 2) { // DateTime, mapped on time || DateTime, mapped on labels
                // Date time                
                var labelFormat = d.LabelFormat;
                var labelFormatEdge = d.LabelFormatEdge;

                var timeDifference = (d.Max - d.Min) / 1000;
                if (d.Labels == 0) { // Automatic, find out what labels to use based on the time difference
                    if (timeDifference > 60 * 60 * 24 * 365) {
                        d.Labels = 1; // Years
                        labelFormatEdge = "DD-MM-YYYY";
                        labelFormat = "YYYY";
                    } else if (timeDifference > 60 * 60 * 24 * 35) {
                        d.Labels = 2; // Months
                        labelFormatEdge = "DD-MM-YYYY";
                        labelFormat = "DD-MM-YYYY";
                    } else if (timeDifference > 60 * 60 * 24 * 2) {
                        d.Labels = 4; // Days
                        labelFormatEdge = "DD-MM-YYYY HH:mm";
                        labelFormat = "DD";
                    } else if (timeDifference > 60 * 60 * 5) {
                        d.Labels = 8; // Hours
                        labelFormatEdge = "DD-MM-YYYY HH:mm";
                        labelFormat = "HH";
                    } else if (timeDifference > 60 * 2) {
                        d.Labels = 16; // Minutes
                        labelFormatEdge = "DD-MM-YYYY HH:mm:ss";
                        labelFormat = "HH:mm";
                    } else {
                        d.Labels = 32; // Seconds
                        labelFormatEdge = "DD-MM-YYYY HH:mm:ss";
                        labelFormat = "mm:ss";
                    }
                }

                d.CustomSteps = [];
                d.LabelMapping = {};

                d.ScaleMin = d.Min;
                var cur = d.Min;

                d.CustomSteps.push({ Text: this.FormatDate(d.Min, labelFormatEdge), Value: d.Min });



                while (cur < d.Max) {              
                    // Note: Make sure the labels will fall at exact day/month/year changes
                    if (d.Labels == 32) { // Seconds
                        cur += 1 * 1000;
                        cur = cur - (cur % 1000);
                    } else if (d.Labels == 16) { // Minutes
                        cur += 60 * 1000;
                        cur = cur - (cur % (60 * 1000)); // Round down
                    } else if (d.Labels == 8) { // Hours
                        cur += 60 * 60 * 1000;
                        cur = cur - (cur % (60 * 60 * 1000)); // Round down
                    } else if (d.Labels == 4) { // Days
                        var tmp = new Date(cur);
                        if (this.TimeZone == "UTC") {
                            tmp.setUTCDate(tmp.getUTCDate() + 1);
                            tmp.setUTCHours(0);
                            tmp.setUTCMinutes(0);
                            tmp.setUTCSeconds(0);
                        } else {
                            tmp.setDate(tmp.getDate() + 1);
                            tmp.setHours(0);
                            tmp.setMinutes(0);
                            tmp.setSeconds(0);
                        }
                        cur = tmp.getTime();
                    } else if (d.Labels == 2) { // Months
                        var tmp = new Date(cur);
                        if (this.TimeZone == "UTC") {
                            tmp.setUTCMonth(tmp.getUTCMonth() + 1);
                            tmp.setUTCDate(1);
                            tmp.setUTCHours(0);
                            tmp.setUTCMinutes(0);
                            tmp.setUTCSeconds(0);
                        } else {
                            tmp.setMonth(tmp.getMonth() + 1);
                            tmp.setDate(1);
                            tmp.setHours(0);
                            tmp.setMinutes(0);
                            tmp.setSeconds(0);
                        }
                        cur = tmp.getTime();
                    } else if (d.Labels == 1) { // Years
                        var tmp = new Date(cur);
                        if (this.TimeZone == "UTC") {
                            tmp.setUTCFullYear(tmp.getUTCFullYear() + 1);
                            tmp.setUTCMonth(0);
                            tmp.setUTCDate(1);
                            tmp.setUTCHours(0);
                            tmp.setUTCMinutes(0);
                            tmp.setUTCSeconds(0);
                        } else {                                                        
                            tmp.setFullYear(tmp.getFullYear() + 1);
                            tmp.setMonth(0);
                            tmp.setDate(1);
                            tmp.setHours(0);
                            tmp.setMinutes(0);
                            tmp.setSeconds(0);
                        }                        
                        cur = tmp.getTime();
                    } else {
                        cur = d.Max;
                    }                    
                    

                    d.LabelMapping[cur] = d.CustomSteps.length;
                    d.CustomSteps.push({ Text: this.FormatDate(cur >= d.Max ? d.Max : cur, (cur >= d.Max ? labelFormatEdge : labelFormat)), Value: cur >= d.Max ? d.Max : cur });
                    d.ScaleMax = cur >= d.Max ? d.Max : cur;                    
                }
                

                if (d.CustomSteps.length > stepCount) {
                    // Reduce amount of labels
                    // TODO: Try to make more logical/nicer steps
                    var stepAmount = Math.ceil(d.CustomSteps.length / stepCount);                                        
                    for (var i = 0; i < d.CustomSteps.length - 1; i += 1) {
                        if (i % stepAmount > 0 || i + stepAmount*0.8 > d.CustomSteps.length) {
                            d.CustomSteps[i].Text = "";
                        }
                    }                    
                }
            } 


            if (!d.CustomSteps || d.CustomSteps.length == 0) {
                // https://stackoverflow.com/questions/237220/tickmark-algorithm-for-a-graph-axis 
                var epsilon = (d.Max - d.Min) / 1e6;
                var max = d.Max/* + epsilon*/;
                var min = d.Min/* - epsilon*/;
                
                var range = max - min;
                var roughStep = range / (stepCount - 1);
                var goodNormalizedSteps = [1, 1.5, 2, 2.5, 5, 7.5, 10];

                Math.log10 = Math.log10 || function (x) {
                    return Math.log(x) * Math.LOG10E;
                };

                var stepPower = Math.pow(10, -Math.floor(Math.log10(Math.abs(roughStep))));
                var normalizedStep = roughStep * stepPower;
                var goodNormalizedStep = goodNormalizedSteps.First(function (n) { return n >= normalizedStep; });

                d.Step = goodNormalizedStep / stepPower;
                
                if (!d.Reverse) {
                    d.ScaleMax = Math.ceil(max / d.Step) * d.Step;
                    if (d.ScaleMax + d.Step <= d.Max) d.ScaleMax = d.Max;
                    d.ScaleMin = Math.floor(min / d.Step) * d.Step;
                    if (d.ScaleMin - d.Step >= d.Min) d.ScaleMin = d.Min;
                    d.StepCount = ((d.ScaleMax - d.ScaleMin) / d.Step) + 1;
                } else {
                    d.ScaleMax = Math.floor(min / d.Step) * d.Step;
                    if (d.ScaleMax + d.Step <= d.Min) d.ScaleMax = d.Min;
                    d.ScaleMin = Math.ceil(max / d.Step) * d.Step;
                    if (d.ScaleMin - d.Step >= d.Max) d.ScaleMin = d.Max;
                    d.StepCount = ((d.ScaleMin - d.ScaleMax) / d.Step) + 1;
                    d.Step = 0 - d.Step;
                }
                
                
            } else {
                d.StepCount = d.CustomSteps.length;
                if (d.ScaleMin === undefined) {
                    d.ScaleMin = d.Min;
                    d.ScaleMax = d.Max;
                }
                if (d.Reverse)
                    d.CustomSteps = d.CustomSteps.reverse();
            }            

            d.ValueToPX = function (value, excludeOwnPosition) {
                if (value && value.toLowerCase) {
                    if (this.LabelMapping[value] !== undefined) {
                        value = this.LabelMapping[value];
                    } else if (this.Type == 1 || this.Type == 2) {
                        value = new Date(value).getTime();
                    }
                }
                
                var sizePX = this.Position[(this.Location % 2) == 0 ? 2 : 3];
                if (this.Reverse) { // Reverse
                    var difference = (this.ScaleMin - this.ScaleMax);
                    return Math.round(sizePX - (((value - this.ScaleMax) / difference) * sizePX)
                        + (excludeOwnPosition ? 0 : this.Position[(this.Location % 2) == 0 ? 0 : 1]));    
                }
                return Math.round((((value - this.ScaleMin) / (this.ScaleMax - this.ScaleMin)) * sizePX)
                    + (excludeOwnPosition ? 0 : this.Position[(this.Location % 2) == 0 ? 0 : 1]));
            };
            
            // Draw axis and legend
            var stepTexts = [];
            if (d.Location == 2 || d.Location == 0) { // Bottom, Top
                var y = d.Location == 2 ? d.Position[1] : d.Position[3] + d.Position[1];

                if (d.Title) {
                    this.Elements.Canvas.Add({
                        _: TK.Draw.Text, X: d.Position[2] + d.Position[0], Y: (d.Location == 2 ? y + 30 : y - 30),
                        Anchor: TK.Draw.AnchorRight | (d.Location == 2 ? TK.Draw.AnchorTop : TK.Draw.AnchorBottom),
                        Fill: d.ColorTitle,
                        Font: d.FontTitle,
                        Text: d.Title 
                    });
                }
                
                this.Elements.Canvas.Add({
                    _: TK.Draw.Line, X: d.Position[0], Y: y, W: d.Position[2], H: 0, Stroke: d.ColorLine
                });
                
                for (var i = 0; i < d.StepCount; i++) {
                    var posX = (d.Position[0] + (d.Position[2] / (d.StepCount - 1)) * i);
                    if (d.CustomSteps && d.CustomSteps[i] && d.CustomSteps[i].Value !== null && d.CustomSteps[i].Value !== undefined)
                        posX = d.ValueToPX(d.CustomSteps[i].Value);

                    if (d.CustomSteps && d.CustomSteps[i] && d.CustomSteps[i].Text == "") {
                        this.Elements.Canvas.Add({
                            _: TK.Draw.Line, X: posX, Y: (d.Location == 2 ? y : y - 5), W: 0, H: 5, Stroke: d.ColorMinorSteps
                        });
                        continue;
                    }
                    this.Elements.Canvas.Add({
                        _: TK.Draw.Line, X: posX, Y: (d.Location == 2 ? y : y - 10), W: 0, H: 10, Stroke: d.ColorSteps
                    });
                    stepTexts[i] = this.Elements.Canvas.Add({
                        _: TK.Draw.Text,
                        X: posX, Y: (d.Location == 2 ? y + 15 : y - 15),
                        Fill: d.ColorLabels,
                        Font: d.FontLabels,
                        Text: d.CustomSteps && d.CustomSteps[i] ? d.CustomSteps[i].Text : Math.round((d.ScaleMin + (d.Step * i)) * 10000)/ 10000,                        
                        Anchor: TK.Draw.AnchorCenter | (d.Location == 2 ? TK.Draw.AnchorTop : TK.Draw.AnchorBottom),
                    });
                    
                    if (i + 1 == d.StepCount) {
                        var width = stepTexts[i].MeasureWidth();
                        // Move label if text goes outside the canvas
                        if (posX + width / 2 > (this.Width - 5))
                            stepTexts[i].X = this.Width - ((width / 2) + 5);

                        // Hide overlapping labels
                        for (var n = i - 1; n >= 0; n--) {
                            if (!stepTexts[n])
                                continue;
                            var curWidth = stepTexts[n].MeasureWidth();
                            if (stepTexts[n].X + (curWidth / 2) + 10 < stepTexts[i].X - (width / 2))
                                break;
                            stepTexts[n].Text = "";
                        }

                        if (stepTexts[0] && stepTexts[0].Text) {
                            width = stepTexts[0].MeasureWidth();
                            for (var n = 1; n < i - 1; n++) {
                                if (!stepTexts[n])
                                    continue;
                                var curWidth = stepTexts[n].MeasureWidth();
                                if (stepTexts[n].X - ((curWidth / 2) + 10) > stepTexts[0].X + (width / 2))
                                    break;
                                stepTexts[n].Text = "";
                            }
                        }
                    }
                }
                if (this.LegendLocation == 2 || this.LegendLocation == 0) {
                    var curPos = 25;
                    if (this.LegendLocation == 0)
                        y = -25;

                    for (var i = 0; i < this.Series.length; i++) {
                        if (!this.Series[i].Title || this.Series[i].Title == "" || this.Series[i].HiddenInLegend)
                            continue;

                        var legendBlock = this.Elements.Canvas.Add({
                            _: this.LegendTemplate,
                            X: curPos,
                            Y: y + 35,
                            Series: this.Series[i],
                            Chart: this
                        });
                        curPos += legendBlock.GetWidth();
                        
                    }
                }
            } else if (d.Location == 1 || d.Location == 3) { // Right, Left
                var x = d.Location == 1 ? d.Position[0] : d.Position[2] + d.Position[0];

                if (d.Title) {
                    this.Elements.Canvas.Add({
                        _: TK.Draw.Text, X: d.Location == 3 ? 5 : this.Width - 5, Y: d.Position[1] + (d.Position[3] / 2),
                        Anchor: TK.Draw.AnchorCenter | TK.Draw.AnchorTop,
                        Fill: d.ColorTitle,
                        Font: d.FontTitle,
                        Text: d.Title,
                        Rotate: d.Location == 3 ? -90 : 90
                    });
                }

                this.Elements.Canvas.Add({
                    _: TK.Draw.Line, X: x, Y: d.Position[1], W: 0, H: d.Position[3], Stroke: d.ColorLine
                });
                
                for (var i = 0; i < d.StepCount; i++) {           
                    var posY = (d.Position[1] + (d.Position[3] / (d.StepCount - 1)) * i);
                    if (d.CustomSteps && d.CustomSteps[i] && d.CustomSteps[i].Value !== null && d.CustomSteps[i].Value !== undefined)
                        posY = d.ValueToPX(d.CustomSteps[i].Value);

                    if (d.CustomSteps && d.CustomSteps[i] && d.CustomSteps[i].Text == "") {
                        this.Elements.Canvas.Add({
                            _: TK.Draw.Line, X: (d.Location == 1 ? x : x - 5), Y: posY, W: 5, H: 0, Stroke: d.ColorMinorSteps
                        });
                        continue;
                    }
                    this.Elements.Canvas.Add({
                        _: TK.Draw.Line, X: (d.Location == 1 ? x : x - 10), Y: posY, W: 10, H: 0, Stroke: d.ColorSteps
                    });
                    this.Elements.Canvas.Add({
                        _: TK.Draw.Text,
                        X: (d.Location == 1 ? x + 15 : x - 15), Y: posY,
                        Fill: d.ColorLabels,
                        Font: d.FontLabels,
                        Text: d.CustomSteps && d.CustomSteps[i] ? d.CustomSteps[i].Text : Math.round((d.ScaleMin + (d.Step * i)) * 10000) / 10000,
                        Anchor: (d.Location == 1 ? TK.Draw.AnchorLeft : TK.Draw.AnchorRight) | TK.Draw.AnchorMiddle,
                    });
                }
            }
        }
        this.AxisesDetected = detected;
    },
    RefreshData: function () {
        
        for (var i = 0; i < this.Series.length; i++) {
            var s = this.Series[i];
            if (!s.Data || s.Data.length == 0 || !s.Axis)
                continue;            
            var axisesUsed = s.Axis.split(',');
            var pos = [];
            var firstAxis = null;
            for (var j = 0; j < axisesUsed.length; j++) {
                var axisName = axisesUsed[j];
                
                var d = this.AxisesDetected[axisName];
                if (!d)
                    continue;
                if (!firstAxis)
                    firstAxis = d;

                for (var n = 0; n < s.Data.length; n++) {
                    var value = s.Data[n][j];
                    if (!pos[n])
                        pos[n] = [0, 0, d.Size, s.Color, 0, 15]; // X px center, Y px center, Size Primary, Color, Offset secondary axis,Size Secondary

                    if (d.Location < 6) {
                        var px = d.ValueToPX(value);
                        
                        if (!d.OffsetsPX)
                            d.OffsetsPX = {};
                        
                        if (firstAxis != d) {
                            if (s.Offsets) {
                                pos[n][4] = d.ValueToPX(s.Offsets[n] + d.ScaleMax) - d.ValueToPX(d.ScaleMax);
                            }

                            var key = ((d.Location % 2 == 1) ? pos[n][0] : pos[n][1]);
                            key += "-" + (s.StackGroup ? s.StackGroup : Math.random());
                            var max = firstAxis.Location == 0 || firstAxis.Location == 3 ? ((d.Location % 2 == 0) ? d.Position[0] : d.Position[1]) : ((d.Location % 2 == 1) ? d.Position[3] + d.Position[1] : d.Position[2] + d.Position[0]);
                            if (d.OffsetsPX[key] === undefined)
                                d.OffsetsPX[key] = max;

                            var height = 0;

                            if (firstAxis.Location == 0 || firstAxis.Location == 3) {
                                height = (px + pos[n][4]) - d.OffsetsPX[key];
                                d.OffsetsPX[key] += height;
                            } else {
                                height = d.OffsetsPX[key] - (px + pos[n][4]);
                                d.OffsetsPX[key] -= height;
                            }
                            pos[n][5] = height;
                        }

                        if (d.Location % 2 == 0) {
                            pos[n][0] = px;
                        } else {
                            pos[n][1] = px;
                        }
                    } else if (d.Location == 8) { // Size
                        if (d.Max == d.Min)
                            pos[n][2] = d.RangeResult[1];
                        else 
                            pos[n][2] = (((value - d.Min) / (d.Max - d.Min)) * (d.RangeResult[1] - d.RangeResult[0])) + d.RangeResult[0];
                    } else if (d.Location == 7) { // Color
                        if (value.toLowerCase) {
                            pos[n][3] = value;
                        } else {
                            var colorA = getColor(d.RangeResult[0]), colorB = getColor(d.RangeResult[1]);
                            
                            for (var n2 = 0; n2 < colorA.length; n2++) {
                                if (d.Max == d.Min) {
                                    colorA[n2] = colorB[n2];
                                } else {
                                    colorA[n2] = (((value - d.Min) / (d.Max - d.Min)) * (colorB[n2] - colorA[n2])) + colorA[n2];
                                }
                            }
                            pos[n][3] = "rgba(" + colorA.join(",") + ")";
                        }
                    }
                }
            }               

            var curStackGroups = {};
            var barCount = 0;
            var barIndex = 0;
            for (var j = 0; j < firstAxis.Series.length; j++) {
                var otherSerie = this.Series[firstAxis.Series[j]];
                if ((otherSerie.Style & 2) == 0) { // Check if this serie has bars
                    continue;
                }
                if (otherSerie.StackGroup && curStackGroups[otherSerie.StackGroup] !== undefined) {
                    if (firstAxis.Series[j] == i)
                        barIndex = curStackGroups[otherSerie.StackGroup];                               
                    continue;
                }

                if (otherSerie.StackGroup)
                    curStackGroups[otherSerie.StackGroup] = barCount;     

                if (firstAxis.Series[j] == i)
                    barIndex = barCount;                               
                barCount++;
            }
            
            for (var j = 0; j < pos.length; j++) {
                if ((s.Style & 4) > 0) { // Points
                    this.Elements.Canvas.Add({
                        _: TK.Draw.Circle,
                        X: pos[j][0], Y: pos[j][1] + pos[j][4], W: pos[j][2], H: pos[j][2],
                        Fill: pos[j][3],
                        Anchor: TK.Draw.AnchorCenter | TK.Draw.AnchorMiddle,
                        Click: s.Click,
                        MouseOver: s.MouseOver,
                        MouseOut: s.MouseOut
                    });
                }
                
                if ((s.Style & 2) > 0) { // Bars, We use our first axis as 'base'                     
                    var size = (pos[j][2] / barCount) * 0.8;                    
                    var offset = barIndex * size - (pos[j][2] / 2 - pos[j][2] * 0.1);
                    var barRect = {
                        _: TK.Draw.Rect,
                        Fill: pos[j][3],
                        Click: s.Click,
                        MouseOver: s.MouseOver,
                        MouseOut: s.MouseOut,
                        RoundCorners: this.RoundCorners,
                        ShadeSize: this.ShadeSize ? Math.round(size * this.ShadeSize) : 0
                    };

                    if (firstAxis.Location == 2 || firstAxis.Location == 0) {
                        barRect.X = pos[j][0] + offset;
                        barRect.Y = pos[j][1] + pos[j][4];
                        barRect.W = size;
                        barRect.H = pos[j][5];
                        barRect.ShadePosition = 1;
                        if (firstAxis.Location == 2)
                            barRect.Anchor = TK.Draw.AnchorLeft | TK.Draw.AnchorTop;
                        else
                            barRect.Anchor = TK.Draw.AnchorLeft | TK.Draw.AnchorBottom;
                    } else if (firstAxis.Location == 3 || firstAxis.Location == 1) {
                        barRect.X = (pos[j][0] + pos[j][4]);
                        barRect.Y = pos[j][1] + offset;
                        barRect.W = pos[j][5];
                        barRect.H = size;
                        barRect.ShadePosition = 2;
                        if (firstAxis.Location == 3)
                            barRect.Anchor = TK.Draw.AnchorRight | TK.Draw.AnchorTop;
                        else
                            barRect.Anchor = TK.Draw.AnchorLeft | TK.Draw.AnchorTop;               
                    }
                    this.Elements.Canvas.Add(barRect);
                }
            } 

            if ((s.Style & 1) > 0 || (s.Style & 8) > 0) {
                //console.log(pos);
                var heights = [];
                for (var n = 0; n < pos.length; n++) {
                    pos[n][(firstAxis.Location == 2 || firstAxis.Location == 0) ? 1 : 0] += pos[n][4];
                    if ((s.Style & 8) > 0) {
                        heights.push(pos[n][5]);
                    }
                }
                
                this.Elements.Canvas.Add({
                    _: TK.Draw.LineThroughPoints,
                    X: 0, Y: 0,
                    LineWidth: s.LineWidth,
                    Heights: heights,
                    Fill: s.Fill,
                    Points: pos.Select(function (a) { return [a[0], a[1]] }),
                    Stroke: pos[0][3],
                    Smoothing: s.Smoothing,
                    Anchor: TK.Draw.AnchorLeft | TK.Draw.AnchorTop                    
                });
            }
        }
    }
};

