"use strict";
/* Minify Skip */
/* Minify Order(155) */

TK.Draw.TextScalingNormal = 0; // None
TK.Draw.TextScalingWhiteSpaceBreak = 1; // Continue on next line to make text fit
TK.Draw.TextScalingResize = 2; // Always resize to fit the full frame, while keeping aspect ratio
TK.Draw.TextScalingResizeIfNeeded = 3; // Only resize if the text doesn't fit, while keeping aspect ratio


TK.Draw.Text = {
    DrawType: "Text",
    _: TK.Draw.DrawableObject,
    BlockedText: false, // Static TK.Draw.Text.BlockedText, If set to true only colored rects will be drawed instead of text, useful for testing or visual censoring
    Text: "Text", Font: "30pt Arial",
    Scaling: TK.Draw.TextScalingNormal,
    LineSpacingRatio: 1.1,
    WidthPadding: 2,
    HeightPadding: 2,
    TextAlign: TK.Draw.AnchorCenter | TK.Draw.AnchorMiddle,
    Invalidate: function () {
        this.CachedImage = null;
    },
    Draw: function (c) {
        if (this.Text === null || this.Text === undefined)
            return;
        if (this.Text.substring === undefined)
            this.Text = this.Text.toString();
        c.beginPath();

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
                var text = this.Text;
                var scaleFactor = 1;
                var lineHeight = this.MeasureHeight(this.Text, this.Font);
                if (this.Scaling == TK.Draw.TextScalingWhiteSpaceBreak) {
                    // Try to insert line breaks
                    // TODO: Support text with provided linebreaks
                    var parts = this.Text.split(/ /g);
                    var newText = "";
                    var sentenceLength = 0;
                    for (var i = 0; i < parts.length; i++) {
                        var curText = parts[i] + (i + 1 == parts.length ? "" : " ");
                        var curWidth = Math.ceil(this.MeasureWidth(curText, this.Font)); 
                        if (sentenceLength > 0 && sentenceLength + curWidth >= this.W) {
                            newText += "\n";
                            sentenceLength = curWidth;
                        } else {
                            sentenceLength += curWidth;
                        }
                        newText += curText;
                    }
                    text = newText;
                } else if (this.Scaling == TK.Draw.TextScalingResize || this.Scaling == TK.Draw.TextScalingResizeIfNeeded) {
                    // Calculate factor the font size needs to be changed to make it fill the frame
                    // TODO: Support text with provided linebreaks
                    var widthRatio = this.W / this.MeasureWidth(this.Text, this.Font);
                    var heightRatio = this.H / lineHeight;

                    if (this.Scaling == TK.Draw.TextScalingResize || widthRatio < 1 || heightRatio < 1) {
                        scaleFactor = Math.min(widthRatio, heightRatio);
                        lineHeight *= scaleFactor;
                    }
                }
                lineHeight = Math.ceil(lineHeight); // unscaled

                var cachedContext = this.CachedImage.getContext("2d");
                cachedContext.imageSmoothingEnabled = false;
                cachedContext.textAlign = "left";
                cachedContext.textBaseline = "top";
                cachedContext.font = this.Font;
                this.DrawFS(cachedContext);
                cachedContext.setTransform(c.Scale * scaleFactor, 0, 0, c.Scale * scaleFactor, 0, 0);
                var correctionFactor = 1 / scaleFactor;

                var lines = text.split(/\n/g);
                var curY = 0;
                var totalHeight = lines.length == 0 ? 0 : ((lines.length - 1) * lineHeight * this.LineSpacingRatio) + lineHeight;
                
                if ((this.TextAlign & TK.Draw.AnchorMiddle) > 0) {
                    curY = (this.H / 2) - (totalHeight / 2);
                } else if ((this.TextAlign & TK.Draw.AnchorBottom) > 0) {
                    curY = this.H - totalHeight;
                }
                curY = Math.ceil(curY * correctionFactor);

                for (var i = 0; i < lines.length; i++) {
                    var curX = 0;
                    var lineWidth = this.MeasureWidth(lines[i], this.Font);

                    if (scaleFactor == 1 && (this.TextAlign & TK.Draw.AnchorCenter) > 0)
                        curX = (this.W / 2) - (lineWidth / 2);
                    else if (scaleFactor == 1 && (this.TextAlign & TK.Draw.AnchorRight) > 0)
                        curX = this.W - lineWidth;
                    else if (scaleFactor != 1 && lineWidth * scaleFactor >= this.H && (this.TextAlign & TK.Draw.AnchorCenter) > 0) {
                        // Make sure its centered after scaling
                        curX = ((this.W / 2) - ((lineWidth * scaleFactor) / 2)) * correctionFactor;
                    } else if (scaleFactor != 1 && lineWidth * scaleFactor >= this.H && (this.TextAlign & TK.Draw.AnchorRight) > 0) {
                        // Make sure its centered after scaling
                        curX = (this.W - (lineWidth * scaleFactor)) * correctionFactor;
                    }

                    if (this.Fill)
                        cachedContext.fillText(lines[i], curX, curY);
                    if (this.Stroke) {
                        cachedContext.miterLimit = 3;
                        cachedContext.strokeText(lines[i], curX, curY);
                    }

                    curY += Math.ceil(lineHeight * this.LineSpacingRatio * correctionFactor);
                }
            }            
            c.drawImage(this.CachedImage, Math.floor(this.X), Math.floor(this.Y), Math.round(this.W), Math.round(this.H));
        }
        c.closePath();
    },
    FillWidthHeight: function () {
        this.W = this.MeasureWidth(this.Text, this.Font);
        this.H = this.MeasureHeight(this.Text, this.Font);
    },
    MeasureHeight: function (txt, font) {
        var extra = this.HeightPadding + (this.LineWidth ? this.LineWidth * 2 : 0);
        var m = this.MeasureText(txt, font);
        if (m.actualBoundingBoxDescent !== undefined)
            return Math.ceil(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) + extra;

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
        return Math.ceil(height) + extra;
    },
    MeasureWidth: function (txt, font) {
        var extra = this.WidthPadding + (this.LineWidth ? this.LineWidth * 2 : 0);
        var m = this.MeasureText(txt, font);
        if (m.actualBoundingBoxRight !== undefined)
            return Math.ceil(m.actualBoundingBoxLeft + m.actualBoundingBoxRight) + extra;
        return Math.ceil(m.width) + extra; // fallback
    },
    MeasureText: function (txt, font) {
        if (txt == undefined)
            txt = this.Text;
        if (font == undefined)
            font = this.Font;

        if (!TK.Draw.Text.MeasuringCanvas) {
            TK.Draw.Text.MeasuringCanvas = document.createElement("CANVAS");
            TK.Draw.Text.MeasuringCanvasContext = TK.Draw.Text.MeasuringCanvas.getContext("2d");
        }
        var c = TK.Draw.Text.MeasuringCanvasContext;
        c.textAlign = "left";
        c.textBaseline = "top";
        c.font = font;

        return c.measureText(txt);
    }
};
