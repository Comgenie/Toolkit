/* Minify WIP */
"use strict";

window.TK.Sankey = {
    _: TK.Draw, // Inherit from TK.Draw for canvas rendering
    NodeWidth: 20,
    NodePadding: 25,
    Nodes: [], // Array of { NodeId: "Node1", Name: "Node 1", Color: "#0081D5" }
    Links: [], // Array of { Source: "Node1", Target: "Node2", Value: 100, Color: "#FF9947" }
    LabelFont: "10pt Arial",
    LabelColor: "#333",

    Init: function () {
        // Calculate node positions and link paths
        this.CalculateNodePositions();
        this.CalculateLinkPaths();

        // Refresh the canvas to draw the Sankey diagram
        this.Refresh();
    },

    CalculateNodePositions: function () {
        // Initialize node positions randomly
        for (var i = 0; i < this.Nodes.length; i++) {
            this.Nodes[i].X = Math.random() * (this.Width - this.NodeWidth);
            this.Nodes[i].Y = Math.random() * (this.Height - this.Nodes[i].Value);
        }

        // Energy-based iteration
        for (var iter = 0; iter < 100; iter++) { // Adjust iteration count as needed
            for (var i = 0; i < this.Nodes.length; i++) {
                var node = this.Nodes[i];
                var forceX = 0, forceY = 0;

                // Repulsion from other nodes
                for (var j = 0; j < this.Nodes.length; j++) {
                    if (i !== j) {
                        var other = this.Nodes[j];
                        var dx = node.X - other.X;
                        var dy = node.Y - other.Y;
                        var distance = Math.sqrt(dx * dx + dy * dy);
                        if (distance > 0) {
                            forceX += dx / distance;
                            forceY += dy / distance;
                        }
                    }
                }

                // Attraction to connected nodes
                for (var j = 0; j < this.Links.length; j++) {
                    var link = this.Links[j];
                    if (link.Source === node.NodeId) {
                        var target = this.Nodes.find(n => n.NodeId === link.Target);
                        var dx = target.X - node.X;
                        var dy = target.Y - node.Y;
                        forceX -= dx * link.Value;
                        forceY -= dy * link.Value;
                    }
                }

                // Apply forces, with some damping
                node.X += forceX * 0.1;
                node.Y += forceY * 0.1;

                // Constrain to canvas boundaries
                node.X = Math.max(0, Math.min(this.Width - this.NodeWidth, node.X));
                node.Y = Math.max(0, Math.min(this.Height - node.Value, node.Y));
            }
        }
    },

    CalculateLinkPaths: function () {
        for (var i = 0; i < this.Links.length; i++) {
            var link = this.Links[i];
            var source = this.Nodes.find(n => n.NodeId === link.Source);
            var target = this.Nodes.find(n => n.NodeId === link.Target);

            // Simple straight line path for now
            link.Path = [
                { X: source.X + this.NodeWidth / 2, Y: source.Y + source.Value / 2 },
                { X: target.X + this.NodeWidth / 2, Y: target.Y + target.Value / 2 }
            ];

            // You could add Bezier curve generation here for smoother paths
        }
    },

    Refresh: function () {
        // Draw links
        for (var i = 0; i < this.Links.length; i++) {
            var link = this.Links[i];
            this.Add({
                _: TK.Draw.LineThroughPoints,
                Points: link.Path, // Use the calculated path
                Fill: link.Color,
                Smoothing: 2, // Vertical smoothing for curved links
                Anchor: TK.Draw.AnchorLeft | TK.Draw.AnchorTop,
                LineWidth: link.Value / 10 // Adjust line width based on value
            });
        }

        // Draw nodes
        for (var i = 0; i < this.Nodes.length; i++) {
            var node = this.Nodes[i];
            this.Add({
                _: TK.Draw.Rect,
                X: node.X,
                Y: node.Y,
                W: this.NodeWidth,
                H: node.Value, // Node height represents its value
                Fill: node.Color,
                Anchor: TK.Draw.AnchorLeft | TK.Draw.AnchorTop
            });

            // Add node labels
            this.Add({
                _: TK.Draw.Text,
                X: node.X + this.NodeWidth + 5, // Position label to the right
                Y: node.Y + node.Value / 2, // Center vertically
                Text: node.Name,
                Font: this.LabelFont,
                Fill: this.LabelColor,
                Anchor: TK.Draw.AnchorLeft | TK.Draw.AnchorMiddle
            });
        }
    }
};