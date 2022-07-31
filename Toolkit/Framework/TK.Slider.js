"use strict";
window.TK.Slider = {
    TextBefore: "",
    TextAfter: "",
    Min: 0,
    Max: 100,
    Width: 200,
    StepSize: 0, // 0 to disable
    ShowSteps: false,
    Data: 0,
    className: "toolkitSlider",
    readOnly: false,
    disabled: false,

    onchange: function () { },

    Init: function () {
        if (this.DataSettings) {
            var fields = ["TextBefore", "TextAfter", "Min", "Max", "StepSize", "ShowSteps"];
            for (var i = 0; i < fields.length; i++) {
                if (this.DataSettings[fields[i]] !== undefined)
                    this[fields[i]] = this.DataSettings[fields[i]];
            }
        }

        this.Elements.SliderContainer.Elements.Steps.style.display = this.ShowSteps && this.StepSize > 0 ? "" : "none";
        if (this.StepSize > 0) {
            var stepCount = Math.floor((this.Max - this.Min) / this.StepSize) + 1;


            this.Elements.SliderContainer.Elements.Steps.Clear();
            for (var i = 0; i < stepCount; i++) {
                var stepDataValue = this.Min + (this.StepSize * i);
                this.Elements.SliderContainer.Elements.Steps.Add({
                    style: {
                        left: this.DataValueToPX(stepDataValue) + "px"
                    },
                    className: stepDataValue <= this.Data ? "stepActive" : "stepInactive"
                }, "Step" + i);
            }

        } else {
            this.Elements.SliderContainer.Elements.Steps.Clear();
        }

        this.Elements.TextBefore.innerText = this.TextBefore;
        this.Elements.TextBefore.style.display = this.TextBefore ? "" : "none";
        this.Elements.TextAfter.innerText = this.TextAfter;
        this.Elements.TextAfter.style.display = this.TextAfter ? "" : "none";

        this.Elements.SliderContainer.style.width = this.Width + "px";
        var curPx = this.DataValueToPX(this.Data);
        this.Elements.SliderContainer.Elements.Indicator.style.left = curPx + "px";
        this.Elements.SliderContainer.Elements.FillBar.style.width = curPx + "px";

    },
    DataValueToPX: function (dataValue) {
        return Math.round(((dataValue - this.Min) / (this.Max - this.Min)) * this.Width);
    },
    PXToDataValue: function (px, roundStepSize) {
        if (roundStepSize) {

            var tmp = ((px / this.Width) * (this.Max - this.Min));
            tmp += (roundStepSize / 2);
            tmp = (tmp - (tmp % roundStepSize)) + this.Min;
            if (tmp > this.Max)
                tmp = this.Max;
            return tmp;
        }
        return ((px / this.Width) * (this.Max - this.Min)) + this.Min;
    },
    GetValue: function () {
        return this.Data;
    },
    Elements: {
        TextBefore: {},
        SliderContainer: {
            onmousdown: function (ev) {
                ev.preventDefault();
            },
            ontouchstart: function (e) {
                ev.preventDefault();
            },
            
            Elements: {
                Steps: {},
                FillBar: {},
                Indicator: {
                    ontouchstart: function (e) {
                        this.onmousedown(e.touches[0]);
                        e.stopPropagation();
                    },
                    onmousedown: function (e) {
                        var x, y;
                        try { x = e.clientX; y = e.clientY; } catch (errie) { var e2 = window.event; x = e2.clientX; y = e2.clientY; }
                        var startPos = this.Parent.Parent.DataValueToPX(this.Parent.Parent.Data);
                        var obj = this;
                        
                        window.onmousemove = function (e) {
                            var x2, y2;
                            try { x2 = e.clientX; y2 = e.clientY; } catch (errie) { var e2 = window.event; x2 = e2.clientX; y2 = e2.clientY; }

                            var newPos = startPos + (x2 - x);

                            if (newPos < 0)
                                newPos = 0;
                            else if (newPos > obj.Parent.Parent.Width)
                                newPos = obj.Parent.Parent.Width;

                            // Jump to the nearest step and calculate data value based on new pos
                            obj.Parent.Parent.Data = obj.Parent.Parent.PXToDataValue(newPos, obj.Parent.Parent.StepSize);

                            // Redraw elements
                            if (obj.Parent.Parent.onchange)
                                obj.Parent.Parent.onchange();
                            obj.Parent.Parent.Init();
                            
                        };
                        window.onmouseup = function () {
                            window.onmousemove = null;
                            window.onmouseup = null;
                            window.onselectstart = null;
                            window.ontouchmove = null;
                            window.ontouchend = null;
                        };
                        window.ontouchmove = function (e) {
                            if (window.onmousemove)
                                window.onmousemove(e.touches[0]);
                            e.stopPropagation();
                        };
                        window.ontouchend = function (e) {
                            if (window.onmouseup)
                                window.onmouseup();
                            e.stopPropagation();
                        };
                        window.onselectstart = function () { return false; };


                        if (e && e.preventDefault)
                            e.preventDefault();
                        else
                            window.event.returnValue = false;
                    },
                }
            }
        },
        TextAfter: {},
    }
};


if (window.TK.Form) {
    window.TK.Form.DefaultTemplates.slider = {
        _: TK.Slider
    };
}
