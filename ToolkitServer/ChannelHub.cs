using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.WebSockets;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;

namespace ToolkitServer
{
    // TODO: Move this to a seperate C server application, this is just to have some working initial prototype
    public class ChannelHub
    {
        public const int MaxMessageBuffer = 100;
        private static Dictionary<string, InternalChannel> Channels = new Dictionary<string, InternalChannel>();
        

        public static async Task<List<ChannelData>> GetMessagesSinceEpochAsync(string clientId, string[] channels, long[] indexes)
        {
            var tasks = new List<Task<ChannelData>>();
            for (var i = 0; i < channels.Length; i++)
                tasks.Add(GetMessagesForChannelSinceIndexAsync(clientId, channels[i], i < indexes.Length ? indexes[i] : 0));

            await Task.WhenAll(tasks);
            
            var list = tasks.Where(a => a.Result != null).Select(a => a.Result).ToList();                
            return list;
        }

        public static async Task<ChannelData> GetMessagesForChannelSinceIndexAsync(string clientId, string channel, long index)
        {
            // If Channel starts with https:// , use the clientId to request the identity from the url
            IdentityHandler.InternalIdentity identity = null;
            if (channel.StartsWith("https://") || channel.StartsWith("http://"))
            {
                identity = await IdentityHandler.GetIdentityAsync(clientId, channel);
                if (identity == null)
                    return null;
            }

            InternalChannel internalChannel = null;
            lock (Channels)
            {
                if (!Channels.ContainsKey(channel))
                    return null;
                internalChannel = Channels[channel];
            }

            var container = new ChannelData()
            {
                Channel = channel
            };

            if (identity != null && !identity.Data.allowChannelReceive) // Check if we are allowed to receive messages
            {
                container.Messages = new List<ChannelMessageData>();
                return container;
            }

            if (index == -1) // On the first request from the client (index == -1), we will only give back at what position we are. 
            {
                container.Index = internalChannel.CurIndex;
                container.Messages = new List<ChannelMessageData>();
                return container;
            }

            // Find out count to pre-allocate the memory space before going into our locked section
            var count = internalChannel.CurIndex - index;
            if (count > MaxMessageBuffer)
                count = MaxMessageBuffer;
            if (count <= 0)
            {
                container.Messages = new List<ChannelMessageData>();
                container.Index = internalChannel.CurIndex;
                return container;
            }
            container.Messages = new List<ChannelMessageData>((int)count);

            lock (internalChannel.Messages)
            {
                // In case the CurIndex is changed before we got the lock
                container.Index = internalChannel.CurIndex;
                count = internalChannel.CurIndex - index;
                if (count > MaxMessageBuffer || count < 0)
                    count = MaxMessageBuffer;

                for (var i = internalChannel.CurIndex - count; i < internalChannel.CurIndex; i++)
                {
                    var arrayIndex = i % MaxMessageBuffer;
                    var messageObj = internalChannel.Messages[(int)arrayIndex];
                    if (messageObj.ClientId == clientId)
                        continue;
                    container.Messages.Add(messageObj);
                }
            }
            return container;
        }

        public static async Task SendMessageAsync(string clientId, string channel, string data, ConnectedClient filterClient=null)
        {
            if (data.Length > 1024 * 4)
                return;

            // If Channel starts with https:// , use the clientId to request the identity from the url
            IdentityHandler.InternalIdentity identity = null;
            if (channel.StartsWith("https://") || channel.StartsWith("http://"))
            {
                identity = await IdentityHandler.GetIdentityAsync(clientId, channel);
                if (identity == null || !identity.Data.allowChannelSend)
                    return;
                
            }

            // Add to channel message hub
            InternalChannel internalChannel = null;
            lock (Channels)
            {
                if (!Channels.ContainsKey(channel))
                {
                    Channels.Add(channel, new InternalChannel()
                    {
                        Channel = channel,
                        LastMessage = DateTime.UtcNow,
                        Messages = new ChannelMessageData[MaxMessageBuffer],
                        CurIndex = 0,
                        Clients = new List<ConnectedClient>()
                    });
                }
                internalChannel = Channels[channel];

            }
            var message = new ChannelMessageData()
            {
                Data = data,
                Identity = identity,
                ClientId = clientId
            };

            lock (internalChannel.Messages)
            {
                var arrayIndex = internalChannel.CurIndex % MaxMessageBuffer;
                internalChannel.Messages[arrayIndex] = message;
                internalChannel.CurIndex++;
                internalChannel.LastMessage = DateTime.UtcNow;
            }

            // Broadcast to all websocket connected clients 
            List<ConnectedClient> clients = null;
            lock (internalChannel.Clients)
                clients = internalChannel.Clients.Where(a => (filterClient != null && a != filterClient) || (filterClient == null && a.ClientId != clientId)).ToList();

            if (clients.Count > 0)
            {
                var json = System.Text.Json.JsonSerializer.Serialize(new CommandMessageData()
                {
                    Channel = channel,
                    Identity = identity?.Data?.publicIdentifier,
                    Data = data
                });

                var dataBytes = System.Text.ASCIIEncoding.UTF8.GetBytes("MSG|" + json.Length + "|" + json); // MSG = 'Channel Message' Command Type 
                foreach (var client in clients)
                {
                    _ = client.SendDataAsync(dataBytes);
                }
            }
        }

        /// Websocket methods
        public static async Task AddClientToChannelAsync(ConnectedClient ws, string channel)
        {
            if (ws.Channels.Contains(channel))
                return;

            IdentityHandler.InternalIdentity identity = null;
            if (channel.StartsWith("https://") || channel.StartsWith("http://"))
            {
                // Check if this client is allowed to join this channel
                identity = await IdentityHandler.GetIdentityAsync(ws.ClientId, channel);
                if (identity == null)
                    return;
            }

            InternalChannel internalChannel = null;
            lock (Channels)
            {
                if (!Channels.ContainsKey(channel))
                {
                    Channels.Add(channel, new InternalChannel()
                    {
                        Channel = channel,
                        LastMessage = DateTime.UtcNow,
                        Messages = new ChannelMessageData[MaxMessageBuffer],
                        CurIndex = 0,
                        Clients = new List<ConnectedClient>()
                    });
                }
                internalChannel = Channels[channel];
            }
            lock (internalChannel.Clients)
                internalChannel.Clients.Add(ws);
            ws.Channels.Add(channel);
        }

        public static void RemoveClientFromChannel(ConnectedClient ws, string channel)
        {
            if (!ws.Channels.Contains(channel))
                return;
            InternalChannel internalChannel = null;
            lock (Channels)
            {
                if (!Channels.ContainsKey(channel))
                    return;
                internalChannel = Channels[channel];
            }

            lock (internalChannel.Clients)
                internalChannel.Clients.Remove(ws);
            ws.Channels.Remove(channel);
        }

        public static void SendMessageFromClientToChannel(ConnectedClient ws, string channel, string data)
        {
            if (!ws.Channels.Contains(channel))
                return;
            _ = SendMessageAsync(ws.ClientId, channel, data, ws);
        }

        private static Thread CleanUpThread = null;
        private static bool CleanUpThreadRunning = false;
        public static void StartCleanupThread()
        {
            if (CleanUpThread != null)
                return;
            CleanUpThreadRunning = true;
            CleanUpThread = new Thread(new ThreadStart(() =>
            {
                while (CleanUpThreadRunning)
                {
                    lock (Channels)
                    {
                        var channelsToRemove = Channels.Where(a => a.Value.LastMessage < DateTime.UtcNow.AddMinutes(-5) && a.Value.Clients.Count == 0).Select(a => a.Key).ToList();
                        foreach (var channel in channelsToRemove)
                            Channels.Remove(channel);
                    }
                    for (var i=0;i<300 && CleanUpThreadRunning; i++)
                        Thread.Sleep(1000);
                }
            }));
            CleanUpThread.Start();
            
        }
        public static void StopCleanupThread()
        {
            if (CleanUpThread == null)
                return;
            CleanUpThreadRunning = false;
            CleanUpThread.Join();
            CleanUpThread = null;

        }

        public class ChannelData
        {
            public string Channel { get; set; }
            public List<ChannelMessageData> Messages { get; set; }
            public long Index { get; set; }
        }

        public class CommandMessageData
        {
            public string Channel { get; set; }
            public string Data { get; set; }
            public string Identity { get; set; }
        }

        public class InternalChannel
        {
            public string Channel { get; set; }
            public ChannelMessageData[] Messages { get; set; } // Ringbuffer with data
            public long CurIndex { get; set; }
            public DateTime LastMessage { get; set; }
            public List<ConnectedClient> Clients { get; set; }
        }

        public struct ChannelMessageData
        {
            [JsonIgnore]
            public string ClientId { get; set; }
            [JsonIgnore]
            public IdentityHandler.InternalIdentity Identity { get; set; } // Public identity
            public string IdentityName
            {
                get
                {
                    return Identity?.Data?.publicIdentifier;
                }
            }
            public string Data { get; set; }
        }


        public class ConnectedClient
        {
            public string ClientId { get; set; }
            public WebSocket WebSocketClient { get; set; }
            public List<string> Channels { get; set; }

            public bool SendingData { get; set; }
            public List<byte> BufferedData { get; set; }
            public async Task SendDataAsync(byte[] data)
            {
                // Apparently we can't execute SendAsync while there is another one in progress            
                lock (this)
                {
                    if (SendingData)
                    {
                        // Keep an internal buffer 
                        lock (BufferedData)
                            BufferedData.AddRange(data);
                        return;
                    }
                    SendingData = true;
                }

                while (data != null)
                {
                    await WebSocketClient.SendAsync(new ArraySegment<byte>(data), WebSocketMessageType.Text, true, System.Threading.CancellationToken.None);
                    data = null;
                    lock (BufferedData)
                    {
                        if (BufferedData.Count > 0)
                        {
                            data = BufferedData.ToArray();
                            BufferedData.Clear();
                        }
                    }
                }
                SendingData = false;
            }
        }
    }
}
