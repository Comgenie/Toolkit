using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.HttpsPolicy;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using ToolkitServer.Controllers;

namespace ToolkitServer
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public static IConfiguration Configuration { set; get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {            
            services.AddControllers();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            app.Use((context, next) =>
            {
                context.Response.Headers["Access-Control-Allow-Origin"] = "*";
                return next.Invoke();
            });
            app.UseCors(builder => builder
                .AllowAnyOrigin()
                .AllowAnyMethod()
                .AllowAnyHeader());

            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            app.UseHttpsRedirection();
            
            app.UseRouting();

            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });


            var webSocketOptions = new WebSocketOptions()
            {
                KeepAliveInterval = TimeSpan.FromSeconds(120),
                ReceiveBufferSize = 4 * 1024
            };
            webSocketOptions.AllowedOrigins.Add("*");

            app.UseWebSockets(webSocketOptions);

            app.Use(async (context, next) =>
            {
                if (context.Request.Path == "/ws")
                {
                    if (context.WebSockets.IsWebSocketRequest)
                    {
                        WebSocket webSocket = await context.WebSockets.AcceptWebSocketAsync();
                        await ProcessClientMessages(context, webSocket);
                    }
                    else
                    {
                        context.Response.StatusCode = 400;
                    }
                }
                else
                {
                    await next();
                }
            });
            ChannelHub.StartCleanupThread();
        }
        private async Task<(WebSocketReceiveResult, IEnumerable<byte>)> ReceiveFullMessage(WebSocket socket, CancellationToken cancelToken)
        {
            WebSocketReceiveResult response;
            var message = new List<byte>();

            var buffer = new byte[4096];
            do
            {
                response = await socket.ReceiveAsync(new ArraySegment<byte>(buffer), cancelToken);
                if (response.CloseStatus.HasValue)
                    return (null, null);

                message.AddRange(new ArraySegment<byte>(buffer, 0, response.Count));

                if (buffer.Length > 1024 * 32)
                    return (null, null);
            } while (!response.EndOfMessage);

            return (response, message);
        }

        private async Task HandleClientMessage(ChannelHub.ConnectedClient cc, string command, string payload)
        {
            if (command == "ID") // Set client Id           
                cc.ClientId = payload;
            else if (command == "JOIN")
                await ChannelHub.AddClientToChannelAsync(cc, payload);
            else if (command == "LEAVE")
                ChannelHub.RemoveClientFromChannel(cc, payload);
            else if (command == "MSG")
            {
                var messageData = System.Text.Json.JsonSerializer.Deserialize<ChannelHub.CommandMessageData>(payload);
                if (messageData != null)
                    ChannelHub.SendMessageFromClientToChannel(cc, messageData.Channel, messageData.Data);
            }
        }
        private async Task ProcessClientMessages(HttpContext context, WebSocket webSocket)
        {
            var cc = new ChannelHub.ConnectedClient()
            {
                WebSocketClient = webSocket,
                Channels = new List<string>(),
                ClientId = null,
                BufferedData = new List<byte>(),
                SendingData = false
            };
            
            var message = await ReceiveFullMessage(webSocket, CancellationToken.None);
            WebSocketReceiveResult result = message.Item1;
            
            while (result != null && !result.CloseStatus.HasValue)
            {
                // Process message
                // Command syntax: Command|Length payload|Payload
                
                if (result.MessageType == WebSocketMessageType.Text)
                {
                    var data = ASCIIEncoding.UTF8.GetString(message.Item2.ToArray());
                    var dataLeft = data.Length;
                    while (dataLeft > 0) {
                        var indexOfSeperator = data.IndexOf("|");
                        if (indexOfSeperator <= 0)
                            break; // No first separator
                        var command = data.Substring(0, indexOfSeperator);

                        var indexOfSecondSeperator = data.IndexOf("|", indexOfSeperator + 1);
                        if (indexOfSecondSeperator <= 0)
                            break; // No second separator

                        if (!Int32.TryParse(data.Substring(indexOfSeperator + 1, indexOfSecondSeperator - (indexOfSeperator + 1)), out var dataLength))
                            break; // Message length is not a number

                        var indexEndOfMessage = dataLength + indexOfSeperator + 1;
                        if (data.Length < indexEndOfMessage)
                            break; // Payload part is smaller than what the header is saying

                        await HandleClientMessage(cc, command, data.Substring(indexOfSecondSeperator + 1, dataLength));

                        data = data.Substring(indexEndOfMessage);
                    }

                }
                message = await ReceiveFullMessage(webSocket, CancellationToken.None);
                result = message.Item1;
            }
            if (result == null)
                await webSocket.CloseAsync(WebSocketCloseStatus.MessageTooBig, "Buffer full", CancellationToken.None);
            else
                await webSocket.CloseAsync(result.CloseStatus.Value, result.CloseStatusDescription, CancellationToken.None);

            List<string> unsubChannels = null;
            lock (cc.Channels)
                unsubChannels = cc.Channels.ToList();

            foreach (var channel in unsubChannels)
                ChannelHub.RemoveClientFromChannel(cc, channel);
            
        }
    }
}
