/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/


define(['js/dialog.component'], function (DialogComponent) {

    const classmap = {

        'large': 'btn-lg',
        'small': 'btn-sm',
        'smallest': 'btn-xs',

        'default': 'btn-default',
        'primary': 'btn-primary',
        'success': 'btn-success',
        'info': 'btn-info',
        'warning': 'btn-warning',
        'danger': 'btn-danger',
        'link': 'btn-link'

    };

    function Button(options) {

        var s;

        options = options || {};
        
        DialogComponent.call(this, options.style);
        
        s = 
        this.element
            .classed("form-horizontal", true)
            .append("div")
            .classed("form-group", true)
            .append("div")
            .classed("col-sm-10", true)
            .classed("col-sm-offset-" + (options.offset || 2), true)
            .append("button")
            .attr("type", "button")
            .text(options.text)
            .on("click", this.trigger("action"));
        
        s.classed("btn", true);

        if (classmap[options.size])
            s.classed(classmap[options.size], true);

        s.classed(classmap[options.type] || classmap['default'], true);
        
        this.set = function (value) {
            return s.text(value);
        }
        
        this.node = function () {
            return s.node();
        }
        
        this.valueOf = function () {
            return s.node().innerText;
        }
        
        this.on("action", options.action);
    }

    Button.prototype = new DialogComponent("button");

    return Button;

})