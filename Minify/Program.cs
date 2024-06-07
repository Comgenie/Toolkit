using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Minify
{
    class Program
    {
        static void Main(string[] args)
        {
            Generate(@"..\..\..\Toolkit\Framework\", @"..\..\..\Toolkit\Minified\Toolkit.js", @"..\..\..\Toolkit\Minified\Svg.js", true, false);
            Generate(@"..\..\..\Toolkit\Framework\", @"..\..\..\Toolkit\Minified\ToolkitFull.js", @"..\..\..\Toolkit\Minified\Svg.js", true, true);
        }
        static void Generate(string pathToSource, string pathToResult, string pathToResultSvg, bool embedSvg, bool includeAll=false)
        {            
            /*string PathToSource = @"..\..\..\Toolkit\Framework\";
            string PathToResult = @"..\..\..\Toolkit\Minified\Toolkit.js";
            string PathToResultSvg = @"..\..\..\Toolkit\Minified\Svg.js";
            bool embedSvg = true;*/


            var files = Directory.GetFiles(pathToSource);

            var sourceFiles = new List<SourceFile>();
            StringBuilder sb = new StringBuilder();
            sb.AppendLine("/* Minify Order(50) */");
            sb.AppendLine("if (!window.Svg) { window.Svg = {}; }");
            var hadSvg = false;


            foreach (var file in files) {
                var data = File.ReadAllText(file);
                if (file.EndsWith(".svg"))
                {
                    data = data.Replace(" xmlns:serif=\"http://www.serif.com/\"", "");

                    var svgStart = data.IndexOf("<svg");
                    var svgEnd = data.IndexOf(">", svgStart) + 1;
                    var svgStartElement = data.Substring(svgStart, svgEnd - svgStart);

                    // Extract all groups and save them as javascript strings.
                    var name = file.Substring(file.LastIndexOf(Path.DirectorySeparatorChar)+1).Replace(".svg", "").Replace(" ", "_").Replace(".", "_");
                    sb.AppendLine("var s=\"" + svgStartElement.Replace("\"", "\\\"") + "\";");
                    sb.AppendLine("window.Svg[\""+name+"\"]={");

                    var posLastId = 0;
                    while (true)
                    {
                        var posName = data.IndexOf("id=\"", posLastId + 1);

                        if (posName <= 0)
                            break;
                        posLastId = posName;
                        hadSvg = true;

                        var groupName = data.Substring(posName + 4,100);
                        groupName = groupName.Substring(0, groupName.IndexOf("\""));


                        for (; posName > 0 && data[posName] != '<'; posName--) { }

                        var posEnd = posName;
                        var levels = 0;
                        for (; posEnd < data.Length; posEnd++)
                        {
                            var c = data[posEnd];
                            if (c == '<')
                            {
                                if (data[posEnd + 1] == '/')
                                    levels -= 1;
                                else
                                    levels += 1;
                            }
                            else if (c == '/' && data[posEnd + 1] == '>')
                            {
                                levels -= 1;
                            }
                            else if (c == '>' && levels == 0)
                            {
                                break;
                            }
                        }

                        if (posEnd == data.Length)
                            break;

                        posEnd++;

                        var posDefs = data.IndexOf("<defs>");
                        var posEndDefs = 0;
                        if (posDefs > 0)
                            posEndDefs = data.IndexOf("</defs>", posDefs) + 7;

                        //console.log(response.substr(posName, posEnd - posName));
                        var tmp =  data.Substring(posName, posEnd - posName) + (posEndDefs < 9 ? "" : data.Substring(posDefs, posEndDefs - posDefs)) + "</svg>";
                        sb.AppendLine("\"" + groupName + "\":s+\""+ tmp.Replace("\"", "\\\"").Replace("\r","").Replace("\n","") +"\",");
                    }
                    sb.Append("};");

                    continue;
                }
                else if (!file.EndsWith(".js"))
                {
                    continue;
                }
                var sourceFile = new SourceFile()
                {
                    Source = data,
                    Order = 100
                };

                // Check if there is a /* Minify Order(123) */ header, so we know what order to use
                if (sourceFile.Source.Contains("/* Minify Skip") && !includeAll)
                    continue;

                var order = sourceFile.Source.IndexOf("/* Minify Order(");
                if (order >= 0)
                {
                    var sourceOrderHeader = sourceFile.Source.Substring(order + 16, 5);
                    if (sourceOrderHeader.Contains(")"))
                    {
                        sourceOrderHeader = sourceOrderHeader.Substring(0, sourceOrderHeader.IndexOf(")")).Trim();
                        if (Int32.TryParse(sourceOrderHeader, out order)) // Reusing variable because why not
                        {
                            sourceFile.Order = order;
                        }
                    }
                    else
                    {
                        Console.WriteLine("Error in minify order header");
                    }                    
                }

                sourceFiles.Add(sourceFile);
            }

            if (hadSvg)
            {
                File.WriteAllText(pathToResultSvg, sb.ToString());
                if (embedSvg)
                {
                    sourceFiles.Add(new SourceFile()
                    {
                        Source = sb.ToString(),
                        Order = 50
                    });
                }
            }

            StringBuilder result = new StringBuilder();
            foreach (var file in sourceFiles.OrderBy(a=>a.Order))
            {
                result.Append(file.Source);
            }

            File.WriteAllText(pathToResult + ".txt", result.ToString()); // Not minified

            using (var reader = new StringReader(result.ToString()))
            {
                var resultMinified = new JsMin().Minify(reader);
                File.WriteAllText(pathToResult, resultMinified);
            }
                
        }
    }
    class SourceFile
    {
        public string Source { get; set; }
        public int Order { get; set; }
    }
}
