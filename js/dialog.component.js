/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

define(['d3', 'js/random', 'eventemitter'], function (d3, random, EventEmitter) {

    function DialogComponent (style) {
        
        EventEmitter.call(this);

        if(typeof style === 'string') {
            
            Object.defineProperty(this, "name", {
                enumerable: true,
                writable : false,
                value : style
            });
            
        }
        else {
        
            style = style || {};

            this.element = d3.select(this.element || document.createElement("div"))
                .attr("id", (this.id = random()))
                .classed("dialog-component", true)
                .classed("dialog-component-" + this.name, true);
            
            this._components = [];
            this._style      = style;
            
        }

    }
    
    DialogComponent.prototype = Object.create(EventEmitter.prototype);
    
    DialogComponent.prototype.validate  = function () {
        return true;
    }
    DialogComponent.prototype.refresh  = 
    DialogComponent.prototype.disabled = 
    DialogComponent.prototype.set      = function () {return this;};
    
    DialogComponent.prototype.up       = function () {
        return this.parent;
    }
    
    DialogComponent.prototype.update = function () {
        
        var components = this._components;
        
        for(var i = 0, len = components.length; i < len; i++) {
            components[i].update();
        }
        
        return this.emit("update-request");
    }
    
    DialogComponent.prototype.node = function () {
        return this.element.node();
    }
    
    
    
    DialogComponent.prototype.valueOf    = function () {
        return this.element.node().innerText;
    }

    return DialogComponent;

});