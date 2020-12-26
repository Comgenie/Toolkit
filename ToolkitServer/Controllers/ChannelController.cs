using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.WebSockets;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace ToolkitServer.Controllers
{
    /// <summary>
    /// The TK.ServerChannel component will connect to a channel using Websockets or Ajax calls and broadcast any received message to TK.Event
    /// </summary>
    [ApiController]
    [Route("{controller}/{action}")]
    public class ChannelController : ControllerBase
    {
        [HttpGet]
        public async Task<JsonResult> Communicate(string clientId, string channels=null, string indexes=null, string sendChannel=null, string sendData=null)
        {
            if (sendChannel != null && sendData != null)
                _ = ChannelHub.SendMessageAsync(clientId, sendChannel, sendData);

            if (channels == null)
                return new JsonResult(new List<object>());
            
            if (indexes == null)
                indexes = "0";
            var channelData = await ChannelHub.GetMessagesSinceEpochAsync(clientId, channels.Split('|'), indexes.Split('|').Select(a => long.Parse(indexes)).ToArray());            
            return new JsonResult(channelData);
        }

        [HttpPost]
        public async Task<JsonResult> Communicate([FromBody]CommunicateData data)
        {
            if (data == null)
                return new JsonResult("Error");

            // Receive all messages since epoch, and optionally send data 
            if (data.SendChannel != null && data.SendData != null)
                _ = ChannelHub.SendMessageAsync(data.ClientId, data.SendChannel, data.SendData);

            if (data.Channels == null)
                return new JsonResult(new List<object>());

            var channelData = await ChannelHub.GetMessagesSinceEpochAsync(data.ClientId, data.Channels, data.Indexes);
            return new JsonResult(channelData);
        }

        public class CommunicateData
        {
            public string ClientId { get; set; }
            public string[] Channels { get; set; }
            public long[] Indexes { get; set; }
            public string SendChannel { get; set; }
            public string SendData { get; set; }
        }

        
    }
    
    
}
