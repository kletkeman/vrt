/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/


define([
    'types/widget'
], function (
    Widget
) {
    
	function LineGraph (fields) {
        Widget.call(this, fields);
    }
    
    LineGraph.prototype =  Object.create(Widget.prototype);

    LineGraph.required = {
        '(options)' : {
            '(blur)' : Number,
            '(colors)' : Array,
            '(scale)' : Array,
            '(lineWidth)' : Number,
            '(spacing)' : Number,
            '(tilt)'    : Boolean
        }
    }

    return LineGraph;

});
