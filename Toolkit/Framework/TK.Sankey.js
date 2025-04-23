"use strict";
/* Minify Skip */
/* Minify Order(200) */

window.TK.Sankey = {
    _: TK.Draw, // Inherit from TK.Draw for canvas rendering
    NodeWidth: 20, // Width of the sankey block
    NodePadding: 25, // Padding at the top/bottom between sankey blocks
    Nodes: [], // Array of { NodeId: "Node1", Name: "Node 1", Color: "#0081D5" }
    Links: [], // Array of { Source: "Node1", Target: "Node2", Value: 100, Color: "#FF9947" }
    LabelFont: "8pt Arial",
    LabelColor: "#333",
    ColorLinesFromTarget: false, // When set to false, it will use the source instead
    ColorLines: "rgba(255,255,255,0.2)",
    ColorLinesRatio: 0.5,
    PaddingSides: 0, // Px, set to 0 to calculate it automatically

    Init: function () {
        this.GenerateLookupFields();
        this.CalculateLayers();       
        this.CalculateScalesAndSizes();
        if (this.PaddingSides == 0)
            this.CalculatePadding();
        this.DrawNodes();
        this.Refresh();
    },
    GenerateLookupFields: function () {
        this.NodesDict = {};
        for (var i = 0; i < this.Nodes.length; i++) {
            var n = this.Nodes[i];
            if (!n.NodeId)
                continue;
            
            this.NodesDict[n.NodeId] = n;
            n.SourceLinks = this.Links.Where(a => a.Source == n.NodeId);
            n.TargetLinks = this.Links.Where(a => a.Target == n.NodeId);
        }
    },
    CalculateLayers: function () {        
        // Put the nodes in seperate layers based on its links
        this.Layers = [];

        // Start with nodes without any Target set to it, those are the ones at the first layer (on the left)
        var nodes = this.Nodes.Where(a => a.TargetLinks.length == 0);
        this.Layers.push(nodes);

        // Loop through all the layers based on the targets
        while (nodes.length > 0) {
            var nodeIdsNextLayer = [];
            for (var i = 0; i < nodes.length; i++) {
                for (var j = 0; j < nodes[i].SourceLinks.length; j++) {
                    nodeIdsNextLayer.push(nodes[i].SourceLinks[j].Target);
                }
            }
            nodeIdsNextLayer = nodeIdsNextLayer.Unique();

            nodes = this.Nodes.Where(a => nodeIdsNextLayer.indexOf(a.NodeId) >= 0);
            if (nodes.length > 0)
                this.Layers.push(nodes);
        }

        // We've now got layers with possibly duplicates, we will keep all the nodes in the highest layers
        var seenNodeIds = {};
        for (var i = this.Layers.length - 1; i >= 0; i--) {
            var newLayer = [];
            for (var j = 0; j < this.Layers[i].length; j++) {
                var n = this.Layers[i][j];
                if (seenNodeIds[n.NodeId])
                    continue;
                    
                newLayer.push(n);
                seenNodeIds[n.NodeId] = n;                
            }
            this.Layers[i] = newLayer;
        }
    },
    CalculateScalesAndSizes: function () {
        // Find the layer with most required vertical size, base the value scale on that one so it will always fit within the height
        var smallestScale = 0;
        var smallestScaleInLayer = 0;
        for (var i = 0; i < this.Layers.length; i++) {            
            var totalSource = 0;
            var totalTarget = 0;
            var totalHighest = 0;
            for (var j = 0; j < this.Layers[i].length; j++) {
                var n = this.Layers[i][j];
                n.TotalSource = 0;
                n.TotalTarget = 0;
                for (var k = 0; k < n.SourceLinks.length; k++) {
                    n.TotalSource += n.SourceLinks[k].Value;
                }
                for (var k = 0; k < n.TargetLinks.length; k++) {
                    n.TotalTarget += n.TargetLinks[k].Value;
                }
                n.HighestValue = Math.max(n.TotalSource, n.TotalTarget);

                totalSource += n.TotalSource;
                totalTarget += n.TotalTarget;
                totalHighest += n.HighestValue;
            }
            var highestValue = totalHighest;
            this.Layers[i].HighestValue = highestValue;
            if (highestValue == 0 || highestValue == null || highestValue == undefined || isNaN(highestValue))
                continue;

            var totalPaddingSpace = (this.NodePadding * (this.Layers[i].length - 1)) + 30; // 30 extra padding
            var totalAvailableSpace = this.Height - totalPaddingSpace;
            var scale = totalAvailableSpace / highestValue; // 1000 / 10 = 100
            if (smallestScale == 0 || smallestScale > scale) {
                smallestScale = scale;
                smallestScaleInLayer = i;
            }
        }

        this.ValueScale = smallestScale;
    },
    CalculatePadding: function () {
        if (this.Layers.length == 0)
            return;

        var maxRequiredWidth = this.Layers[0].Select(a => a.Name).concat(this.Layers[this.Layers.length - 1].Select(a => a.Name))
            .Where(a => a != null && a != "")
            .Unique()
            .Select(a => TK.Draw.Text.MeasureWidth(a, this.LabelFont))
            .Max();
        this.PaddingSides = maxRequiredWidth + 10;
    },
    DrawNodes: function () {
        // We're finished calculating and arranging all required positions of the nodes, so here we'll just draw everything
        this.Clear();
        var xPos = this.PaddingSides;

        var widthPerLayer = this.Layers.length <= 1 ? this.Width : ((this.Width - (this.PaddingSides * 2) - this.NodeWidth) / (this.Layers.length - 1));        

        // Draw node blocks
        for (var i = 0; i < this.Layers.length; i++)
        {
            var totalPaddingSpace = this.NodePadding * (this.Layers[i].length - 1);
            var totalRequiredSpace = (this.Layers[i].HighestValue * this.ValueScale) + totalPaddingSpace;
            
            var yPos = (this.Height / 2) - (totalRequiredSpace / 2);

            for (var j = 0; j < this.Layers[i].length; j++) {
                var n = this.Layers[i][j];
                var nodeHeight = n.HighestValue * this.ValueScale;

                // Node block
                n.Rect = this.Add({
                    _: TK.Draw.Rect,
                    X: xPos, Y: yPos, W: this.NodeWidth, H: nodeHeight,
                    Fill: n.Color,
                    Anchor: window.TK.Draw.AnchorTop | window.TK.Draw.AnchorLeft,

                    // To be populated below, based on the amount of links added
                    SourceAmount: 0, // left side
                    TargetAmount: 0 // right side
                });                

                n.Text = this.Add({
                    _: TK.Draw.Text,
                    X: xPos + (this.NodeWidth / 2), Y: yPos + (nodeHeight / 2), // W: this.NodeWidth, H: nodeHeight,
                    Fill: this.LabelColor,
                    Font: this.LabelFont,
                    Anchor: window.TK.Draw.AnchorCenter | window.TK.Draw.AnchorMiddle,
                    TextAlign: window.TK.Draw.AnchorCenter | window.TK.Draw.AnchorMiddle,
                    Text: n.Name,
                    ZIndex: 100
                });
                n.Text.FillWidthHeight();

                if (i == 0 && n.Text.W <= this.PaddingSides) { // Space before the first block
                    n.Text.X = this.PaddingSides / 2;
                } else if (i + 1 == this.Layers.length && n.Text.W <= this.PaddingSides) { // Space before the first block
                    n.Text.X = this.Width - this.PaddingSides / 2;
                } else {
                    n.TextBg = this.Add({
                        _: TK.Draw.Rect,
                        X: xPos + (this.NodeWidth / 2) - 1, Y: yPos + (nodeHeight / 2) - 1, W: n.Text.W + 10, H: n.Text.H + 10,
                        Fill: "rgba(255,255,255,0.8)",
                        RoundCorners: [3, 3, 3, 3],
                        LineWidth: 0,
                        Anchor: window.TK.Draw.AnchorCenter | window.TK.Draw.AnchorMiddle,
                        ZIndex: 90
                    });
                }

                yPos += nodeHeight + this.NodePadding;
            }
            xPos += widthPerLayer;
        }

        // Draw lines
        for (var i = 0; i < this.Layers.length; i++) {
            for (var j = 0; j < this.Layers[i].length; j++) {
                var n = this.Layers[i][j];
                var pos = 0;
                for (var k = 0; k < n.SourceLinks.length; k++) {
                    var link = n.SourceLinks[k];
                    var otherNode = this.NodesDict[link.Target];
                    if (!otherNode || !otherNode.Rect)
                        continue;

                    var sourceOffset = n.Rect.TargetAmount * this.ValueScale;
                    var targetOffset = otherNode.Rect.SourceAmount * this.ValueScale;
                    var height = link.Value * this.ValueScale;
                    n.Rect.TargetAmount += link.Value;
                    otherNode.Rect.SourceAmount += link.Value;

                    if (height < 1)
                        height = 1;

                    this.Add({
                        _: TK.Draw.LineThroughPoints,
                        //Stroke: "#666",
                        Fill: TK.Draw.ColorToDifferentColor(this.ColorLinesFromTarget ? otherNode.Color : n.Color, this.ColorLines, this.ColorLinesRatio),
                        Smoothing: TK.Draw.SmoothQuadratic,
                        Points: [
                            [n.Rect.X + n.Rect.W, n.Rect.Y + sourceOffset], [otherNode.Rect.X, otherNode.Rect.Y + targetOffset]
                        ],
                        Heights: [height, height]
                    });
                }
            }
        }
    }    
};