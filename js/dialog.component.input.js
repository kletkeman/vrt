/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

define(['js/dialog.component', 'js/random'], function (DialogComponent, random) {
    
    const classmap = {

        'large'    : 'form-group-lg',
        'small'    : 'form-group-sm',
        'smallest' : 'form-group-xs'

    };
    
    const classmapW = {
        0 : 'has-warning has-error',
        1 : 'has-warning',
        2 : 'has-error'
    };
        
    const classmapI = {
        1 : 'glyphicon-warning-sign',
        2 : 'glyphicon-remove'
    };

    function Input (options) {
        
        var s, n, id = random(), value;

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
         .classed("col-sm-4 control-label", true)
         .text(options.text || "");
        
        value = options.value === undefined ? "" : options.value;
        value = Array.isArray(value) ? value.join(",") :  value;
        
        s = 
        s.append("div")
         .classed("col-sm-8", true)
         .append("input")
         .attr("type", typeof value === "number" ? "number" : "text")
         .attr("min",  typeof value === "number" ? options.min || null : null)
         .attr("max",  typeof value === "number" ? options.max || null : null)
         .attr("step", typeof value === "number" ? options.step || null : null)
         .attr("value", value)
         .attr("id", id)
         .attr("placeholder", options.placeholder || "")
         .attr("name", options.name || options.text.toLowerCase().split(" ")[0])
         .classed("form-control", true)
         .on("input", this.trigger("modified")).node();
        
        this.disabled = function (yes) {
            s.disabled = yes;
            return this;
        }
        
        this.set = function (value) {
            return s.value = value;
        }
        
        this.node = function () {
            return n.node();
        }
        
        this.valueOf = function () {
            
            var v = s.value;
            
            if(Array.isArray(options.value))
                v = v.split(",");
            
            return typeof value === "number" ? (Number.isFinite( (v = parseFloat(v)) ) ? v : value) : v;
            
        }
        
        this.error = function (code) {
            
            n.selectAll(".form-control-feedback").remove();
            
            n.classed(classmapW[code], !!code)
             .classed("has-feedback", !!code);
                   
            if(!code) return;
            
            d3.select(s.parentNode)
              .append("span")
              .classed("glyphicon form-control-feedback", true)
              .classed(classmapI[code], true)
              .attr("aria-hidden", true)
        }
        
        this.on("modified", function () {
            var v = s.value;
            if(!v && s.type === "number" ) this.error(2);
            else this.error(0);
        });

    }

    Input.prototype = new DialogComponent("input");
    
    return Input;

})