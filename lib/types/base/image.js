/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/


define([
    'types/widget'
], function (
    Widget
) {
    
	function Image (fields) {
        Widget.call(this, fields);
    }
    
    Image.prototype =  Object.create(Widget.prototype);
    Image.required = {
        '(options)' : {
            '(color)' : String,
            '(blur)'  : Number,
            '(scale)' : Number,
            '(url)'   : String,
            '(fill)'  : Boolean
        }
    }

    return Image;

});
