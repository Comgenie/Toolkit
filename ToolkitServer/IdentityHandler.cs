using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace ToolkitServer
{
    public class IdentityHandler
    {
        private static Dictionary<string, InternalIdentity> Identities = new Dictionary<string, InternalIdentity>();
        public static async Task<InternalIdentity> GetIdentityAsync(string clientId, string channel)
        {
            if (channel == null)
                return null;
            var identityKey = channel.ToLower() + "::" + clientId;
            InternalIdentity identity = null;
            lock (Identities)
            {
                if (Identities.ContainsKey(identityKey))
                    return Identities[identityKey];
            }

            // Retrieve
            if (identity == null || identity.LastRetrieved.AddMinutes(30) < DateTime.UtcNow)
            {
                try
                {
                    using (var wc = new WebClientWithTimeout())
                    {
                        wc.TimeOutInSeconds = 10;

                        // Prevent downloading too much as we only accept a small identity data payload
                        long totalBytesReceived = 0;
                        wc.DownloadProgressChanged += (wcObj, eventArgs) =>
                        {
                            totalBytesReceived += eventArgs.BytesReceived;
                            if (totalBytesReceived > 1024 * 10)
                                wc.CancelAsync();
                        };

                        
                        var identityData = await wc.DownloadStringTaskAsync(new Uri(channel + (channel.Contains("?") ? "&" : "?") + "clientId=" + WebUtility.UrlEncode(clientId)));
                        if (!string.IsNullOrEmpty(identityData) && identityData.Length <= 1024 && identityData.StartsWith("{") && identityData.EndsWith("}")) 
                        {
                            var identityDataObj = System.Text.Json.JsonSerializer.Deserialize<IdentityData>(identityData);
                            if (string.IsNullOrEmpty(identityDataObj.publicIdentifier))
                                throw new Exception("No or incorrect PublicIdentifier");
                            identity = new InternalIdentity()
                            {
                                LastRetrieved = DateTime.UtcNow,
                                Data = identityDataObj
                            };

                            lock (Identities)
                            {
                                if (!Identities.ContainsKey(identityKey))
                                    Identities.Add(identityKey, identity);
                                else
                                    Identities[identityKey] = identity;
                            }
                            return identity;
                            
                        }
                        else
                        {
                            throw new Exception("No or incorrect identity data");
                        }
                    }
                }
                catch (Exception)
                {
                    return null; // Could not retrieve any identity data
                }
            }
            return null;
        }

        public class InternalIdentity
        {
            public IdentityData Data { get; set; }
            public DateTime LastRetrieved { get; set; }
        }
        public class IdentityData
        {
            public string publicIdentifier { get; set; }

            // Permissions
            public bool allowChannelSend { get; set; }
            public bool allowChannelReceive { get; set; }
            public bool allowFileRead { get; set; }
            public bool allowFileWrite { get; set; }            
            public bool allowFileDelete { get; set; }
            public bool allowFileList { get; set; }
        }
    }

    public class WebClientWithTimeout : WebClient
    {
        public int TimeOutInSeconds = 60;
        protected override WebRequest GetWebRequest(Uri address)
        {
            var req = base.GetWebRequest(address);
            req.Timeout = TimeOutInSeconds * 1000;
            return req;
        }
    }
}
