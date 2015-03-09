/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

define(['js/dialog.component', 'interact'], function (DialogComponent, interact) {

    function ScrollBar (options) {

        var s, calculate, size, position, vertical, handle, interactable, element,
            dx = 0, dy = 0, alpha = 0, context = this;
        
        options = options || {};

        DialogComponent.call(this, options.style);
        
        size     = options.size;
        position = options.position;
        element  = options.element;
        
        calculate = {
            left   : function () {
                return  Math.round(this.parentNode.offsetWidth * (dx = (typeof position === "function" ? position() : position))) + "px";
            },
            width  : function () {
                return Math.round(this.parentNode.offsetWidth * (typeof size === "function" ? size() : size)) - 3 + "px";
            },
            top    : function () {
                return Math.round(this.parentNode.offsetHeight * (dy = (typeof position === "function" ? position() : position))) + "px"
            },
            height : function () {
                return Math.round(this.parentNode.offsetHeight * (typeof size === "function" ? size() : size)) - 3 + "px";
            }
        };
        
        function scroll (e) {
            
            var height, width, max, top, bottom, left, right;
            
            e.preventDefault();
            e.stopPropagation();
           
            if(vertical) {
            
                height  = handle.node().parentNode.offsetHeight,
                max     = 1 - size();

                dy += ((e.dy || -(e.wheelDeltaY / 40)) / height) || 0;
                
                dy  = Math.max( Math.min(dy, max), 0);

                top    = (dy * height);
                bottom = (max * height); 
                        
                alpha = top / bottom;
                        
            }
            else {
                        
                width  = handle.node().parentNode.offsetWidth,
                max    = 1 - size();

                dx += ((e.dx || -(e.wheelDeltaX / 40) || dx) / width) || 0;
                dx  = Math.max( Math.min(dx, max), 0);

                left  = (dx * width);
                right = (max * width); 
                        
                alpha = left / right
                        
            }

            context.emit("scroll", alpha );

        }
        
        handle =
        this.element
            .append("div")
            .classed("handle", true);
        
        interactable =
        interact(handle.node())
            .draggable(true)
            .on("dragmove", scroll);
        
        this.refresh = function () {
            
            var node = this.element.node();
            
            if( (vertical = node.offsetWidth / node.offsetHeight < 1))
                handle.style("top", calculate.top)
                      .style("height", calculate.height);
            else
                handle.style("left", calculate.left)
                      .style("width", calculate.width);
                
            return DialogComponent.prototype.refresh.call(this);
        }
        
        function wheel (event) {
            
            if( (vertical && event.wheelDeltaX) || 
                (!vertical && event.wheelDeltaY) )
                    return;
            
            return scroll.call(context, event)
        }
        
        this.destroy = function () {
            
            if(element) {
                element.removeEventListener("mousewheel", wheel);
            }
            
            return DialogComponent.prototype.destroy.call(this);
        }
        
        if(element) {
            element.addEventListener("mousewheel", wheel);
        }

    }

    ScrollBar.prototype = new DialogComponent("scrollbar");
    
    return ScrollBar;

})