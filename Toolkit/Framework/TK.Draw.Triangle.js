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

        c.moveTo(this.X, this.Y);

        if (this.TriangleAlign) {
            switch (this.TriangleAlign) {
                case TK.Draw.AnchorLeft:
                    c.moveTo(this.X, this.Y);
                    c.lineTo(this.X, this.Y + this.H);
                    c.lineTo(this.X + this.W, this.Y + this.H / 2);
                    c.lineTo(this.X, this.Y);
                    break;

                case TK.Draw.AnchorRight:
                    c.moveTo(this.X + this.W, this.Y);
                    c.lineTo(this.X + this.W, this.Y + this.H);
                    c.lineTo(this.X, this.Y + this.H / 2);
                    c.lineTo(this.X + this.W, this.Y);
                    break;

                case TK.Draw.AnchorTop:
                    c.moveTo(this.X, this.Y);
                    c.lineTo(this.X + this.W, this.Y);
                    c.lineTo(this.X + this.W / 2, this.Y + this.H);
                    c.lineTo(this.X, this.Y);
                    break;

                case TK.Draw.AnchorBottom:
                    c.moveTo(this.X, this.Y + this.H);
                    c.lineTo(this.X + this.W, this.Y + this.H);
                    c.lineTo(this.X + this.W / 2, this.Y);
                    c.lineTo(this.X, this.Y + this.H);
                    break;

                case TK.Draw.AnchorTop | TK.Draw.AnchorLeft:
                    c.moveTo(this.X, this.Y);
                    c.lineTo(this.X + this.W, this.Y);
                    c.lineTo(this.X, this.Y + this.H);
                    c.lineTo(this.X, this.Y);
                    break;

                case TK.Draw.AnchorTop | TK.Draw.AnchorRight:
                    c.moveTo(this.X + this.W, this.Y);
                    c.lineTo(this.X, this.Y);
                    c.lineTo(this.X + this.W, this.Y + this.H);
                    c.lineTo(this.X + this.W, this.Y);
                    break;

                case TK.Draw.AnchorBottom | TK.Draw.AnchorLeft:
                    c.moveTo(this.X, this.Y + this.H);
                    c.lineTo(this.X + this.W, this.Y + this.H);
                    c.lineTo(this.X, this.Y);
                    c.lineTo(this.X, this.Y + this.H);
                    break;

                case TK.Draw.AnchorBottom | TK.Draw.AnchorRight:
                    c.moveTo(this.X + this.W, this.Y + this.H);
                    c.lineTo(this.X, this.Y + this.H);
                    c.lineTo(this.X + this.W, this.Y);
                    c.moveTo(this.X + this.W, this.Y + this.H);
                    break;
            }
        }

        this.DrawFS(c);
        c.closePath();
    }
};
