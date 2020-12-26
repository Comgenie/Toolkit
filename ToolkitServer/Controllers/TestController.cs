using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.WebSockets;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ToolkitServer.Controllers
{
    /// <summary>
    /// Used for the Server Channel/Storage on the toolkit example page
    /// </summary>
    [ApiController]
    [Route("{controller}/{action}")]
    public class TestController : ControllerBase
    {
        [HttpGet]
        public async Task<JsonResult> Identity(string clientId)
        {
            if (clientId == "SecretCodeForAlice")
            {
                return new JsonResult(
                    new IdentityHandler.IdentityData()
                    {
                        allowChannelReceive = true,
                        allowChannelSend = false,
                        allowFileDelete = false,
                        allowFileList = true,
                        allowFileRead = true,
                        allowFileWrite = false,
                        publicIdentifier = "Alice"
                    }
                );
            }
            else if (clientId == "SecretCodeForBob")
            {
                return new JsonResult(
                    new IdentityHandler.IdentityData()
                    {
                        allowChannelReceive = true,
                        allowChannelSend = true,
                        allowFileDelete = true,
                        allowFileList = true,
                        allowFileRead = true,
                        allowFileWrite = true,
                        publicIdentifier = "Bob"
                    }
                );
            }

            Response.StatusCode = 403;
            return new JsonResult("User not found");
        }
    }

   
    
    
}
