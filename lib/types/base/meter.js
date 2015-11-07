/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/


define([
    'types/widget'
], function (
    Widget
) {
    
	function Meter (fields) {
        Widget.call(this, fields);
    }
    
    Meter.prototype =  Object.create(Widget.prototype);
    Meter.required = {
        '(options)' : Object
    }

    return Meter;

});
