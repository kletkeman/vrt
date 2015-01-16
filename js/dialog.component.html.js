/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

define(['js/dialog.component'], function (DialogComponent) {

     function HTML (options) {
        
        options = options || {};
        
        DialogComponent.call(this, options.style);
        
        this.element.html(options.html);
        
    }
                                 
    HTML.prototype = new DialogComponent("html");

    return HTML;

})