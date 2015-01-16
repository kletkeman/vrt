/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

define(['js/dialog.component', 'jquery'], function (DialogComponent, $) {

    function Form (options) {
        
        options = options || {};
        
        this.element = document.createElement("form");
        
        DialogComponent.call(this, options.style);
        
        this.element
             .classed("form-horizontal", true);

    }

    Form.prototype = new DialogComponent("form");
    
    Form.prototype.valueOf = function () {
        return $(this.element.node()).serializeArray();
    }

    return Form;

})