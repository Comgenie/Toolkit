"use strict";
/* Minify Skip */
/* Minify Order(155) */

TK.Draw.Image = {
    DrawType: "Image",
    _: TK.Draw.DrawableObject,
    //RoundCorners: [15,15,15,15],
    Img: null,
    Src: null,
    Scaling: 0, // 0 Scretch to fit, 1 Contain, 2 Cover
    ImageAlign: TK.Draw.AnchorCenter | TK.Draw.AnchorMiddle,
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
            var drawX = this.X;
            var drawY = this.Y;
            var drawWidth = this.W;
            var drawHeight = this.H;
            var sourceX = 0;
            var sourceY = 0;
            var sourceWidth = this.Img.width;
            var sourceHeight = this.Img.height;
            if (this.Scaling == 1) {
                // Get the aspect ratios  
                var imgAspectRatio = this.Img.width / this.Img.height;
                var boxAspectRatio = this.W / this.H;

                if (imgAspectRatio > boxAspectRatio) {
                    // Image is wider relative to the box  
                    drawWidth = this.W;
                    drawHeight = this.W / imgAspectRatio;


                    if ((this.ImageAlign & TK.Draw.AnchorMiddle) != 0)
                        drawY = this.Y + (this.H - drawWidth) / 2;
                    else if ((this.ImageAlign & TK.Draw.AnchorBottom) != 0)
                        drawY = this.Y + (this.H - drawWidth);
                } else {
                    // Image is taller (or same aspect ratio) relative to the box  
                    drawHeight = this.H;
                    drawWidth = this.H * imgAspectRatio;

                    if ((this.ImageAlign & TK.Draw.AnchorCenter) != 0)
                        drawX = this.X + (this.W - drawWidth) / 2;
                    else if ((this.ImageAlign & TK.Draw.AnchorRight) != 0)
                        drawX = this.X + (this.W - drawWidth);
                }

            } else if (this.Scaling == 2) {
                // Get the aspect ratios  
                var imgAspectRatio = this.Img.width / this.Img.height;
                var boxAspectRatio = this.W / this.H;

                if (imgAspectRatio > boxAspectRatio) {
                    sourceWidth = (sourceWidth / imgAspectRatio) / 2;

                    if ((this.ImageAlign & TK.Draw.AnchorCenter) != 0)
                        sourceX = (this.Img.width - sourceWidth) / 2;
                    else if ((this.ImageAlign & TK.Draw.AnchorRight) != 0)
                        sourceX = this.Img.width - sourceWidth;
                } else {
                    sourceHeight = (sourceHeight * imgAspectRatio) / 2;

                    if ((this.ImageAlign & TK.Draw.AnchorMiddle) != 0)
                        sourceY = (this.Img.height - sourceHeight) / 2;
                    else if ((this.ImageAlign & TK.Draw.AnchorBottom) != 0)
                        sourceY = this.Img.height - sourceHeight;
                }
            }
            c.drawImage(this.Img, sourceX, sourceY, sourceWidth, sourceHeight,  drawX, drawY, Math.round(drawWidth), Math.round(drawHeight));
            c.globalAlpha = 1;
        } catch (errie) { }
        c.closePath();
    }
};