/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

define(['js/dialog.component', 'js/random'], function (DialogComponent, random) {
    
    const classmap = {
        "success" : "alert-success",
        "info"    : "alert-info",
        "warning" : "alert-warning",
        "danger"  : "alert-danger"
    };
    
    function dismiss () {
        return this.destroy();
    }
    
    function Alert (options) {
        
        var e, s;

        options = options || {};
        
        DialogComponent.call(this, options.style);
        
        e = 
        this.element
             .classed("alert alert-dismissable", true)
             .attr("role", "alert");
        
        if(classmap[options.type])
            e.classed(classmap[options.type], true);
                     
        e.append("button")
         .attr("type", "button")
         .attr("aria-label", "Close")
         .classed("close", true)
         .on("click", dismiss.bind(this))
         .append("span")
         .attr("aria-hidden", "true")
         .html("&times;");
        
        s = 
        e.append("span");
        
        this.set = function (value) {
            return s.html(value), this;
        }
        
        this.valueOf = function () {
            return s.node().innerHTML;
        }
        
        this.set(options.html);

    }

    Alert.prototype = new DialogComponent("alert");

    return Alert;

})