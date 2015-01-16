/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

define(['js/dialog.component', 'js/random'], function (DialogComponent, random) {
    
    const classmap = {

        'large' : 'form-group-lg',
        'small' : 'form-group-sm'

    };
    
    const classmapi = {

        'large' : 'input-lg',
        'small' : 'input-sm'

    };

    function Slider (options) {
        
        var s, n, v, id = random(), value;

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
         .classed("col-sm-8", true)
         .append("input")
         .attr("type", "range")
         .attr("min", options.min || 0.)
         .attr("max", options.max || 1.)
         .attr("id", id)
         .attr("name", options.name || options.text.toLowerCase().split(" ")[0])
         .on("input", this.trigger("modified"));
        
        s.attr("step", options.step || ( (options.max || 1.) / (s.node().clientWidth || 10.) ) );
        
        if(classmapi[options.size])
            s.classed(classmapi[options.size], true);
        
        v =
        n.append("div")
         .classed("col-sm-2 control-label", true)
         .append("p")
         .classed("text-center", true);
        
        function refresh () {
            return v.node().innerText = s.node().value, this;
        }
        
        this.refresh = refresh;
        
        this.set = function (value) {
            return s.node().value = value, this.refresh();
        }
        
        this.node = function () {
            return n.node();
        }
        
        this.valueOf = function () {
            return parseFloat(s.node().value);
        }
        
        this.on("modified", refresh)
             .set(options.value);

        this.refresh();
    }

    Slider.prototype = new DialogComponent("slider");

    return Slider;

})