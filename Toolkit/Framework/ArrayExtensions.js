"use strict";
/* Minify Order(5) */
// Extra array functions, inspired by LinqToSql
Array.prototype.Where = function (func) {
    var items = [];
    for (var i = 0; i < this.length; i++) {
        if (func(this[i], i))
            items.push(this[i]);
    }
    return items;
};

Array.prototype.First = function (func) {
    if (!func)
        return this[0];
    for (var i = 0; i < this.length; i++) {
        if (func(this[i], i))
            return this[i];
    }
};

Array.prototype.Take = function (count) {
    var items = [];
    for (var i = 0; i < this.length && i < count; i++) {
        items.push(this[i]);
    }
    return items;
};

Array.prototype.Skip = function (count) {
    var items = [];
    for (var i = count; i < this.length; i++) {
        items.push(this[i]);
    }
    return items;
};

Array.prototype.OrderBy = function (func) {
    if (!func)
        func = function (a) { return a; };
    return this.sort(function (a, b) {
        
        var a2 = func(a), b2 = func(b);
        if (a2 && a2.localeCompare && b2 && b2.localeCompare) {
            return a2.localeCompare(b2);
        }
        return a2 - b2;
    });
};
Array.prototype.OrderByDesc = function (func) {
    return this.OrderBy(func).reverse();
};

Array.prototype.Select = function (func) {
    var items = [];
    for (var i = 0; i < this.length; i++)
        items.push(func(this[i], i));
    return items;
};

Array.prototype.Max = function (func) {
    if (!func)
        func = function (a) { return a; };
    var highest = null;
    for (var i = 0; i < this.length; i++) {
        var value = func(this[i], i);
        if (highest == null || value > highest)
            highest = value;
    }
    return highest;
};

Array.prototype.Min = function (func) {
    if (!func)
        func = function (a) { return a; };
    var lowest = null;
    for (var i = 0; i < this.length; i++) {
        var value = func(this[i], i);
        if (lowest == null || value < lowest)
            lowest = value;
    }
    return lowest;
};

Array.prototype.Average = function (func) {
    if (!func)
        func = function (a) { return a; };
    var average = null;
    var averageCount = 0;
    for (var i = 0; i < this.length; i++) {
        var value = func(this[i], i);
        average = (average * averageCount + value) / (averageCount + 1);
        averageCount++;
    }
    return average;
};

Array.prototype.Unique = function (func) {
    if (!func)
        func = function (a) { return a; };
    var items = [];
    var uniqueKeys = [];
    for (var i = 0; i < this.length; i++) {
        var key = func ? func(this[i], i) : this[i];
        if (uniqueKeys.indexOf(key) < 0) {
            items.push(this[i]);
            uniqueKeys.push(key);
        }
    }
    return items;
};

Array.prototype.Randomize = function () {
    var items = this.slice();
    var currentIndex = items.length, temporaryValue, randomIndex;

    while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        temporaryValue = items[currentIndex];
        items[currentIndex] = items[randomIndex];
        items[randomIndex] = temporaryValue;
    }
    return items;
};