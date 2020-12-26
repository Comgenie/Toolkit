"use strict";
/* Minify Skip */
/* Minify Order(100) */

// Component to send and receive messages in a public channel, this will try to use WebSockets or fall back to https requests to the toolkit api
TK.ServerChannel = {
    _: "component",
    Channels: [],
    ClientId: "Client" + (Math.random() * 100000), // Not visible for other connected client    
    Receive: function (channel, identity, data) { },    

    Connection: null,

    Init: function () {
        if (!TK.ServerChannel.Connections)
            TK.ServerChannel.Connections = {};
        if (!TK.ServerChannel.Connections[this.ClientId]) {
            // Create connection            
            TK.ServerChannel.Connections[this.ClientId] = TK.Initialize({
                _: TK.ServerChannelConnection,
                ClientId: this.ClientId,
                Channels: this.Channels.slice(0),
                UsedBy: [this],
                Receive: function (channel, identity, data) {
                    for (var i = 0; i < this.UsedBy.length; i++) {
                        if (this.UsedBy[i].Channels.indexOf(channel) >= 0)
                            this.UsedBy[i].Receive(channel, identity, data);
                    }
                }
            });
        } else {
            // Use existing connection
            TK.ServerChannel.Connections[this.ClientId].UsedBy.push(this);
            for (var i = 0; i < this.Channels.length; i++) {
                TK.ServerChannel.Connections[this.ClientId].AddChannel(this.Channels[i]);
            }
        }
        this.Connection = TK.ServerChannel.Connections[this.ClientId];
    },
    Destroy: function () {
        while (this.Channels.length > 0)
            this.RemoveChannel(this.Channels[0]);
        this.Connection.UsedBy.splice(this.Connection.UsedBy.indexOf(this), 1);
        if (this.Connection.UsedBy.length == 0)
            this.Connection.Remove();
    },
    Send: function (channel, data) {
        this.Connection.Send(channel, data);
    },
    AddChannel: function (channel) {        
        if (this.Channels.indexOf(channel) >= 0)
            return;
        this.Channels.push(channel);
        this.Connection.AddChannel(channel);
    },
    RemoveChannel: function (channel) {
        if (this.Channels.indexOf(channel) < 0)
            return;
        this.Channels.splice(this.Channels.indexOf(channel), 1);

        // Check if used by other ServerChannel objects
        for (var i = 0; i < this.Connection.UsedBy.length; i++) {
            if (this.Connection.UsedBy[i].Channels.indexOf(channel) >= 0)
                return;
        }

        // Not used anymore, leave channel
        this.Connection.RemoveChannel(channel);
    }
};


// Shared component, this will be used by (multiple) TK.ServerChannel objects
TK.ServerChannelConnection = {
    _: "component",
    Channels: [],
    ClientId: null, // Not visible for other connected client    
    UrlFallback: "https://toolkitapi.comgenie.com/Channel/Communicate",
    UrlWebsocket: "wss://toolkitapi.comgenie.com/ws",
    FallbackInterval: 5000,
    Receive: function (channel, identity, data) { },
    ChannelIndexes: [], // used internally for fallback method    

    Init: function () {
        if (this.ClientId == null)
            return;
        
        if (this.UrlWebsocket)
            this.CreateWebsocket();
        else
            this.CreateFallback();
    },
    Destroy: function () {
        // Disconnect communication
        if (this.WebSocket)
            this.WebSocket.close();
        
        if (this.FallBackTimeout) {
            
            clearTimeout(this.FallBackTimeout);
            this.FallBackTimeout = null;
        }
    },
    CreateWebsocket: function () {
        var obj = this;
        var webSocket = new WebSocket(this.UrlWebsocket);
        webSocket.SendData = function (command, data) {
            //console.log("Send data: " + command, data);
            this.send(command + "|" + data.length + "|" + data);
        };
        webSocket.onopen = function (eventData) {
            //console.log("WS Open", eventData);
            obj.WebSocket = this;
            this.SendData("ID", obj.ClientId);
            for (var i = 0; i < obj.Channels.length; i++)
                this.SendData("JOIN", obj.Channels[i]);
        };
        webSocket.onmessage = function (eventData) {
            if (!eventData.data.substr)
                return;

            //console.log("WS Receive", eventData.data);
            var firstSeperator = eventData.data.indexOf("|");
            if (firstSeperator < 0)
                return;
            var secondSeperator = eventData.data.indexOf("|", firstSeperator + 1);
            if (secondSeperator < 0)
                return;
            var command = eventData.data.substr(0, firstSeperator);
            var dataLength = eventData.data.substring(secondSeperator + 1, secondSeperator);
            var payload = eventData.data.substr(secondSeperator + 1);
            if (command == "MSG") {
                var msg = JSON.parse(payload);
                console.log(msg);
                obj.Receive(msg.Channel, msg.Identity, msg.Data);
            }
        };
        webSocket.onerror = function (eventData) {
            // Couldn't connect            
            //console.log("WS Error", eventData);
            obj.CreateFallback();
        };
        webSocket.onclose = function (eventData) {
            // Disconnected
            //console.log("WS Close", eventData)
            obj.CreateFallback();
        };
    },
    CreateFallback: function () {
        console.log("Using fallback");
        this.WebSocket = null; // TODO: See if we can reconnect 
        this.SendFallBack(null, null); // Send first check message, this activates the interval as well
    },
    AddChannel: function (channel) {
        if (this.Channels.indexOf(channel) >= 0)
            return;

        this.Channels.push(channel);
        this.ChannelIndexes.push(-1);

        if (this.WebSocket)
            this.WebSocket.SendData("JOIN", channel);
    },
    RemoveChannel: function (channel) {
        var channelIndex = this.Channels.indexOf(channel);
        if (channelIndex < 0)
            return;
        this.Channels.splice(channelIndex, 1);
        this.ChannelIndexes.splice(channelIndex, 1);

        if (this.WebSocket)
            this.WebSocket.SendData("LEAVE", channel);
    },
    SendFallBack: function (channel, data) {
        
        if (this.FallBackTimeout) {
            clearTimeout(this.FallBackTimeout);
            this.FallBackTimeout = null;
        }

        var obj = this;
        var channelsArr = [];
        var indexesArr = [];
        for (var i = 0; i < this.Channels.length; i++) {
            channelsArr.push(this.Channels[i]);
            indexesArr.push(this.ChannelIndexes[i] !== undefined ? this.ChannelIndexes[i] : -1);
        }

        Ajax.do(this.UrlFallback, { clientId: this.ClientId, channels: channelsArr, indexes: indexesArr, sendChannel: channel, sendData: data }, function (responseObj) {
            //console.log("Fallback response", responseObj);
            for (var i = 0; i < responseObj.length; i++) {
                if (!responseObj[i].channel)
                    continue;
                var arrChannelIndex = obj.Channels.indexOf(responseObj[i].channel);
                if (arrChannelIndex < 0) // Unsubscribed before callback was received
                    continue;

                for (var j = 0; j < responseObj[i].messages.length; j++) {
                    obj.Receive(responseObj[i].channel, responseObj[i].messages[j].identity, responseObj[i].messages[j].data);
                }

                // Update our index so we can prevent double-messages
                if (responseObj[i].index != 0)
                    obj.ChannelIndexes[arrChannelIndex] = responseObj[i].index;
            }
        });

        this.FallBackTimeout = setTimeout(function () {
            obj.SendFallBack(null, null);
        }, this.FallbackInterval);
    },
    Send: function (channel, data) {        
        if (this.WebSocket)
            this.WebSocket.SendData("MSG", JSON.stringify({ Channel: channel, Data: data }));
        else if (this.UrlFallback)
            this.SendFallBack(channel, data);       
    }
};