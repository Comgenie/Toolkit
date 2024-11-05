"use strict";
/* Minify Order(110) */
// TODO: Support for moment.js, country code: moment.tz.zone(timeZone).abbr(timeZoneOffset);
window.TK.DateTime = {
    _: "div",    
    className: "toolkitDateTime",    
    MonthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    EnableTime: true,
    EnableTimeZone: true,
    EnableRelative: false,
    TimeZone: "Local", // UTC, Local
    UseGlobalTimeZone: true, // If true, the time zone will be based on the static TK.DateTime.TimeZone , and not this instance
    AlwaysNavigateToStartOfDay: false, // When set to true, selecting a day will always set time to 00:00, even if there was already a value or the day is today
    WeekStart: 1, // 0 Sunday, 1 Monday
    ValueIsEpoch: false,
    Data: null,
    onchange: function () { },
    readOnly: false,
    disabled: false,
    DisplayCodes: {
        EuropeAmsterdam: "NL",
        EuropeParis: "FR",
        EuropeLondon: "UK",
        EuropeDublin: "IE",
        EuropeLuxembourg: "LU",
        EuropeBerlin: "DE",
        EuropeBrussels: "BR",
        EuropeOslo: "NO",
        EuropeStockholm: "SE",
        AsiaTokyo: "JP",        
    },
    
    Init: function () {
        if (this.DataSettings) {
            var fields = ["ValueIsEpoch", "EnableTime", "EnableTimeZone", "EnableRelative", "TimeZone", "WeekStart", "UseGlobalTimeZone"];
            for (var i = 0; i < fields.length; i++) {
                if (this.DataSettings[fields[i]] !== undefined)
                    this[fields[i]] = this.DataSettings[fields[i]];
            }
        }
        if (this.EnableRelative && this.Data == "now") {
            this.Data = "|";
        }
        if (!this.EnableTimeZone) {
            this.UseGlobalTimeZone = false;
            this.TimeZone = "UTC";
        }

        if (this.ValueIsEpoch && this.Data && (!this.Data.indexOf || this.Data == parseInt(this.Data).toString()))
        {
            this.Data = new Date(parseInt(this.Data) * 1000).toISOString();
        }
        this.RenderDateInput(this.Elements.Selection, this.Data);
        this.RefreshDateInput(true);
        this.Elements.DateInputContainer.Elements.TimeZoneInfo.style.display = (this.EnableTimeZone ? "" : "none");
    },
    GetValue: function () {
        var isoDate = this.Data;
        if (this.EnableRelative && isoDate && isoDate.indexOf && isoDate.indexOf("|") >= 0) {
            return isoDate;
        }

        if (this.ValueIsEpoch) {
            return Math.floor(new Date(isoDate).getTime() / 1000);
        }
        if (this.EnableTime)
            return isoDate;    
        
        if (!isoDate)
            return null;
        
        var dateObj = new Date(isoDate);

        if (this.GetTimeZone() == "UTC") {
            dateObj.setUTCHours(0);
            dateObj.setUTCMinutes(0);
            dateObj.setUTCSeconds(0);
        } else if (this.GetTimeZone() == "Local") {
            dateObj.setHours(0);
            dateObj.setMinutes(0);
            dateObj.setSeconds(0);            
        } else {
            // TODO
        }
        
        return dateObj.toISOString();
    },
    Elements: {
        DateInputContainer: {
            className: "dateTimeContainer",
            Elements: {
                TimeZoneInfo: {
                    className: "timeZoneInfo",
                    onclick: function () {
                        this.Parent.Parent.SetTimeZone(this.Parent.Parent.GetTimeZone() == "UTC" ? "Local" : "UTC");
                        this.Parent.Elements.DateInput.focus();
                    }
                }, 
                DateInput: {
                    onkeyup: function () {
                        if (this.value == "") {
                            this.className = "";
                            this.Parent.Parent.Data = null;
                            return;
                        }
                        var v = this.value.replace(/\\/g, "-").replace(/\//g, "-").replace(/T/g, " ").replace(/\.000/g, "").replace(/Z/g, "");
                        
                        var parts = v.split(" ");
                        var dParts = parts[0].split("-");
                        var tParts = [];
                        if (parts.length > 1)
                            tParts = parts[1].split(":");

                        var year=0, month=1, day=1, hour=0, minute=0, second=0;

                        if (dParts.length >= 3) {
                            if (dParts[0].length > 2) { // Starts with year
                                year = parseInt(dParts[0]);
                                month = parseInt(dParts[1]);
                                day = parseInt(dParts[2]);
                            } else if (dParts[0].length == 2 && dParts[1].length == 2 && dParts[2].length == 2) { // dd-MM-yy
                                day = parseInt(dParts[0]);
                                month = parseInt(dParts[1]);
                                year = 2000 + parseInt(dParts[2]);                                
                            } else {
                                day = parseInt(dParts[0]);
                                month = parseInt(dParts[1]);
                                year = parseInt(dParts[2]);
                            }
                        }

                        if (tParts.length >= 2) {
                            hour = parseInt(tParts[0]);
                            minute = parseInt(tParts[1]);
                            if (tParts.length >= 3)
                                second = parseInt(tParts[2]);                            
                        }
                        var validDate = true;
                        if (year < 1900 || year > 9999 || day > 31 || day < 1 || month < 1 || month > 12 || hour >= 24 || hour < 0 || minute < 0 || minute >= 60 || second < 0 || second >= 60) {
                            validDate = false;
                        }

                        var tmpDateTime = null;
                        var obj = this.Parent.Parent;
                        if (obj.GetTimeZone() == "UTC") {
                            tmpDateTime = new Date(year + "-" + obj.NumberFormat(month) + "-" + obj.NumberFormat(day) + "T" + obj.NumberFormat(hour) + ":" + obj.NumberFormat(minute) + ":" + obj.NumberFormat(second)+"Z");
                        } else {
                            tmpDateTime = new Date(year, month - 1, day, hour, minute, second);
                        }

                        if (!validDate || isNaN(tmpDateTime.getHours())) {
                            this.className = "invalidDate";
                            return;
                        }
                        this.className = "";
                        this.Parent.Parent.RenderDateInput(this.Parent.Parent.Elements.Selection, tmpDateTime.toISOString());
                    },
                    onblur: function () {
                        if (this.Parent.Parent.readOnly || this.Parent.Parent.disabled)
                            return;
                        var obj = this;
                        if (obj.Parent.Parent.Elements.Selection.InRelativeEditor)
                            return; // Don't auto hide the relative editor

                        this.TimeOut = setTimeout(function () {
                            obj.TimeOut = 0;
                            if (obj.Parent.Parent.Elements.Selection) {
                                obj.Parent.Parent.Elements.Selection.style.display = "none";
                                obj.Parent.Parent.Elements.Selection.style.position = "absolute";
                                obj.Parent.Parent.Elements.Selection.style.top = "";
                                obj.Parent.Parent.Elements.Selection.style.left = "";
                                obj.Parent.Parent.appendChild(obj.Parent.Parent.Elements.Selection); // Move element back (so the next time the position will be correct as well)
                            }
                        }, 250);
                    },
                    onfocus: function () {
                        if (this.Parent.Parent.readOnly || this.Parent.Parent.disabled)
                            return;
                        if (this.TimeOut)
                            clearTimeout(this.TimeOut);
                        // TODO: Append the selection div to the body and use a fixed positioning so the selection div will be over anything
                        this.Parent.Parent.Elements.Selection.style.display = "";
                        this.Parent.Parent.Elements.Selection.style.zIndex = "20000";
                        this.Parent.Parent.Elements.Selection.DetachElementFromParent();
                    }
                },
            }
        }, 
        Selection: {
            style: { display: "none"}
        }
    },
    NumberFormat: function (d) {
        return d < 10 ? "0" + d : "" + d;
    },
    FormatOffset: function (offsetInMinutes) {
        var direction = offsetInMinutes < 0 ? "-" : "+";
        offsetInMinutes = Math.abs(offsetInMinutes);
        var hours = Math.floor(offsetInMinutes / 60);
        var minutes = offsetInMinutes % 60;
        
        return direction + this.NumberFormat(hours) + ":" + this.NumberFormat(minutes);
    },
    RefreshDateInput: function (dontFocus) {
        var obj = this;
        
        if (this.EnableTimeZone) {
            if (this.GetTimeZone() == "UTC") {
                this.Elements.DateInputContainer.Elements.TimeZoneInfo.innerHTML = "UTC";
                this.Elements.DateInputContainer.Elements.TimeZoneInfo.title = "Universal timezone";
            } else if (this.GetTimeZone() == "Local") {
                if (this.Data) {
                    this.Elements.DateInputContainer.Elements.TimeZoneInfo.innerHTML = this.FormatOffset(-(new Date(this.Data).getTimezoneOffset()));
                    //this.Elements.DateInputContainer.Elements.TimeZoneInfo.style.display = "";
                } else {
                    this.Elements.DateInputContainer.Elements.TimeZoneInfo.innerHTML = this.FormatOffset(-(new Date().getTimezoneOffset()));
                    //this.Elements.DateInputContainer.Elements.TimeZoneInfo.style.display = "none";
                }

                try {
                    var timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                    this.Elements.DateInputContainer.Elements.TimeZoneInfo.title = timeZone;
                    timeZone = timeZone.replace("/", "");
                    if (this.DisplayCodes[timeZone]) {
                        this.Elements.DateInputContainer.Elements.TimeZoneInfo.innerHTML = this.DisplayCodes[timeZone];
                    }

                } catch (errie) {
                    this.Elements.DateInputContainer.Elements.TimeZoneInfo.title = "Local timezone";
                }

            } else {
                // TODO
            }
        }
        
        this.Elements.DateInputContainer.Elements.DateInput.readOnly = this.readOnly ? true : false;
        this.Elements.DateInputContainer.Elements.DateInput.disabled = this.disabled ? true : false;

        var isRelative = (this.EnableRelative && this.Data && this.Data.indexOf && this.Data.indexOf("|") >= 0);
        this.className = "toolkitDateTime" + (this.disabled ? " toolkitDateTimeDisabled" : "") + (this.readOnly ? " toolkitDateTimeReadOnly" : "") + (isRelative ? " toolkitDateTimeRelative" : "");

        if (!this.Data) {
            this.Elements.DateInputContainer.Elements.DateInput.value = "";
            return;
        }
        var d;
        if (isRelative) {
            // Parse and display
            d = window.TK.DateTimeRelativeToDateObj(this.Data, this.GetTimeZone());
        } else {
            var d = new Date(this.Data);
        }
        
        if (this.GetTimeZone() == "UTC") {
            this.Elements.DateInputContainer.Elements.DateInput.value = obj.NumberFormat(d.getUTCFullYear()) + "-" + obj.NumberFormat(d.getUTCMonth() + 1) + "-" + obj.NumberFormat(d.getUTCDate());
            if (this.EnableTime)
                this.Elements.DateInputContainer.Elements.DateInput.value += " " + obj.NumberFormat(d.getUTCHours()) + ":" + obj.NumberFormat(d.getUTCMinutes()) + ":" + obj.NumberFormat(d.getUTCSeconds());
        } else if (this.GetTimeZone() == "Local") {
            this.Elements.DateInputContainer.Elements.DateInput.value = obj.NumberFormat(d.getFullYear()) + "-" + obj.NumberFormat(d.getMonth() + 1) + "-" + obj.NumberFormat(d.getDate());
            if (this.EnableTime)
                this.Elements.DateInputContainer.Elements.DateInput.value += " " + obj.NumberFormat(d.getHours()) + ":" + obj.NumberFormat(d.getMinutes()) + ":" + obj.NumberFormat(d.getSeconds());
        } else {
            // TODO: Implement custom timezones
        }

        if (!dontFocus)
            this.Elements.DateInputContainer.Elements.DateInput.focus();
    },
    GetTimeZone: function () {
        return this.UseGlobalTimeZone ? window.TK.DateTime.TimeZone : this.TimeZone;
    },
    SetTimeZone: function (newTimeZone) {
        if (this.UseGlobalTimeZone) {
            window.TK.DateTime.TimeZone = newTimeZone;
            var allPickers = document.querySelectorAll(".toolkitDateTimeSelector");
            for (var i = 0; i < allPickers.length; i++) {
                if (allPickers[i].Parent && allPickers[i].Parent.RenderDateInput && allPickers[i].Parent.UseGlobalTimeZone) {
                    allPickers[i].Parent.RenderDateInput(allPickers[i], allPickers[i].DateISO);
                    allPickers[i].Parent.RefreshDateInput(true);
                }
            }
        } else {
            this.TimeZone = newTimeZone;
            this.RenderDateInput(this.Elements.Selection, this.Data);
            this.RefreshDateInput(true);
        }
    },
    RenderDateInput: function (element, dateISO) {
        var obj = this;     
        if (this.NotFirst && dateISO != this.Data) {
            this.Data = dateISO;
            if (this.onchange)
                this.onchange();
        }
        this.NotFirst = true;

        this.Data = dateISO;
        element.DateISO = dateISO;
        
        if (!dateISO)
            dateISO = new Date().toISOString();        

        if (this.EnableRelative && dateISO.indexOf("|") >= 0) {
            element.InRelativeEditor = true;
            // Show relative editor
            element.className = "toolkitDateTimeSelector toolkitDateTimeSelectorRelative";
            element.innerHTML = "";
            element.onclick = function () { };

            var topButtonContainerR = document.createElement("DIV");
            topButtonContainerR.className = "topButtonContainer";

            var switchRelativeButtonR = document.createElement("DIV");
            switchRelativeButtonR.className = "switchRelativeButton";
            switchRelativeButtonR.innerHTML = "Relative Date";
            switchRelativeButtonR.onclick = function () {
                // Switch back
                obj.RenderDateInput(element, window.TK.DateTimeRelativeToDateObj(dateISO, obj.GetTimeZone()).toISOString());
            };
            topButtonContainerR.appendChild(switchRelativeButtonR);
            element.appendChild(topButtonContainerR);
            
            var parts = dateISO.split(/\|/g);
            var lineContainer = document.createElement("DIV");
            
            for (var i = 0; i < parts.length; i++) {
                var p = parts[i];
                if (p.length == 0)
                    continue;
                var line = document.createElement("DIV");
                line.className = "toolkitRelativeDateLine";
                var selectPart = document.createElement("SELECT");
                selectPart.appendChild(new Option("Year", "y"));
                selectPart.appendChild(new Option("Month", "M"));
                selectPart.appendChild(new Option("Day", "d"));
                selectPart.appendChild(new Option("Hour", "H"));
                selectPart.appendChild(new Option("Minute", "m"));
                selectPart.appendChild(new Option("Weekday", "w"));
                selectPart.value = p.substr(0, 1);
                p = p.substr(1);
                line.appendChild(selectPart);

                var selectMutation = document.createElement("SELECT");
                selectMutation.appendChild(new Option("=>", ""));
                selectMutation.appendChild(new Option("+"));
                selectMutation.appendChild(new Option("-"));
                selectMutation.value = "";
                if (p.length > 0 && p.substr(0, 1) == "+" || p.substr(0, 1) == "-") {
                    selectMutation.value = p.substr(0, 1);
                    p = p.substr(1);
                }
                line.appendChild(selectMutation);

                var inputValue = document.createElement("INPUT");
                line.appendChild(inputValue);
                if (p.length > 0) {
                    inputValue.value = p;
                }
                var removeLineButton = document.createElement("BUTTON");
                removeLineButton.innerHTML = "x";
                removeLineButton.onclick = function () {
                    this.parentNode.parentNode.removeChild(this.parentNode);
                };
                removeLineButton.className = "removeLineButton";
                line.appendChild(removeLineButton);
                line.Part = selectPart;
                line.Mutation = selectMutation;
                line.Value = inputValue;
                lineContainer.appendChild(line);        
            }
            lineContainer.GetRelativeDate = function () {
                var str = "|";
                for (var i = 0; i < this.childNodes.length; i++) {
                    if (this.childNodes[i].Value.value != "" && !isNaN(parseInt(this.childNodes[i].Value.value)))
                        str += this.childNodes[i].Part.value + this.childNodes[i].Mutation.value + this.childNodes[i].Value.value + "|";
                }
                return str;
            };
            element.appendChild(lineContainer);

            var addLineButton = document.createElement("BUTTON");
            addLineButton.className = "toolkitAddLineButton";
            addLineButton.innerHTML = "+";
            addLineButton.onclick = function () {
                obj.RenderDateInput(element, lineContainer.GetRelativeDate() + "|d-1");
            };
            element.appendChild(addLineButton);

            var applyButton = document.createElement("BUTTON");
            applyButton.className = "toolkitApplyButton";
            applyButton.innerHTML = "Apply";
            applyButton.onclick = function () {
                obj.RenderDateInput(element, lineContainer.GetRelativeDate());
                obj.RefreshDateInput();
                element.style.display = "none";
            };
            element.appendChild(applyButton);

            obj.Elements.DateInputContainer.Elements.DateInput.focus();
            return;
        }
        element.InRelativeEditor = false;
        var dateObj = new Date(dateISO);
        element.className = "toolkitDateTimeSelector";
        element.innerHTML = "";

        element.onclick = function () {
            obj.Elements.DateInputContainer.Elements.DateInput.focus();
        };

        window.TK.DateTimeUpdateDateObject(dateObj, obj.GetTimeZone());

        var getButtons = function (text, funcPrevious, funcNext) {
            var div = document.createElement("DIV");
            div.className = "buttonLine";
            div.PreviousButton = document.createElement("BUTTON");
            div.PreviousButton.innerHTML = "<";
            div.PreviousButton.className = "previousButton";
            div.PreviousButton.onclick = funcPrevious;
            div.PreviousButton.type = "button";
            div.PreviousButton.tabIndex = -1;

            div.StatusText = document.createElement("DIV");
            div.StatusText.className = "statusText";
            div.StatusText.innerHTML = text;

            div.NextButton = document.createElement("BUTTON");
            div.NextButton.innerHTML = ">";            
            div.NextButton.onclick = funcNext;
            div.NextButton.className = "nextButton";
            div.NextButton.type = "button";
            div.NextButton.tabIndex = -1;
            div.appendChild(div.PreviousButton);
            div.appendChild(div.StatusText);
            div.appendChild(div.NextButton);
            return div;
        };
        var topButtonContainer = document.createElement("DIV");
        topButtonContainer.className = "topButtonContainer";

        if (this.EnableTimeZone) {
            var switchUTCButton = document.createElement("DIV");
            switchUTCButton.className = "switchUTCButton";
            switchUTCButton.innerHTML = this.GetTimeZone() == "UTC" ? "UTC" : obj.FormatOffset(-dateObj.getTimezoneOffset());
            switchUTCButton.tabIndex = -1;

            try {
                if (this.GetTimeZone() == "Local") {
                    var timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                    switchUTCButton.title = timeZone;
                    timeZone = timeZone.replace("/", "");
                    if (this.DisplayCodes[timeZone]) {
                        switchUTCButton.innerHTML = this.DisplayCodes[timeZone];
                    }
                }
            } catch (errie) { }


            switchUTCButton.onclick = function () {
                obj.SetTimeZone(obj.GetTimeZone() == "UTC" ? "Local" : "UTC");
            };
            switchUTCButton.title = dateISO + " - " + dateObj.toLocaleString();
            topButtonContainer.appendChild(switchUTCButton);
        }

        if (this.EnableRelative) {
            var switchRelativeButton = document.createElement("DIV");
            switchRelativeButton.innerHTML = "Fixed date";
            switchRelativeButton.className = "switchRelativeButton";
            switchRelativeButton.onclick = function () {
                // Switch to relative                
                obj.RenderDateInput(element, "y" + dateObj.getFullYear() + "|M" + (dateObj.getMonth() + 1) + "|d" + dateObj.getDate() + "|H" + dateObj.getHours() + "|m" + dateObj.getMinutes());
            };
            switchRelativeButton.tabIndex = -1;
            topButtonContainer.appendChild(switchRelativeButton);
        }

        element.appendChild(topButtonContainer);

        element.appendChild(getButtons(dateObj.getFullYear(),
            function () {
                dateObj.setFullYear(dateObj.getFullYear() - 1);
                obj.RenderDateInput(element, dateObj.toISOString());
                obj.RefreshDateInput();
            },function () {
                dateObj.setFullYear(dateObj.getFullYear() + 1);
                obj.RenderDateInput(element, dateObj.toISOString());
                obj.RefreshDateInput();
                obj.Elements.DateInputContainer.Elements.DateInput.focus();
            }));

        element.appendChild(getButtons(obj.MonthNames[dateObj.getMonth()],
            function () {
                var expectedMonth = (dateObj.getMonth() - 1) % 12;
                dateObj.setMonth(dateObj.getMonth() - 1);
                if (dateObj.getMonth() != expectedMonth)
                    dateObj.setDate(dateObj.getDate() - 1);
                obj.RenderDateInput(element, dateObj.toISOString());
                obj.RefreshDateInput();
            }, function () {
                var expectedMonth = (dateObj.getMonth() + 1) % 12;
                dateObj.setMonth(dateObj.getMonth() + 1);
                if (dateObj.getMonth() != expectedMonth)
                    dateObj.setDate(dateObj.getDate() - 1);
                obj.RenderDateInput(element, dateObj.toISOString());
                obj.RefreshDateInput();
            }));

        var daySelection = getButtons("",
            function () {
                dateObj.setDate(dateObj.getDate() - 1);
                obj.RenderDateInput(element, dateObj.toISOString());
                obj.RefreshDateInput();
            }, function () {
                dateObj.setDate(dateObj.getDate() + 1);
                obj.RenderDateInput(element, dateObj.toISOString());
                obj.RefreshDateInput();
            });
        daySelection.StatusText.className = "statusText daySelection";
        var firstDay = new Date(dateISO);
        firstDay.setDate(1);
        
        var getDay = function (dateObj) {
            return (dateObj.getDay() - obj.WeekStart) < 0 ? 7 + (dateObj.getDay() - obj.WeekStart) : (dateObj.getDay() - obj.WeekStart);
        };
        
        var lineCount = 0;

        for (var i = 1 - getDay(firstDay); i <= 31 || lineCount < 7; i++) {
            if (lineCount == 7) {
                daySelection.StatusText.appendChild(document.createElement("BR"));
                lineCount = 0;
            }

            lineCount++;
            var tmpDateObj = new Date(dateISO);
            var curMonth = tmpDateObj.getMonth();
            tmpDateObj.setDate(i);

            if (i >= 28 && lineCount == 1 && tmpDateObj.getMonth() != curMonth) 
                break;
            
            var dayItem = document.createElement("BUTTON");
            dayItem.innerHTML = tmpDateObj.getDate();
            dayItem.className = "dayItem " + (i == dateObj.getDate() ? "selected" : "") + (tmpDateObj.getMonth() != curMonth ? " otherMonth" : "");

            //dayItem.title = tmpDateObj.toISOString();
            dayItem.DateIndex = i;
            dayItem.tabIndex = -1;
            dayItem.onclick = function (e) {
                dateObj.setDate(this.DateIndex);
                dateObj.setMilliseconds(0);
                if (obj.AlwaysNavigateToStartOfDay || (!obj.Data && (dateObj.getDate() != new Date().getDate() || dateObj.getDay() != new Date().getDay() || dateObj.getFullYear() != new Date().getFullYear()))) {                    
                    // Different day, default to 00:00:00
                    dateObj.setHours(0);
                    dateObj.setMinutes(0);
                    dateObj.setSeconds(0);
                }
                obj.RenderDateInput(element, dateObj.toISOString());
                obj.RefreshDateInput(true);
                var event = e || window.event;
                event.stopPropagation();
                return false;
            };
            daySelection.StatusText.appendChild(dayItem);
        }
        element.appendChild(daySelection);

        if (this.EnableTime) {
            element.appendChild(getButtons(obj.NumberFormat(dateObj.getHours()) + ":" + obj.NumberFormat(dateObj.getMinutes()) + ":" + obj.NumberFormat(dateObj.getSeconds()),
                function () {
                    dateObj.setUTCMinutes(dateObj.getUTCMinutes() - 15);
                    obj.RenderDateInput(element, dateObj.toISOString());
                    obj.RefreshDateInput();
                }, function () {
                    dateObj.setUTCMinutes(dateObj.getUTCMinutes() + 15);                    
                    obj.RenderDateInput(element, dateObj.toISOString());
                    obj.RefreshDateInput();
                }));


        }

        //element.appendChild(document.createTextNode(dateObj.toString()));
    },
    Destroy: function () {
        if (this.Elements.Selection)
            this.Elements.Selection.Remove();
    }
    
};

window.TK.DateTime.TimeZone = "Local";
window.TK.DateTimeUpdateDateObject = function (dateObj, timeZone) {
    if (timeZone == "UTC") {
        dateObj.getMonth = dateObj.getUTCMonth;
        dateObj.setMonth = dateObj.setUTCMonth;
        dateObj.getHours = dateObj.getUTCHours;
        dateObj.setHours = dateObj.setUTCHours;
        dateObj.getMinutes = dateObj.getUTCMinutes;
        dateObj.setMinutes = dateObj.setUTCMinutes;
        dateObj.getSeconds = dateObj.getUTCSeconds;
        dateObj.setSeconds = dateObj.setUTCSeconds;
        dateObj.getDate = dateObj.getUTCDate;
        dateObj.setDate = dateObj.setUTCDate;
    }
};
window.TK.DateTimeRelativeToDateObj = function (dateStr, timeZone) {
    var dateObj = new Date();    
    window.TK.DateTimeUpdateDateObject(dateObj, timeZone);
    dateObj.setSeconds(0);
    dateObj.setMilliseconds(0);
    var parts = dateStr.split('|');
    for (var i = 0; i < parts.length; i++) {
        if (parts[i].length < 2)
            continue;
        if (parts[i][1] == "+" || parts[i][1] == "-") {
            var value = parseInt(parts[i].substr(2));
            if (parts[i][1] == "-")
                value = -value;

            if (parts[i][0] == "y")
                dateObj.setFullYear(dateObj.getFullYear() + value);
            else if (parts[i][0] == "M")
                dateObj.setMonth(dateObj.getMonth() + (value));
            else if (parts[i][0] == "d")
                dateObj.setDate(dateObj.getDate() + value);
            else if (parts[i][0] == "H")
                dateObj.setHours(dateObj.getHours() + value);
            else if (parts[i][0] == "m")
                dateObj.setMinutes(dateObj.getMinutes() + value);
            else if (parts[i][0] == "s")
                dateObj.setSeconds(dateObj.getSeconds() + value);
            else if (parts[i][0] == "w") {
                var realModification = Math.abs(value);
                if (realModification == 7)
                    realModification = 0;

                dateObj.setDate(dateObj.getDate() + (realModification - dateObj.getDay()));
                if (dateObj.getDay() < realModification) {
                    if (value < 0)
                        dateObj.setDate(dateObj.getDate() - 7);
                }
                else {
                    if (value > 0)
                        dateObj.setDate(dateObj.getDate() + 7);
                }
            }
        } else { // Set
            var value = parseInt(parts[i].substr(1));
            if (parts[i][0] == "y")
                dateObj.setFullYear(value);
            else if (parts[i][0] == "M")
                dateObj.setMonth(value - 1);
            else if (parts[i][0] == "d")
                dateObj.setDate(value);
            else if (parts[i][0] == "H")
                dateObj.setHours(value);
            else if (parts[i][0] == "m")
                dateObj.setMinutes(value);
            else if (parts[i][0] == "s")
                dateObj.setSeconds(value);
            else if (parts[i][0] == "w") {
                var isoDay = dateObj.getDay();
                if (isoDay == 0)
                    isoDay = 7;
                dateObj.setDate(dateObj.getDate() + (value - isoDay));
            }
        }
    }
    return dateObj;
};



if (window.TK.Form) {
    window.TK.Form.DefaultTemplates.datetime = {
        _: TK.DateTime
    };
    window.TK.Form.DefaultTemplates.date = {
        _: TK.DateTime,
        EnableTime: false
    };
    window.TK.Form.DefaultTemplates.datetimeasp = {
        className: "dateTimeAsp",
        Init: function () {
            var isoString = null;
            if (this.Data) {
                isoString = window.ConvertFromASPTime(this.Data);
                if (!isoString)
                    isoString = new Date().toISOString();
            }
            this.Add({
                _: TK.DateTime,
                Data: isoString,
                disabled: this.disabled,
                readOnly: this.readOnly,
                onchange: this.onchange,
                onfocus: this.onfocus,
                onblur: this.onblur,
                DataSettings: this.DataSettings
            }, "DateInput");
        },
        GetValue: function () {
            var value = this.Elements.DateInput.GetValue();
            if (!value)
                return value;
            var time = new Date(value).getTime();
            if (isNaN(time)) {
                alert("Date time value of " + value + " is not valid.");
                throw "Date time value of " + value + " is not valid.";
            }
            return "/Date(" + time + ")/";
        }
    };
}
