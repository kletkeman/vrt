/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

define([
      'jquery'
    , 'lib/api'
    , 'js/dialog'
    , 'js/dialog.component'
],
function (
       
      $
    , vrt
    , Dialog
    , DialogComponent
    
) {
    
    
    function Navigator () {
        
        var s;
        
        this.element = document.createElement("ul");
        
        DialogComponent.call(this);
        
        s = 
        this.element
            .selectAll("li")
            .data(groups)
            .enter()
            .append("li")
            .attr("class", "group")
            .append("h5")
            .classed("open", opened);
        
        s.append("span")
         .classed("title", true)
         .text(groupname)
         .on("click", activate);
        
        s.append("div")
                 .classed("icon dots small", true)
                 .on("click", this.trigger("expand"));
        
        s.append("button")
                 .classed("btn btn-xs", true)
                 .classed("btn-danger", opened)
                 .on("click", oc);
            
        s.append("ul")
            .attr("class", "objects")
            .style("display", "none")
            .selectAll("li")
            .data(group)
            .enter()
            .append("li")
            .attr("class", "object")
            .text(title)
            .append("div")
            .classed("icon expand small", true)
            .on("click", oc);
        
        this.on("expand", expand);
        
    }
                                 
    Navigator.prototype = new DialogComponent("navigator");
    
    function groups () { return Object.keys(vrt.groups).sort().map(function(t, i) { return t; }); }
    function group (name) { return vrt.groups[name]; }
    function title (widget) { return widget.title; }
    function groupname (name) { return name; };
    
    function opened (d) {
        
        for(var i = 0, window, windows = vrt.controls.dock.windows, length = windows.length; i < length; i++) {
                
            window = windows[i];
                
            if(window && window.name === d) break;
            else window = null;
                
        }
        
        return window && window.name === d ? window : null;
        
    }
    
    function expand (title) {
        
        var selection = 
        
        d3.select(d3.event.target.parentNode)
          .select("ul.objects");
        
        selection.style("display", selection.style("display") === "none" ? null : "none");
        
        this.dialog.refresh();
            
    }
    
    function activate (name) {
        
        var window = opened(name);
        
        if(window)
            window.activate();
    }
    
    function oc (name) {
        
        var window;
        
        if(typeof name === "string") {
            
            window = opened(name);
            
            window ? window.remove() : vrt.controls.open(name);
            
            d3.select(this.parentNode)
              .classed("open", !window);
            
            d3.select(this)
              .classed("btn-danger", !window);
            
            
        }
        else
            name.open();
        
    }
    
    return function () {
        
        return vrt.controls.dialog()
            .insert("titlebar", {
                text: " Browse "
            })
            .insert(new Navigator());
        
    }
    
});
