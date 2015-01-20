/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

define(['js/dialog.component', 'js/random'], function (DialogComponent, random) {
    
    function Progress (options) {
        
        var s, l, id = random();

        options = options || {};
        
        DialogComponent.call(this, options.style);
        
        
        l =
        this.element.append("div")
                     .classed("col-sm-1", true);
        
        s = 
        this.element
            .append("div")
            .classed("col-sm-11", true)
            .append("div")
            .attr("id", id)
            .classed("progress", true)
            .append("div")
            .classed("progress-bar", true)
            .attr("role", "progressbar")
            .attr("aria-valuemax", "100")
            .attr("aria-valuemin", "0");
        
        this.set = function (value) {
            
            s.attr("aria-valuenow", ""+value)
            .style("width", value+"%");
            
            return this;
        }
        
        this.valueOf = function () {
            return parseFloat(s.attr("aria-valuenow"));
        }
        
        function refresh () {
            l.text(this.valueOf() + "%");
            return this;
        }
        
        this.refresh = refresh;
        
        this.on("modified", refresh)
             .set(options.value||0);

    }

    Progress.prototype = new DialogComponent("progress");

    return Progress;

})