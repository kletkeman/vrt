/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

define(['js/dialog.component', 'js/random'], function (DialogComponent, random) {
    
    const classmap = {

        'large': 'form-group-lg',
        'small': 'form-group-sm'

    };
    
    const classmapi = {

        'large' : 'input-lg',
        'small' : 'input-sm'

    };

    function Color (options) {
        
        var s, n, id = random();

        options = options || {};
        
        DialogComponent.call(this, options.style);
        
        s =
        this.element
            .classed("form-horizontal", true)
            .append("div")
            .classed("form-group", true);
        
        if(classmap[options.size])
            s.classed(classmap[options.size], true);
        
        n = s.append("label")
         .attr("for", id)
         .classed("col-sm-2 control-label", true)
         .text(options.text || "");
        
        s = 
        s.append("div")
         .classed("col-sm-10", true)
         .append("input")
         .attr("type", "color" )
         .attr("id", id)
         .attr("name", options.name || options.text.toLowerCase().split(" ")[0])
         .on("input", this.trigger("modified"));
        
        if(classmapi[options.size])
            s.classed(classmapi[options.size], true);
        
        s  = s.node();
        
        this.set = function (value) {
            return s.value = value;
        }
        
        this.node = function () {
            return s.parentNode.parentNode;
        }
        
        this.valueOf = function () {
            return s.value;
        }
        
        function refresh () {
            n.style("color", this.valueOf());
            return this;
        }
        
        this.refresh = refresh;
        
        this.on("modified", refresh)
             .set(options.value);
        
        this.refresh();

    }

    Color.prototype = new DialogComponent("color");

    return Color;

})