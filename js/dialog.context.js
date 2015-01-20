/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

define(['js/dialog', 'js/dialog.component', 'd3'], function (Dialog, DialogComponent, d3) {
    
    function ContextMenuDialog ( element ) {
        
        var show_t  = this.trigger("show"),
            hide_t  = this.trigger("hide"),
            dialog = this,
            style = {};
        
        this.element = document.createElement("ul");
        
        Dialog.call(this, "contextmenu-dialog", style);
        
        if(element) {
        
            element.addEventListener("contextmenu", show_t);

            this.on("destroy", function () {
                element.removeEventListener("contextmenu", show_t);
            });
            
        }
        
        this.element
            .on("mouseover", this.trigger("focus"))
            .on("mouseout", this.trigger("blur"));
        
        this.on("show", function (event) {
            
            var parent = this;
            
            d3.selectAll(".contextmenu-dialog")
              .style("display", "none");
            
            while( parent ) {
                parent.element.style("display", null);
                parent = parent.parent;
            }
            
            event = event || window.event;
            
            event.preventDefault();
            event.stopPropagation();
            
            parent = this.parent;
            
            style.display = null;
            style.left    = (parent ? event.target.parentNode.offsetLeft + d3.select(event.target).select(".glyphicon-menu-right").node().offsetLeft : event.x) + "px";
            style.top     = (parent ? event.target.parentNode.offsetTop + event.target.offsetTop : event.y) + "px";
            
            this.refresh();
            
            window.addEventListener("click", hide_t);
            
            return false;
            
        })
        .on("hide", function (event) {
            
            event = event || window.event;
            
            this.element
                .style("display", "none");
            
            window.removeEventListener("click", hide_t);
            
        })
        .on("focus", focus)
        .on("blur", focus);
        
        this.emit("hide");
        
    }
    
    function focus () {
        this.element.classed("focus", d3.event && d3.event.type === "mouseover");
    }
    
    ContextMenuDialog.prototype = Object.create(Dialog.prototype);
    
    ContextMenuDialog.prototype.add = function add (classnames, html, desc, action) {
        
        var style = {}, dialog = this, item;
        
        if(arguments.length < 4) {
            fn = desc;
            desc = html;
            html = classnames;
            classnames = null;
        }
        
        item = new ContextMenuItem({
            'html'        : html,
            'description' : desc,
            'style'       : style
        })
        .on("action", action);
        
        if(this instanceof ContextMenuItem) {
            
            if(!this.next) {
                this.next        = new ContextMenuDialog();
                this.next.parent = this.dialog;
            }
            
            this.element
                .classed("has-submenu", true)
                .on("mouseover", this.trigger("menu-next"))
                .append("span")
                .classed("glyphicon glyphicon-menu-right", true);
            
            this.next.insert(item);
            
            item.parent = this;
            
            this.on("menu-next", function () {
                
                var parent = this;
                
                this.next.emit("show");
                
                d3.selectAll(".contextmenu-dialog .active, .contextmenu-dialog.active")
                  .classed("active", false);
                
                while(parent) {
                    
                    if(parent.dialog)
                        parent.dialog.element.classed("active", true);
                    
                    parent.element.classed("active", true);
                    parent = parent.parent;
                
                }
                
                focus.call(this);
                this.dialog.emit("focus");

            });
        }
        else this.insert(item);
        
        return this.next || this;
    }
    
    function node (n) {
        return n;
    }
    
    function ContextMenuItem (options) {

        var s;

        options = options || {};
        
        this.element = document.createElement("li");
        
        DialogComponent.call(this, options.style);
        
        this.element.html(options.html);
        
        this.element
            .on("mouseover", this.trigger("focus"))
            .on("mouseout", this.trigger("blur"))
            .on("click", this.trigger("action"));
        
        this.on("focus", activate)
            .on("blur", deactivate);
        
    }
    
    function  activate () {
        
        var parent = this;
            
        d3.selectAll(".contextmenu-dialog")
          .style("display", "none");
        
        while( parent ) {
            
            parent.element.classed("active", true);
            
            if(parent.dialog) {
                parent.dialog.element.classed("active", true);
                parent.dialog.element.style("display", null);
            }
            
            parent = parent.parent;
        }
        
        focus.call(this);
        this.dialog.emit("focus");
        
    }
    
    function deactivate () {
        d3.selectAll(".contextmenu-dialog .active, .contextmenu-dialog.active")
          .classed("active", false);
        focus.call(this);
        this.dialog.emit("focus");
    }

    ContextMenuItem.prototype     = new DialogComponent("contextmenu-item");
    ContextMenuItem.prototype.add = ContextMenuDialog.prototype.add;
    
    return ContextMenuDialog;
    
})