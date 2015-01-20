/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

define(['js/dialog.component', 'js/random'], function (DialogComponent, random) {
    
    function JumboTron (options) {
        
        var e, t, c;

        options = options || {};
        
        DialogComponent.call(this, options.style);
        
        e = 
        this.element
             .classed("jumbotron", true);
                     
        e.append("h1")
         .text(options.title || "");
        
        s = e.append("p");
        
        if(options.link) {
            
            e.append("p")
             .append("a")
             .attr("role", "button")
             .attr("href", "#")
             .classed("btn btn-primary btn-lg", true)
             .text(options.link)
             .on("click", this.trigger("action"));
            
            if(options.action)
                this.on("action", options.action);
            
        }
            
        this.set = function (value) {
            return s.html(value), this;
        }
        
        this.valueOf = function () {
            return s.node().innerHTML;
        }
        
        this.set(options.content);

    }

    JumboTron.prototype = new DialogComponent("jumbotron");

    return JumboTron;

})