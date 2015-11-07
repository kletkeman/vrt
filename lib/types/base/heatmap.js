/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/


define([
    'types/widget'
],
function(
    Widget
) {

	function HeatMap (fields) {
        Widget.call(this, fields);
    }
    
    HeatMap.prototype = Object.create(Widget.prototype);
    
    HeatMap.required = {
      '(options)' : {
          '(scale)'  : Array,
          '(colors)' : Array
      }
    };

    return HeatMap;

});
