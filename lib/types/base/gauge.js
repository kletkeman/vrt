/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/


define([
    'types/widget'
], function (
    Widget
) {
    
	function Gauge (fields) {
        Widget.call(this, fields);
    }
    
    Gauge.prototype =  Object.create(Widget.prototype);
    Gauge.required = {
        '(options)' : Object
    }

    return Gauge;

});
