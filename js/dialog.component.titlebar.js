/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

define(['js/dialog.component', 'jquery', 'interact'], function (DialogComponent, $, interact) {

    function dismiss () {
        return this.dialog.destroy();
    }
    
    function TitleBar (options) {
        
        var context = this, s, t, interactable;
        
        function dialognode () {
            return context.dialog.node();
        }

        options = options || {};

        DialogComponent.call(this, $.extend(options.style || {}, {
            'width'  : function () { return dialognode().offsetWidth  + 'px'; }
        }));
        
        s = 
        this.element
        .on("mousedown", function () {
            
            var dialog = context.dialog;
            
            if(!options.movable) return;
        
            interactable = interactable || interact(dialognode(), {allowFrom: this})
            .on("dragmove",  function (event) {
                
                dialog._style.left = parseInt(dialog.element.style('left')) + event.dx + 'px';
                dialog._style.top  = parseInt(dialog.element.style('top')) + event.dy + 'px';
                
                dialog.refresh();
                
                dialog.emit("move");
                
            });
            
            interactable.draggable(true);
        })
        .on("mouseup", function () {
            if(interactable)
                interactable.draggable(false);
        })
        .append("h5");
        
        t = s.append("span");
        
        s.text(options.text)
         .append("div")
         .style({
            display : "inline-block",
            float : "right"
        })
        .attr("type", "button")
        .classed("glyphicon glyphicon-remove", true)
        .on("click", this.trigger("dismiss"));
        
        this.set = function (value) {
            t.text(value);
            return this;
        }
        
        this.destroy = function () {
            
            if(interactable)
                interactable.unset();
            
            return DialogComponent.prototype.destroy.call(this);
        }
        
        this.on("dismiss", dismiss)
            .set(options.text);
        
    }
    
    TitleBar.prototype = new DialogComponent("titlebar");
    
    TitleBar.prototype.refresh = function () {
        this.dialog.element.classed("has-titlebar", true);
        return this;
    }

    return TitleBar;

})