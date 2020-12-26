"use strict";
window.TK.Event = {
    _: "component",
    Subscribe: [],
    Init: function () {
        if (!window.TK.EventHandlers) {
            window.TK.EventHandlers = [];
        }
        window.TK.EventHandlers.push(this);
    },
    Destroy: function () {
        var i = window.TK.EventHandlers.indexOf(this);
        if (i >= 0) {
            window.TK.EventHandlers.splice(i, 1);
        }
    },
    Send: function (eventType, eventData) {
        for (var i = 0; i < window.TK.EventHandlers.length; i++) {
            if (window.TK.EventHandlers[i].Subscribe.indexOf(eventType) >= 0) {
                window.TK.EventHandlers[i].Receive(eventType, eventData);
            }
        }
    },
    Receive: function (eventType, eventData) { /* Callback */ }
};