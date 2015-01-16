/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

define(['js/dialog.component', 'js/random'], function (DialogComponent, random) {
    
    const classmap = {

        'large': 'form-group-lg',
        'small': 'form-group-sm'

    };

    function get_value (d) { return d; }
    
    function Select (options) {
        
        var s,n, id = random();

        options = options || {};
        
        DialogComponent.call(this, options.style);
        
        s = n =
        this.element
            .classed("form-horizontal", true)
            .append("div")
            .classed("form-group", true);
        
        if(classmap[options.size])
            s.classed(classmap[options.size], true);
        
        s.append("label")
         .attr("for", id)
         .classed("col-sm-2 control-label", true)
         .text(options.text || "");
        
        s =
        s.append("div")
         .classed("col-sm-10", true)
         .append("select")
         .classed("form-control", true)
         .attr("id", id)
         .attr("name", options.name || options.text.toLowerCase().split(" ")[0])
         .on("change", this.trigger("modified"))
         .selectAll("option")
         .data(options.records || [])
         .text(get_value);
        
        s.enter()
         .append("option")
         .text(get_value)
         .attr("value", get_value);
        
        s.exit()
         .remove();
        
        this.set = function () {
            
        }
        
        this.node = function () {
            return n.node();
        }
        
        this.valueOf = function () {
            var field = s.node().parentNode;
            return field.options[field.selectedIndex].value;
        }

    }

    Select.prototype = new DialogComponent("select");

    return Select;

})