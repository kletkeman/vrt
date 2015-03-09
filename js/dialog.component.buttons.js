/*

    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
    
    Button Group
    
*/

define(['js/dialog.component', 'd3'], function (DialogComponent, d3) {
    
    function Buttons (options) {
        
        var context = this,
            b, buttons, selectedIndex;
        
        options = options || {};
        
        DialogComponent.call(this, options.style);
        
        buttons = options.data;
        buttons = Array.isArray(buttons) ? buttons : [];
        
        selectedIndex = options.selectedIndex;
        selectedIndex = typeof selectedIndex === "number" ? selectedIndex : 0;
        
        this.selectedIndex = selectedIndex;
        
        b = 
        this.element
            .append("div")
            .classed("btn-group btn-group-xs options", true)
            .attr("role", "group")
            .attr("aria-label", "...");
        
        b.selectAll("button")
            .data(buttons)
            .enter()
            .append("button")
            .attr("type", "button")
            .classed("btn", true)
            .classed("btn-primary-black", function (_, i) { return i === selectedIndex;})
            .classed("btn-default", function (_, i) { return i !== selectedIndex; })
            .on("click", function (_, i) {
            
                b.selectAll("button")
                 .classed("btn-primary-black", false);
            
                d3.select(this)
                  .classed("btn-primary-black", true);
            
                context.selectedIndex = i;
                context.emit("modified");
            
            })
            .append("span")
            .attr("class", classNames);

    }
    
    function classNames (d, i) {
        return String(d);
    }

    Buttons.prototype = new DialogComponent("buttons");

    return Buttons;

})