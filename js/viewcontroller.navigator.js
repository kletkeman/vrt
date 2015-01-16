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
            .data(Object.keys(vrt.groups).sort().map(function(t, i) { return t; }))
            .enter()
            .append("li")
            .attr("class", "group")
            .append("h5")
            .text(function(name) { return name; })
            .classed("open", isOpen)
            .on("click", open_close);
        
        s.append("div")
                 .classed("icon dots small", true)
                 .on("click", expand);
            
        s.append("ul")
            .attr("class", "objects")
            .style("display", "none")
            .selectAll("li")
            .data(function (name) {
                return vrt.groups[name];
            })
            .enter()
            .append("li")
            .attr("class", "object")
            .text(function (widget) { return widget.title; })
            .append("div")
            .classed("icon expand small", true)
            .on("click", open_close);
        
    }
                                 
    Navigator.prototype = new DialogComponent("navigator");
    
    function isOpen (d) {
        
        for(var i = 0, window, windows = vrt.controls.dock.windows, length = windows.length; i < length; i++) {
                
            window = windows[i];
                
            if(window && window.name === d) break;
            else window = null;
                
        }
        
        return window && window.name === d ? window : null;
        
    }
    
    function expand (title) {
        
        var selection = 
        
        d3.select(this.parentNode)
          .select("ul.objects");
        
        selection.style("display", selection.style("display") === "none" ? null : "none");
            
    }
    
    function open_close (d) {
        
        var window;
        
        if(typeof d === "string") {
            
            d3.select(this)
              .classed("open", (window = isOpen(d)) );
            
            window ? window.activate() : vrt.controls.open(d);
        }
        else
            d.open();
        
        vrt.controls.blur(true);
    }
    
    return function () {
        
        return vrt.controls.blur(true), vrt.controls.toolbar.hide(), vrt.controls.dock.hide(),
            
            new Dialog({
            
                'margin-left' : '25%',
                'margin-top'  : '18%',
                'min-width'   : '50%',
                'min-height'  : '50%',
                'max-height'  : '70%',

            }, {
                size: "small",
                isModal: true
            })
            .insert(new Navigator())
            .insert("button", {

                text: "Close",
                type: "primary",
                style: {
                    "text-align" : "right"
                },
                action: function () {this.dialog.destroy();}
            })
            .on("destroy", function () {
                return vrt.controls.blur(false); 
            });
        
        
        /*
        
        window.O = {
            
            "name" : "Odd Marthon",
            "age"  : 33,
            "body parts" : ["arms", "legs"],
            "horny" : true,
            "height" : 0,
            "condition" : "sleeping"
            
        };
        
        .insert("form")
        .nest()
        .add(O)
        .add(O,  "height", -5, 5)
        .add(O, "condition", ["tired", "horny", "angry"])
        .insert("color", {text: 'skin', value: "#F4D3D3"})
        .dialog
        .insert("button", {
            text: "Close", type: "primary", style: {"text-align" : "right"}, action: function () {this.dialog.destroy();}})
        .on("destroy", function () {
            return blur(false); 
        })
        
        /*.insert(new Navigator());
        .insert("form")
        .nest()
        .insert("text", {text: "Name", placeholder: "Enter your name"})
        .insert("checkbox", {text: "Gay", checked: true} )
        .insert("select", {text: "Fags", records: ["blue", "green", "yellow"]} )
        .insert("html", {html: "<span class=\"glyphicon glyphicon-exclamation-sign\" aria-hidden=\"true\"></span>"})
        .insert("button", {text: "Close", type: "primary"});*/
        
    }
    
});
