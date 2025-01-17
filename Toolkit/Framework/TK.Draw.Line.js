"use strict";
/* Minify Skip */
/* Minify Order(155) */

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

