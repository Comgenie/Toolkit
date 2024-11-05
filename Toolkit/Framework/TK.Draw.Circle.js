"use strict";
/* Minify Skip */
/* Minify Order(155) */

TK.Draw.Circle = {
    DrawType: "Circle",
    _: TK.Draw.DrawableObject,
    Angle: 0, Size: null, DonutSize: null, Extrude: 0,
    Draw: function (c) {
        c.beginPath();
        this.Transform(c);

        if (this.Size || this.DonutSize) {

            // Complicated (slower) method for partial circles
            var outerRadius = this.W * 0.5;
            var innerRadius = outerRadius * this.DonutSize;

            var centerPosX = this.X + this.W * 0.5;
            var centerPosY = this.Y + this.H * 0.5;


            if (this.Extrude) {
                var extrudeAngle = (this.Angle + (this.Size * 0.5)) * Math.PI / 180;
                centerPosX += Math.cos(extrudeAngle) * this.Extrude;
                centerPosY += Math.sin(extrudeAngle) * this.Extrude;
            }

            var th1 = this.Angle * Math.PI / 180; // 0 = begin angle
            var th2 = (this.Size + this.Angle) * Math.PI / 180; // 45 = end angle
            var startOfOuterArcX = outerRadius * Math.cos(th2) + centerPosX;
            var startOfOuterArcY = outerRadius * Math.sin(th2) + centerPosY;


            c.arc(centerPosX, centerPosY, innerRadius, th1, th2, false);
            c.lineTo(startOfOuterArcX, startOfOuterArcY);
            c.arc(centerPosX, centerPosY, outerRadius, th2, th1, true);
        } else {
            // Simple (faster) method for simple circles
            c.ellipse(this.X + this.W * 0.5, this.Y + this.H * 0.5, this.W * 0.5, this.H * 0.5, 0, 0, (2 * Math.PI));
        }
        this.DrawFS(c);
        c.closePath();
    },
    CheckMouseOver: function (x, y) {
        var cx = (this.Anchor & TK.Draw.AnchorLeft) ? this.X + (this.W / 2) : (this.Anchor & TK.Draw.AnchorRight) ? this.X - (this.W / 2) : this.X;
        var cy = (this.Anchor & TK.Draw.AnchorTop) ? this.Y + (this.H / 2) : (this.Anchor & TK.Draw.AnchorBottom) ? this.Y - (this.H / 2) : this.Y;
        if (this.Extrude) {
            var extrudeAngle = (this.Angle + (this.Size * 0.5)) * Math.PI / 180;
            cx += Math.cos(extrudeAngle) * this.Extrude;
            cy += Math.sin(extrudeAngle) * this.Extrude;
        }
        if (this.Size && this.Size < 360) {
            var deg = Math.atan2(y - cy, x - cx) * 180.0 / Math.PI;
            if (deg < 0)
                deg = 360 + deg; // Turn into a value between 0 and 360

            var checkFrom = this.Angle % 360;
            if (checkFrom < 0)
                checkFrom = 360 + checkFrom; // Start is also in a value between 0 and 360
            var checkTo = (checkFrom + this.Size) % 360;

            if (deg < checkFrom && (checkTo > checkFrom || deg > checkTo))
                return false;
            if (deg > checkTo && (checkFrom < checkTo || deg < checkTo))
                return false;

        }
        var dist = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2));
        if (this.DonutSize && dist <= (this.W / 2) * this.DonutSize)
            return false;
        return (dist <= this.W / 2);
    }
};
