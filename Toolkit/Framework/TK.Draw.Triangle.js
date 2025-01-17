"use strict";
/* Minify Skip */
/* Minify Order(155) */

TK.Draw.Triangle = {
    DrawType: "Triangle",
    _: TK.Draw.DrawableObject,
    TriangleAlign: TK.Draw.AnchorTop,
    Draw: function (c) {
        c.beginPath();
        this.Transform(c);

        var p = [[this.X, this.Y], [this.X + this.W, this.Y], [this.X + this.W, this.Y + this.H], [this.X, this.Y + this.H]];
        var start = [
            TK.Draw.AnchorTop | TK.Draw.AnchorLeft, TK.Draw.AnchorTop | TK.Draw.AnchorRight, TK.Draw.AnchorBottom | TK.Draw.AnchorRight, TK.Draw.AnchorBottom | TK.Draw.AnchorLeft,
            TK.Draw.AnchorTop, TK.Draw.AnchorRight, TK.Draw.AnchorBottom, TK.Draw.AnchorLeft
        ];
        for (var i = 0; i < start.length; i++) {
            if (start[i] != this.TriangleAlign)
                continue;

            c.moveTo(p[i % 4][0], p[i % 4][1]);
            c.lineTo(p[(i + 1) % 4][0], p[(i + 1) % 4][1]);
            if (i < 4) {                
                c.lineTo(p[(i + 3) % 4][0], p[(i + 3) % 4][1]);
            } else if (i % 2 == 0) {
                c.lineTo(p[i % 4][0] + (p[(i + 1) % 4][0] - p[i % 4][0]) / 2, p[(i + 2) % 4][1]);
            } else {
                c.lineTo(p[(i + 2) % 4][0], p[i % 4][1] + (p[(i + 1) % 4][1] - p[i % 4][1]) / 2);
            }
            c.lineTo(p[i % 4][0], p[i % 4][1]);
            break;
        }
        this.DrawFS(c);
        c.closePath();
    }
};
