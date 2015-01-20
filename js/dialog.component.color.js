/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

define(['js/dialog.component', 'js/random'], function (DialogComponent, random) {
    
    const classmap = {

        'large'    : ['form-group-lg', 'color-square'],
        'small'    : ['form-group-sm', 'color-square'],
        'smallest' : ['form-group-xs', 'color-square'],

    };

    function Color (options) {
        
        var context = this, s, n, data = [];

        options = options || {};
        
        DialogComponent.call(this, options.style);
        
        s = n =
        this.element
            .classed("form-horizontal", true)
            .append("div")
            .classed("form-group", true);
        
        if(classmap[options.size])
            s.classed(classmap[options.size][0], true);
        
        s.append("label")
         .classed("col-sm-4 control-label", true)
         .text(options.text || "");
        
        s = 
        s.append("div")
         .classed("col-sm-8", true)
         .append("div");
        
        function map_values (v, i) {
                
            var d = data[i];
                
            if(d) {
                d.value = v;
                return d;
            }
                
            return {value: v, id: random()};
        }
        
        this.set = function (value) {
            data = (Array.isArray(value) ? value : [value] ).map(map_values);
            return this.refresh();
        }
        
        this.disabled = function (yes) {
            
            s.selectAll("input")
             .each(function () {
                this.disabled = yes;
            });
            
            return this;
        }
        
        this.node = function () {
            return n.node();
        }
        
        this.valueOf = function () {
            return Array.isArray(options.value) ? data.map(getValue) : data[0].value;
        }
        
        function modified (d, i) {
            d.value = this.value;
            context.emit("modified", d, i);
        }
        
        function refresh () {
            
            var c, u;
            
            c = 
            s.selectAll("label")
             .data(data)
             .call(update);
            
            u =
            c.enter()
             .append("label");
            
            if(classmap[options.size])
                u.classed(classmap[options.size][1], true);
            
            u.attr("for", getId)
             .append("input")
             .attr("type", "color")
             .style("visibility", "hidden")
             .attr("id", getId)
             .on("input", modified);
             
            u.call(update);
            
            c.exit().remove();
            
            return this;
        }
        
        this.refresh = refresh;
        
        this.on("modified", refresh)
             .set(options.value);
    }
    
    function getId (d) { return d.id; }
    function getValue (d) { return d.value;}
    
    function update (s) {
            
        s.select("input")
         .attr("value", getValue);
            
        s.style("background-color", getValue);
            
    }
    
    Color.prototype = new DialogComponent("color");

    return Color;

})