"use strict";
/* Minify Skip */
/* Minify Order(155) */

TK.Draw.Rect = {
    DrawType: "Rect",
    _: TK.Draw.DrawableObject,
    //RoundCorners: [15,15,15,15],
    ShadeSize: 0,
    ShadePosition: 1,
    Extrude: 0, // Does not work with RoundCorners yet
    DrawRoundedRect: function (c, x, y, w, h, corners) {
        if (!corners || (corners[0] == 0 && corners[1] == 0 && corners[2] == 0 && corners[3] == 0)) {
            c.rect(x, y, w, h);
            return;
        }

        c.moveTo(x + corners[0], y);
        c.lineTo(x + w - corners[1], y);
        c.quadraticCurveTo(x + w, y, x + w, y + corners[1]);
        c.lineTo(x + w, y + h - corners[2]);
        c.quadraticCurveTo(x + w, y + h, x + w - corners[2], y + h);
        c.lineTo(x + corners[3], y + h);
        c.quadraticCurveTo(x, y + h, x, y + h - corners[3]);
        c.lineTo(x, y + corners[0]);
        c.quadraticCurveTo(x, y, x + corners[0], y);
    },
    Draw: function (c) {
        c.beginPath();
        this.Transform(c);


        var corners = null;
        if (this.RoundCorners && this.RoundCorners.length == 4) {
            corners = this.RoundCorners.slice();
            var w = this.W;
            var h = this.H;
            var f = 2;
            if (corners[0] * f > w || corners[1] * f > w || corners[2] * f > w || corners[3] * f > w || corners[0] * f > h || corners[1] * f > h || corners[2] * f > h || corners[3] * f > h)
                corners = null;
        }

        this.DrawRoundedRect(c, this.X, this.Y, this.W, this.H, corners);

        this.DrawFS(c);
        c.closePath();

        if (this.Extrude) {
            if (this.Extrude > 0) {
                // Outside, Draw lighter color above, darker color on the right
                c.beginPath();
                c.fillStyle = this.FillExtrudeLightColor ? this.FillExtrudeLightColor : TK.Draw.ColorToDifferentColor(this.Fill, "#FFF", 0.4);
                c.moveTo(this.X, this.Y);
                c.lineTo(this.X + this.Extrude, this.Y - this.Extrude);
                c.lineTo(this.X + this.W + this.Extrude, this.Y - this.Extrude);
                c.lineTo(this.X + this.W, this.Y);
                c.lineTo(this.X, this.Y);
                c.fill();
                c.closePath();

                c.beginPath();
                c.fillStyle = this.FillExtrudeDarkColor ? this.FillExtrudeDarkColor : TK.Draw.ColorToDifferentColor(this.Fill, "#000", 0.4);
                c.moveTo(this.X + this.W, this.Y);
                c.lineTo(this.X + this.W + this.Extrude, this.Y - this.Extrude);
                c.lineTo(this.X + this.W + this.Extrude, this.Y + this.H - this.Extrude);
                c.lineTo(this.X + this.W, this.Y + this.H);
                c.lineTo(this.X + this.W, this.Y);
                c.fill();
                c.closePath();
            } else if (this.Extrude < 0) {
                // Inside
                c.beginPath();
                //c.fillStyle = colorToDifferentColor(this.Fill, "#FFF", 0.4);
                c.fillStyle = this.FillExtrudeDarkColor ? this.FillExtrudeDarkColor : TK.Draw.ColorToDifferentColor(this.Fill, "#000", 0.4);
                c.moveTo(this.X, this.Y);
                c.lineTo(this.X + -this.Extrude, this.Y);
                c.lineTo(this.X + -this.Extrude, this.Y + this.H - -this.Extrude);
                c.lineTo(this.X, this.Y + this.H);
                c.lineTo(this.X, this.Y);
                c.fill();
                c.closePath();

                c.beginPath();
                c.fillStyle = this.FillExtrudeLightColor ? this.FillExtrudeLightColor : TK.Draw.ColorToDifferentColor(this.Fill, "#000", 0.1);
                c.moveTo(this.X, this.Y + this.H);
                c.lineTo(this.X + -this.Extrude, this.Y + this.H - -this.Extrude);
                c.lineTo(this.X + this.W, this.Y + this.H - -this.Extrude);
                c.lineTo(this.X + this.W, this.Y + this.H);
                c.lineTo(this.X, this.Y + this.H);
                c.fill();
                c.closePath();
            }
        }

        if (this.ShadeSize) {
            c.beginPath();
            this.Transform(c);
            var origFill = this.Fill;
            var origStroke = this.Stroke;
            this.Fill = "rgba(0,0,0,0.2)";
            this.Stroke = null;

            if (!corners)
                corners = [0, 0, 0, 0];

            if (this.ShadePosition == 0)
                this.DrawRoundedRect(c, this.X, this.Y, this.W, this.ShadeSize, [corners[0], corners[1], 0, 0]);
            else if (this.ShadePosition == 1)
                this.DrawRoundedRect(c, (this.X + this.W) - this.ShadeSize, this.Y, this.ShadeSize, this.H, [0, corners[1], corners[2], 0]);
            else if (this.ShadePosition == 2)
                this.DrawRoundedRect(c, this.X, (this.Y + this.H) - this.ShadeSize, this.W, this.ShadeSize, [0, 0, corners[2], corners[3]]);
            else if (this.ShadePosition == 3)
                this.DrawRoundedRect(c, this.X, this.Y, this.ShadeSize, this.H, [corners[1], 0, 0, 0]);

            this.DrawFS(c);
            c.closePath();
            this.Fill = origFill;
            this.Stroke = origStroke;
        }
    }
};
