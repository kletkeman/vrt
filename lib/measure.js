/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
    
    Was originally based on code from "measured" node.js package, but was re-written and some features was removed for usage in the web browser.
    
    This module is licensed under the MIT license.
    
    https://github.com/felixge/node-measured.git
    
*/

define(['debug'], function (debug) {

    debug = debug("lib:measure");

    var interval;

    const NANOSECONDS = 1 / (1000 * 1000),
        MICROSECONDS = 1 / 1000,
        MILLISECONDS = 1,
        SECONDS = 1000 * MILLISECONDS,
        MINUTES = 60 * SECONDS,
        HOURS = 60 * MINUTES,
        DAYS = 24 * HOURS,
        TICK_INTERVAL = 1 * SECONDS,
        RATE_UNIT = SECONDS;

    const meters = [];

    function getTime() {
        return window.performance.now();
    }

    function tick() {

        for (var i = 0, len = meters.length; i < len; i++) {
            
            tack.call(meters[i]);
            
            if(debug.enabled)
                debug(meters[i].label, meters[i].toJSON());
        }
    }

    function start() {
        interval = setInterval(tick, TICK_INTERVAL);
    }

    // Exponentially Moving Weighted Average

    function Average (timePeriod, tickInterval) {

        timePeriod = timePeriod || 1 * MINUTES,
        tickInterval = tickInterval || TICK_INTERVAL;

        const alpha = 1 - Math.exp(-tickInterval / timePeriod);

        var count = 0,
            _rate = 0;

        this.mark = function (n) {
            
            count += n || 1;
            
            if (!interval) start();
        }

        this.tick = function () {

            var instantRate = count / tickInterval;

            count = 0;
            _rate += (alpha * (instantRate - _rate));

        }

        this.rate = function (rateUnit) {
            return (_rate || 0) * (rateUnit || RATE_UNIT);
        }
    }

    function Meter(label, rateUnit) {

        rateUnit = rateUnit || RATE_UNIT;

        this.toJSON = function () {

            var json = {},
                obj;

            for (var name in this) {

                obj = this[name];

                if (obj instanceof Average)
                    json[name] = obj.rate(rateUnit);
            }

            return json;
        }
        
        this.label = label;
    }

    Meter.prototype.add = function (name, timePeriod, tickInterval) {

        this[name] = new Average(timePeriod, tickInterval);

        if (meters.indexOf(this) === -1)
            meters.push(this);

        return this;
    }

    function tack() {

        var obj;

        for (var name in this) {

            obj = this[name];

            if (obj instanceof Average)
                obj.tick();
        }
        
    }

    Meter.prototype.mark = function (n) {

        var obj;

        n = n || 1;

        if (!interval) start();

        for (var name in this) {

            obj = this[name];

            if (obj instanceof Average)
                obj.mark(n);
        }
    }

    Meter.prototype.destroy = function () {
        
        var last = meters[meters.length-1];
        
        while( (meter = meters.shift()) ) {
            
            if(this !== meter) meters.push(meters);
            if (meter === last) break;
        }
        
        if(!meters.length) {
            
            clearInterval(interval);
            interval = null;
        }

    }

    Meter.NANOSECONDS = NANOSECONDS,
    Meter.MICROSECONDS = MICROSECONDS,
    Meter.MILLISECONDS = MILLISECONDS,
    Meter.SECONDS = SECONDS,
    Meter.MINUTES = MINUTES,
    Meter.HOURS = HOURS,
    Meter.DAYS = DAYS;

    return Meter;

});