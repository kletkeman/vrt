/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/


define([
    'types/widget'
], function (
    Widget
) {
    
	function BarGraph (fields) {
        Widget.call(this, fields);
    }
    
    BarGraph.prototype =  Object.create(Widget.prototype);

    BarGraph.required = {
        
        '(options)' : {
            '(align)'              : String,
            '(stacked)'            : Boolean,
            '(hideLabels)'         : Boolean,
            '(blur)'               : Number,
            '(colors)'             : Array,
            '(interpolate)'        : Boolean,
            '(scale)'              : Array
        }
    }

    return BarGraph;

});
