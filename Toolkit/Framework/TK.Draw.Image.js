"use strict";
/* Minify Skip */
/* Minify Order(155) */

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