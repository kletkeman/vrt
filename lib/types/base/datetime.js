/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/


define([
    'types/widget'
], function (
    Widget
) {
    
	function DateTime (fields) {
        Widget.call(this, fields);
    }
    
    DateTime.prototype =  Object.create(Widget.prototype);
    DateTime.required = {
        '(options)' : Object
    }

    return DateTime;

});
