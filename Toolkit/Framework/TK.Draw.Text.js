"use strict";
/* Minify Skip */
/* Minify Order(155) */

TK.Draw.Text = {
    DrawType: "Text",
    _: TK.Draw.DrawableObject,
    BlockedText: false, // Static TK.Draw.Text.BlockedText, If set to true only colored rects will be drawed instead of text, useful for testing or visual censoring
    Text: "Text", Font: "30pt Arial",
    Invalidate: function () {
        this.CachedImage = null;
    },
    Draw: function (c) {
        c.beginPath();
        
        //this.W = null;
        //this.H = null;
        
        //this.Text = this.X + ","+this.Y + " * "+ c.Scale;
        //this.Fill = "#F00";
        //this.Stroke = "#333";
        //this.Font = "10pt Arial";
        //this.Anchor = TK.Draw.AnchorLeft | TK.Draw.AnchorMiddle;

        /*this.Transform(c);

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

        this.DrawFS(c); */

        if (!this.W) {
            this.W = this.MeasureWidth(this.Text);
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

        this.Transform(c);
        if (TK.Draw.Text.BlockedText) {
            c.fillRect(this.X, this.Y, this.W, this.H);
        } else {
            if (!this.CachedImage) {
                this.CachedImage = document.createElement("CANVAS");
                this.CachedImage.width = Math.round(this.W * c.Scale);
                this.CachedImage.height = Math.round(this.H * c.Scale);
                this.CachedImage.style.width = Math.round(this.W * c.Scale) + "px";
                this.CachedImage.style.width = Math.round(this.H * c.Scale) + "px";

                var cachedContext = this.CachedImage.getContext("2d");
                cachedContext.imageSmoothingEnabled = false;
                cachedContext.textAlign = "left";
                cachedContext.textBaseline = "top";
                cachedContext.font = this.Font;
                this.DrawFS(cachedContext);
                cachedContext.setTransform(c.Scale, 0, 0, c.Scale, 0, 0);
                if (this.Fill)
                    cachedContext.fillText(this.Text, 0, 0);
                if (this.Stroke)
                    cachedContext.strokeText(this.Text, 0, 0);
            }            
            c.drawImage(this.CachedImage, Math.floor(this.X), Math.floor(this.Y), Math.round(this.W), Math.round(this.H));
        }

        /* Old:

            if (this.Fill)
                c.fillText(this.Text, this.X, this.Y);
            if (this.Stroke)
                c.strokeText(this.Text, this.X, this.Y);
        */
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
        return Math.ceil(height);
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
        return Math.ceil(c.measureText(txt).width + 1);
    }
};
