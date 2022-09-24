"use strict";
/* Minify Skip */
/* Minify Order(200) */

TK.ImageEditor = {
    className: "toolkitImageEditor",    
    Data: null,
    SpecificSize: null, // TODO: Resize uploaded image to [x, y] and force aspect ratio
    ValueType: "dataUrl", // by default, a data:image/jpeg;base64 value is used. 
    Mime: "image/jpeg",
    Quality: 0.9,
    StorageClientId: undefined,
    StorageContainer: undefined,
    StoragePath: undefined,
    onchange: null,

    // Auto resize when image is larger than width and/or height
    MaxWidth: null, 
    MaxHeight: null,

    Init: function () {
        var obj = this;
        if (this.DataSettings) {
            if (this.DataSettings.Mime !== undefined)
                this.Mime = this.DataSettings.Mime;
            if (this.DataSettings.Quality !== undefined)
                this.Quality = this.DataSettings.Quality;
            if (this.DataSettings.ValueType !== undefined)
                this.ValueType = this.DataSettings.ValueType;
            if (this.DataSettings.StorageContainer !== undefined)
                this.StorageContainer = this.DataSettings.StorageContainer;
            if (this.DataSettings.StorageClientId !== undefined)
                this.StorageClientId = this.DataSettings.StorageClientId;
            if (this.DataSettings.StoragePath !== undefined)
                this.StoragePath = this.DataSettings.StoragePath;
        }

        if (this.Data == "loading") {
            this.Elements.DropArea.style.backgroundImage = "";
            this.Elements.DropArea.innerHTML = "Uploading...";
        } else if (this.Data) {            
            if (window.Blob && this.Data instanceof Blob) { 
                this.Elements.DropArea.style.backgroundImage = "";
                var fileReader = new FileReader();
                fileReader.onload = function (e) {
                    obj.Elements.DropArea.style.backgroundImage = "url('"+e.target.result+"')";
                };
                fileReader.readAsDataURL(this.Data);
            } else { // Url or dataUrl
                this.Elements.DropArea.style.backgroundImage = "url('" + this.Data + "')";
            }
            this.Elements.DropArea.innerHTML = "&nbsp;";
        } else {
            this.Elements.DropArea.style.backgroundImage = "";
            this.Elements.DropArea.innerHTML = Svg.Icons.Image;
        }
    },

    StorageHandlers: {
        dataUrl: function (imageEditor, canvas, callBackValue) {
            callBackValue(canvas.toDataURL(imageEditor.Mine, imageEditor.Quality));
        },
        url: function (imageEditor, canvas, callBackValue) {
            
            if (!TK.ServerStorage)
                return;
            var serverStorage = TK.Initialize({
                _: TK.ServerStorage,
                Container: imageEditor.StorageClientId,
                ClientId: imageEditor.ClientId
            });

            // Turn canvas into [Blob]
            canvas.toBlob(function (blob) {
                console.log(blob);
                var fileName = imageEditor.StoragePath ? imageEditor.StoragePath : imageEditor.Mime.replace("/", ".");
                serverStorage.Store(fileName, blob, function (fileMetaData) {
                    console.log(fileMetaData);
                    if (fileMetaData && fileMetaData.url)
                        callBackValue(fileMetaData.url);
                    else
                        alert('Error uploading image');
                });
            }, imageEditor.Mime, imageEditor.Quality);

            
            /*var fd = new FormData();
            fd.append("file", blob, "hello.txt");
            var xhr = new XMLHttpRequest();
            xhr.open('POST', '/server.php', true);
            xhr.onload = function(){
                alert('upload complete');
            };
            xhr.send(fd);*/
        },
        blob: function (imageEditor, canvas, callBackValue) {
            // Turn the value into a [Blob]
            canvas.toBlob(function (blob) {
                callBackValue(blob);
            }, imageEditor.Mime, imageEditor.Quality);
        }
    },
    
    PopupTemplate: {
        _: TK.Popup,
        EnableResize: false,
        Title: "Edit image",
        Width: 600,
        Height: 500,
        EnableBackDrop: true, 
        ImageEditorInstance: null,
        Template: {
            Elements: {
                CanvasContainer: {
                    Elements: {
                        Buttons: {
                            style: {
                                position: "relative",
                                height: "30px"
                            },
                            Elements: {
                                Slider: {
                                    _: "input",
                                    type: "range",
                                    min: 0,
                                    max: 360,
                                    value: 0,
                                    step: 5,
                                    style: {
                                        width: "99%"
                                    },
                                    onchange: function () {
                                        this.Parent.Parent.Elements.SelectionCanvas.Rotation = parseFloat(this.value.toString());
                                        this.Parent.Parent.Elements.SelectionCanvas.UpdateBoxPosition();
                                        this.Parent.Parent.Elements.SelectionCanvas.Refresh();
                                    },
                                    oninput: function () {
                                        this.onchange();
                                    }
                                }
                            }
                        },
                        SelectionCanvas: {
                            _: TK.Draw,
                            Width: 580,
                            Height: 370,
                            style: {
                                backgroundColor: "#000"
                            },
                            CropTL: [50, 50],
                            CropBR: [200, 200],
                            NavigationEnabled: true,
                            ZoomEnabled: true,
                            Rotation: 0, // 0 Normal, 1 CW, 2 Upside down, 3 CC

                            Init: function () {
                                // Draw bounding box
                                var obj = this;
                                this.Add({
                                    _: TK.Draw.Image,
                                    X: 10, Y: 10, W: 100, H: 100, Anchor: TK.Draw.AnchorCenter | TK.Draw.AnchorMiddle
                                }, "Image");
                                this.Add({
                                    _: TK.Draw.Rect, Stroke: "#CCC",
                                    MouseDown: function (x, y) {
                                        this.Dragging = true;
                                        this.StartPos = [x, y];                                        
                                    },
                                    MouseMove: function (x, y) {
                                        if (!this.Dragging)
                                            return;
                                        var differenceX = x - this.StartPos[0];
                                        var differenceY = y - this.StartPos[1];
                                        obj.CropTL[0] += differenceX;
                                        obj.CropTL[1] += differenceY;

                                        obj.CropBR[0] += differenceX;
                                        obj.CropBR[1] += differenceY;
                                        if (obj.CropBR[0] >= obj.Width) {
                                            obj.CropTL[0] -= (obj.CropBR[0] - obj.Width);
                                            obj.CropBR[0] = obj.Width;
                                        }
                                        if (obj.CropBR[1] >= obj.Height) {
                                            obj.CropTL[1] -= (obj.CropBR[1] - obj.Height);
                                            obj.CropBR[1] = obj.Height;
                                        }
                                        if (obj.CropTL[0] < 0) {
                                            obj.CropBR[0] += -obj.CropTL[0];
                                            obj.CropTL[0] = 0;
                                        }
                                        if (obj.CropTL[1] < 0) {
                                            obj.CropBR[1] += -obj.CropTL[1];
                                            obj.CropTL[1] = 0;
                                        }
                                        this.StartPos = [x, y];

                                        obj.UpdateBoxPosition();
                                    },
                                    MouseUp: function (x, y) {
                                        this.Dragging = false;
                                    }
                                }, "Box");
                                var boxSize = 15;

                                var boxes = ["TL", "TR", "BL", "BR"];
                                for (var i = 0; i < boxes.length; i++) {
                                    this.Add({
                                        _: TK.Draw.Rect,
                                        Box: boxes[i],
                                        Anchor: boxes[i] == "TL" ? TK.Draw.AnchorRight | TK.Draw.AnchorBottom : 
                                                boxes[i] == "TR" ? TK.Draw.AnchorLeft | TK.Draw.AnchorBottom : 
                                                boxes[i] == "BL" ? TK.Draw.AnchorRight | TK.Draw.AnchorTop : 
                                                boxes[i] == "BR" ? TK.Draw.AnchorLeft | TK.Draw.AnchorTop :
                                                        TK.Draw.AnchorCenter | TK.Draw.AnchorBottom,
                                        Fill: "#FFF",
                                        W: boxSize, H: boxSize,
                                        MouseDown: function (x, y) {
                                            this.Dragging = true;
                                        },
                                        MouseMove: function (x, y) {
                                            this.Fill = "#999";
                                            if (this.Box == "TL")
                                                obj.style.cursor = "nw-resize";
                                            else if (this.Box == "TR")
                                                obj.style.cursor = "ne-resize";
                                            else if (this.Box == "BL")
                                                obj.style.cursor = "sw-resize";
                                            else if (this.Box == "BR")
                                                obj.style.cursor = "se-resize";
                                            
                                            if (!this.Dragging)
                                                return;
                                            if (this.Box == "TL") {
                                                obj.CropTL[0] = x;
                                                obj.CropTL[1] = y;                                                
                                            } else if (this.Box == "TR") {
                                                obj.CropBR[0] = x;
                                                obj.CropTL[1] = y;
                                            } else if (this.Box == "BL") {
                                                obj.CropTL[0] = x;
                                                obj.CropBR[1] = y;
                                            } else if (this.Box == "BR") {
                                                obj.CropBR[0] = x;
                                                obj.CropBR[1] = y;
                                            }
                                            obj.UpdateBoxPosition();
                                        },
                                        MouseOut: function () {
                                            this.Fill = "#FFF";
                                            obj.style.cursor = "default";
                                        },
                                        MouseUp: function (x, y) {
                                            this.Dragging = false;
                                        }
                                    }, "Box"+boxes[i]);
                                }

                                this.UpdateBoxPosition();
                                this.Refresh();
                            },
                            UpdateBoxPosition: function () {
                                this.Elements.Image.Rotate = this.Rotation;
                                this.Elements.Box.X = this.CropTL[0];
                                this.Elements.Box.Y = this.CropTL[1];
                                this.Elements.Box.W = this.CropBR[0] - this.CropTL[0];
                                this.Elements.Box.H = this.CropBR[1] - this.CropTL[1];
                                this.Elements.BoxTL.X = this.CropTL[0];
                                this.Elements.BoxTL.Y = this.CropTL[1];
                                this.Elements.BoxTR.X = this.CropBR[0];
                                this.Elements.BoxTR.Y = this.CropTL[1];
                                this.Elements.BoxBL.X = this.CropTL[0];
                                this.Elements.BoxBL.Y = this.CropBR[1];
                                this.Elements.BoxBR.X = this.CropBR[0];
                                this.Elements.BoxBR.Y = this.CropBR[1];
                            },
                        }
                    }
                }
            }
        },
        Buttons: {
            Apply: function () {
                var popup = this.Parent.Parent;
                var canvas = popup.Elements.Content.Elements.CanvasContainer.Elements.SelectionCanvas;

                // Apply transformations to image, upload and return url
                popup.ImageEditorInstance.Data = "loading";
                popup.ImageEditorInstance.Init();
                setTimeout(function () {
                    var resizeAndCropCanvas = document.createElement("CANVAS");
                    //canvas.Scale; 
                    resizeAndCropCanvas.width = (canvas.CropBR[0] - canvas.CropTL[0]) / canvas.Ratio;
                    resizeAndCropCanvas.height = (canvas.CropBR[1] - canvas.CropTL[1]) / canvas.Ratio;

                    var offsetX = ((canvas.Elements.Image.X - canvas.Elements.Image.W / 2) - canvas.CropTL[0]) / canvas.Ratio;
                    var offsetY = ((canvas.Elements.Image.Y - canvas.Elements.Image.H / 2) - canvas.CropTL[1]) / canvas.Ratio;
                    var context = resizeAndCropCanvas.getContext("2d");
                    context.imageSmoothingQuality = 'high';
                    // TODO: Rotation canvas.Elements.Image.Rotate
                    if (canvas.Elements.Image.Rotate) {                        
                        var translateX = offsetX + (canvas.Elements.Image.Img.width / 2);
                        var translateY = offsetY + (canvas.Elements.Image.Img.height / 2);

                        context.translate(translateX, translateY);
                        context.rotate(canvas.Elements.Image.Rotate * Math.PI / 180);
                        context.translate(-translateX, -translateY);
                        //context.translate(offsetX, offsetY);
                    } 
                    context.drawImage(canvas.Elements.Image.Img, offsetX, offsetY, canvas.Elements.Image.Img.width, canvas.Elements.Image.Img.height);

                    var inst = popup.ImageEditorInstance;

                    // Resize if needed
                    if ((inst.MaxWidth !== null && canvas.Elements.Image.Img.width > inst.MaxWidth) || (inst.MaxHeight !== null && canvas.Elements.Image.Img.height > inst.MaxHeight)) {
                        var ratioW = 9999;
                        var ratioH = 9999;
                        var newWidth = 0;
                        var newHeight = 0;

                        if (inst.MaxWidth !== null)
                            ratioW = inst.MaxWidth / resizeAndCropCanvas.width ; // 200 / 800 = 0.25
                        if (inst.MaxHeight !== null)
                            ratioH = inst.MaxHeight / resizeAndCropCanvas.height; // 200 / 1000 = 0.2

                        if (ratioW < ratioH) {
                            newWidth = inst.MaxWidth;
                            newHeight = Math.floor(ratioW * resizeAndCropCanvas.height);
                        } else {
                            newWidth = Math.floor(ratioH * resizeAndCropCanvas.width);
                            newHeight = inst.MaxHeight;
                        }

                        var resizeAndCropCanvas2 = document.createElement("CANVAS");
                        resizeAndCropCanvas2.width = newWidth;
                        resizeAndCropCanvas2.height = newHeight;
                        var context2 = resizeAndCropCanvas2.getContext("2d");
                        context2.imageSmoothingQuality = 'high';
                        context2.drawImage(resizeAndCropCanvas, 0, 0, newWidth, newHeight);

                        resizeAndCropCanvas = resizeAndCropCanvas2;
                    }
                    
                    if (inst.ValueType && inst.StorageHandlers[inst.ValueType]) {
                        inst.StorageHandlers[inst.ValueType](inst, resizeAndCropCanvas, function (value) {
                            inst.Data = value;
                            inst.Init();
                            if (inst.onchange)
                                inst.onchange();
                        });
                    } else {
                        var url = resizeAndCropCanvas.toDataURL(inst.Mine, inst.Quality);
                        inst.Data = url;
                        inst.Init();
                        if (inst.onchange)
                            inst.onchange();
                    }
                }, 1);
            },
            Cancel: function () { }
        },
        ImageLoaded: function (dataUri) {
            var canvas = this.Elements.Content.Elements.CanvasContainer.Elements.SelectionCanvas;
            this.ImageUrl = dataUri;
            var img = new Image();
            img.onload = function () {
                canvas.Elements.Image.Img = this;
                var padding = 20;
                // Fill image into selection canvas (with some padding at the sides)
                var maxWidth = canvas.Width - (padding * 2), maxHeight = canvas.Height - (padding * 2);
                var imgWidth = this.width, imgHeight = this.height;
                var widthRatio = maxWidth / imgWidth, heightRatio = maxHeight / imgHeight;
                var bestRatio = Math.min(widthRatio, heightRatio);
                var newWidth = imgWidth * bestRatio, newHeight = imgHeight * bestRatio;
                canvas.Ratio = bestRatio;
                
                canvas.Elements.Image.X = (canvas.Width / 2);
                canvas.Elements.Image.Y = (canvas.Height / 2);
                canvas.Elements.Image.W = newWidth;
                canvas.Elements.Image.H = newHeight;
                canvas.CropTL = [canvas.Elements.Image.X - (newWidth / 2), canvas.Elements.Image.Y - (newHeight / 2)];
                canvas.CropBR = [canvas.Elements.Image.X + (newWidth / 2), canvas.Elements.Image.Y + (newHeight / 2)];
                canvas.UpdateBoxPosition();
                canvas.Refresh();
            };
            img.src = dataUri;
        }
    },
    GetValue: function () {
        if (this.Data == "loading")
            return null;
        return this.Data;
    },
    HandleFiles: function (files) {
        var file = files[0]; // TODO: Support multiple files in the future
        

        var popup = this.Add({
            _: this.PopupTemplate,
            ImageEditorInstance: this
        });

        var reader = new FileReader();
        reader.onload = function (e2) { popup.ImageLoaded(e2.target.result); };
        reader.readAsDataURL(file);
    },
    Elements: {
        DropArea: {
            onclick: function () {
                this.Near("FileUploadField").click();                
            },
            ondragover: function (ev) {
                this.style.borderColor = "#1d1d1d";
                ev.preventDefault();
            },
            ondragexit: function (ev) {
                this.style.borderColor = "";
                ev.preventDefault();
            },
            ondrop: function (ev) {
                ev.preventDefault();
                
                if (!ev.dataTransfer || !ev.dataTransfer.files)
                    return;
                this.Parent.HandleFiles(ev.dataTransfer.files);
            }
        },
        FileUploadField: {
            _: "input",
            type: "file",
            accept:"image/*",
            style: {
                display: "none"
            },
            onchange: function (e) {
                if (!e || !e.target || !e.target.files || e.target.files.length == 0)
                    return;
                //alert(e.target.files[0].name);
                this.Parent.HandleFiles(e.target.files);                
            }
        }
    }
};

if (window.TK.Form) {
    window.TK.Form.DefaultTemplates.image = {
        _: TK.ImageEditor
    };
}

if (window.TK.HtmlEditor) {
    window.TK.HtmlEditor.ButtonTemplates.InsertImage = {
        innerHTML: Svg.Icons.Image,
        title: "Insert image",
        onmousedown: function () {
            var randId = "img" + new Date().getTime();
            var html = "<img id=\"" + randId + "\" style=\"max-width: 100%;\" />";
            this.Near("Editor").focus();
            document.execCommand("insertHTML", false, html);            

            var img = document.getElementById(randId);
            if (img) {
                var tempEditor = TK.Initialize({
                    _: TK.ImageEditor,
                    style: { display: "none" },
                    onchange: function () {
                        var dataUrl = this.GetValue();
                        if (dataUrl) {
                            img.src = dataUrl;
                        }
                    }
                });
                tempEditor.Elements.FileUploadField.click();
            }
        }
    };
}