"use strict";
/* Minify Skip */
/* Minify Order(155) */

TK.Draw.LineThroughPoints = {
    DrawType: "LineThroughPoints",
    _: TK.Draw.DrawableObject,
    Points: [], // [ [x,y], [x, y] ], optionally a third parameter (direction) can be passed as well [x, y, direction]
    Heights: [], // Array with heights for each point, for creating an area chart or sankey lines
    Smoothing: TK.Draw.SmoothNone,
    DefaultDirection: TK.Draw.DirectionRight, // Default direction if not set at point level, used for smoothing
    CornerRadius: 10,
    Draw: function (c) {
        c.beginPath();
        if (!this.W) {
            this.W = 0;
            for (var i = 0; i < this.Points.length; i++) {
                if (this.Points[i][0] > this.W)
                    this.W = this.Points[i][0];
                if (this.Points[i][1] > this.H)
                    this.H = this.Points[i][1];
            }
        }
        this.Transform(c);
        var obj = this;

        var passes = this.Heights && this.Heights.length >= this.Points.length ? 2 : 1;
        var points = this.Points.slice();
        var cornersEndPos = function (point, otherPoint, reverseDir) {
            point = point.slice();
            var dir = point.length > 2 && point[2] !== null && point[2] !== undefined ? point[2] : obj.DefaultDirection;
            var cornerSize = obj.CornerRadius;

            if (reverseDir)
                dir = (dir + 2) % 4;
            if (dir == TK.Draw.DirectionTop) {
                point[2] = otherPoint[0] >= point[0] ? TK.Draw.DirectionRight : TK.Draw.DirectionLeft;
                point[1] -= cornerSize;
                point[0] += otherPoint[0] >= point[0] ? cornerSize : -cornerSize;
            } else if (dir == TK.Draw.DirectionRight) {
                point[2] = otherPoint[1] >= point[1] ? TK.Draw.DirectionBottom : TK.Draw.DirectionTop;
                point[1] += otherPoint[1] >= point[1] ? cornerSize : -cornerSize;
                point[0] += cornerSize;
            } else if (dir == TK.Draw.DirectionBottom) {
                point[2] = otherPoint[0] >= point[0] ? TK.Draw.DirectionRight : TK.Draw.DirectionLeft;
                point[1] += cornerSize;
                point[0] += otherPoint[0] >= point[0] ? cornerSize : -cornerSize;
            } else if (dir == TK.Draw.DirectionLeft) {
                point[2] = otherPoint[1] >= point[1] ? TK.Draw.DirectionBottom : TK.Draw.DirectionTop;
                point[1] += otherPoint[1] >= point[1] ? cornerSize : -cornerSize;
                point[0] -= cornerSize;
            }
            return point;
        };
        var cornersDrawCurve = function (point, otherPoint, dir) {
            // Dir should be the direction after the curve
            if (dir == TK.Draw.DirectionTop || dir == TK.Draw.DirectionBottom) {
                c.quadraticCurveTo(otherPoint[0] + obj.X, point[1] + obj.Y, otherPoint[0] + obj.X, otherPoint[1] + obj.Y);
            } else {
                c.quadraticCurveTo(point[0] + obj.X, otherPoint[1] + obj.Y, otherPoint[0] + obj.X, otherPoint[1] + obj.Y);
            }
            //c.lineTo(otherPoint[0], otherPoint[1]);
        };
        for (var pass = 0; pass < passes; pass++) {
            if (pass == 1) {
                // If the heights for all points is set, we will loop through the points a second time
                // in reverse order with the added heights and reversed directions so we can make a full closed loop.
                points = points.map(function (p, index) {
                    var newP = p.slice();
                    newP[1] += obj.Heights[index];
                    newP[2] = ((newP[2] !== undefined && newP[2] !== null ? newP[2] : obj.DefaultDirection) + 2) % 4;
                    return newP;
                });
                points = points.reverse();
            }

            for (var i = 0; i < points.length; i++) {
                var p = points[i];
                var dir = p.length >= 3 && p[2] !== null && p[2] !== undefined ? p[2] : this.DefaultDirection;

                if (i == 0) {
                    if (pass == 0)
                        c.moveTo(p[0] + this.X, p[1] + this.Y);
                    else
                        c.lineTo(p[0] + this.X, p[1] + this.Y);
                    continue;
                }
                var lp = points[i - 1];
                var ldir = lp.length >= 3 && lp[2] !== null && lp[2] !== undefined ? lp[2] : this.DefaultDirection;

                var x_mid = (lp[0] + p[0]) / 2;
                var y_mid = (lp[1] + p[1]) / 2;

                if (!this.Smoothing) {
                    c.lineTo(p[0] + this.X, p[1] + this.Y);
                } else if (this.Smoothing == TK.Draw.SmoothQuadratic) {
                    if (ldir == TK.Draw.DirectionRight || ldir == TK.Draw.DirectionLeft) {
                        var cp_x1 = (x_mid + lp[0]) / 2;
                        var cp_x2 = (x_mid + p[0]) / 2;
                        c.quadraticCurveTo(cp_x1 + this.X, lp[1] + this.Y, x_mid + this.X, y_mid + this.Y);
                        c.quadraticCurveTo(cp_x2 + this.X, p[1] + this.Y, p[0] + this.X, p[1] + this.Y);
                    } else if (ldir == TK.Draw.DirectionTop || ldir == TK.Draw.DirectionBottom) {
                        var cp_y1 = (y_mid + lp[1]) / 2;
                        var cp_y2 = (y_mid + p[1]) / 2;
                        c.quadraticCurveTo(lp[0] + this.X, cp_y1 + this.Y, x_mid + this.X, y_mid + this.Y);
                        c.quadraticCurveTo(p[0] + this.X, cp_y2 + this.Y, p[0] + this.X, p[1] + this.Y);
                    }
                } else if (this.Smoothing == TK.Draw.SmoothCorners) {
                    // TODO:
                    // - Check if it's nearby, we might need to reduce the corner radius
                    // - Do multiple corners if we are not in the correct direction yet
                    //var startPoint = cornersEndPos(lp, p);
                    var startPoint = [lp[0], lp[1], ldir];
                    var endPoint = cornersEndPos(p, lp, true);
                    var revDirEnd = (endPoint[2] + 2) % 4;


                    var max = 100;
                    while (startPoint[0] != endPoint[0] || startPoint[1] != endPoint[1]) {
                        max--;
                        if (max == 0) {
                            console.log("max reached");
                            break;
                        }
                        var startDirHorizontal = startPoint[2] == TK.Draw.DirectionLeft || startPoint[2] == TK.Draw.DirectionRight;
                        if (startPoint[2] == revDirEnd && startDirHorizontal && startPoint[1] == endPoint[1]) {
                            // If already at the right height, just need 1 line to connect
                            c.lineTo(endPoint[0] + this.X, endPoint[1] + this.Y);
                            break;
                        } else if (startPoint[2] == revDirEnd && !startDirHorizontal && startPoint[0] == endPoint[0]) {
                            // If already at the right x pos, just need 1 line to connect
                            c.lineTo(endPoint[0] + this.X, endPoint[1] + this.Y);
                            break;
                        } else {
                            // Make a line towards the right direction
                            var newPos = startPoint.slice();
                            if (startPoint[2] == TK.Draw.DirectionRight) {
                                if (endPoint[2] == TK.Draw.DirectionLeft)
                                    newPos[0] = endPoint[0] - (2 * this.CornerRadius);
                                else if (endPoint[2] == TK.Draw.DirectionTop || endPoint[2] == TK.Draw.DirectionBottom)
                                    newPos[0] = endPoint[0] - this.CornerRadius;
                                else
                                    newPos[0] = endPoint[0];
                                startPoint[0] = newPos[0] > startPoint[0] ? newPos[0] : startPoint[0];
                            } else if (startPoint[2] == TK.Draw.DirectionLeft) {
                                if (endPoint[2] == TK.Draw.DirectionRight)
                                    newPos[0] = endPoint[0] + (2 * this.CornerRadius);
                                else if (endPoint[2] == TK.Draw.DirectionTop || endPoint[2] == TK.Draw.DirectionBottom)
                                    newPos[0] = endPoint[0] + this.CornerRadius;
                                else
                                    newPos[0] = endPoint[0];
                                startPoint[0] = newPos[0] < startPoint[0] ? newPos[0] : startPoint[0];
                            } else if (startPoint[2] == TK.Draw.DirectionBottom) {
                                if (endPoint[2] == TK.Draw.DirectionTop)
                                    newPos[1] = endPoint[1] - (2 * this.CornerRadius);
                                else if (endPoint[2] == TK.Draw.DirectionLeft || endPoint[2] == TK.Draw.DirectionRight)
                                    newPos[1] = endPoint[1] - this.CornerRadius;
                                else
                                    newPos[1] = endPoint[1];
                                startPoint[1] = newPos[1] > startPoint[1] ? newPos[1] : startPoint[1];
                            } else if (startPoint[2] == TK.Draw.DirectionTop) {
                                if (endPoint[2] == TK.Draw.DirectionRight)
                                    newPos[1] = endPoint[1] + (2 * this.CornerRadius);
                                else if (endPoint[2] == TK.Draw.DirectionLeft || endPoint[2] == TK.Draw.DirectionRight)
                                    newPos[1] = endPoint[1] + this.CornerRadius;
                                else
                                    newPos[1] = endPoint[1];
                                startPoint[1] = newPos[1] < startPoint[1] ? newPos[1] : startPoint[1];
                            }

                            c.lineTo(startPoint[0] + this.X, startPoint[1] + this.Y);

                            // Corner into the right direction and update our start pos
                            var newStartPoint = cornersEndPos(startPoint, p);
                            cornersDrawCurve(startPoint, newStartPoint, newStartPoint[2]);
                            startPoint = newStartPoint;
                        }
                    }
                    //c.moveTo(p[0],p[1])
                    cornersDrawCurve(startPoint, p, dir);
                }
            }
            if (pass == 1 && this.Points.length > 0) {
                c.lineTo(this.Points[0][0] + this.X, this.Points[0][1] + this.Y);
            }
        }

        this.DrawFS(c);
        c.closePath();
    }
};
