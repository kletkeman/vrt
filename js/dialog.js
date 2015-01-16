/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

define([
    
      'debug'
    , 'jquery'
    , 'js/random'
    , 'd3'
    , 'js/dialog.component'
    // Must preload components, so they can be required synchronously
    , 'js/dialog.component.form'
    , 'js/dialog.component.checkbox'
    , 'js/dialog.component.button'
    , 'js/dialog.component.input'
    , 'js/dialog.component.slider'
    , 'js/dialog.component.tree'
    , 'js/dialog.component.folder'
    , 'js/dialog.component.html'
    , 'js/dialog.component.select'
    , 'js/dialog.component.color'
    
], function (debug, $, random, d3, DialogComponent) { debug = debug("lib:dialog")
    
    
    function Dialog (style, options) {
        
        var background;
        
        options  = options || {};
        style    = style || {};
        
        this._components = [];
        this._events     = [];
        this._options    = options;
        this._style      = style;
        
        style   = style   || {};
        
        if(options.isModal) {
            
            background = 
            d3.select(document.body)
            .append("div")
            .classed("dialog-modal", true);
            
            d3.select("html").style("pointer-events", "none");
            
            this.destroy = function () {
                background.remove();
                d3.select("html").style("pointer-events", null);
                return Dialog.prototype.destroy.call(this);
            }
        }
        
        this.element = (background || d3.select(document.body))
            .append("div")
            .classed("dialog", true)
            .attr("id", (this.id = random()))
            .style(style);
                
    }
    
    function insert (cmp, options) {
        
        var node;
        
        with(this._components) {
            
            push( typeof cmp === 'function' ? new cmp( $.extend({}, this._options || this.dialog._options, options)) : cmp );
            
            (cmp = valueOf()[length - 1]);
            
            this.element.node()
                 .appendChild(
                    (node = this instanceof DialogComponent ? cmp.node() : cmp.element.node())
                 );
            
        }
        
        cmp.dialog = this.dialog || this;
        cmp.parent = this;
        
        d3.select(node).style(cmp._style);
        
        return this;
        
    }
    
    Dialog.prototype.insert = function (name, options) {
       
        var context = this;
        
        if(name instanceof DialogComponent)
            insert.call(this, name, options);
        else if(typeof name === 'string')
            insert.call(context, require('js/dialog.component.' + name), options);
        
        return this;
        
    }
    
    Dialog.prototype.nest = function () {
        
        with(this._components) {
            return valueOf()[length - 1];
        }
        
    }
    
    Dialog.prototype.add = function (obj, name) {
        
        var args = Array.prototype.slice.call(arguments, 2);
        
        switch(arguments.length) {
                
            case 0:
                
                throw "Minimum 1 argument (object) is required";
                
            case 1:
                
                for(name in obj)
                    this.add(obj, name);
                
                return this;
                
            default:
                
                if(typeof obj !== 'object' || typeof name !== 'string')
                    throw "Argument(s) has wrong type, must be (object, string)";    
        }
        
        switch(typeof obj[name]) {
                
            case 'boolean':
                
                this.insert("checkbox", {
                    'text'    : name,
                    'checked' : obj[name]
                });
                
                break;
                
            case 'string' :
                
                switch(args.length) {
                        
                    case 0:
                
                        this.insert("input", {
                            'text'   : name,
                            'value' : obj[name]
                        });
                        
                        break;
                        
                    case 1:
                        
                        if( !Array.isArray(args[0]) )
                            throw "No options list provided";
                        
                        this.insert("select", {
                            'text'     : name,
                            'records'  : args[0]
                        });
                        
                }
                
                 
                
                break;
                
            case 'number' :
                
                switch(args.length) {
                        
                    case 0:
                
                        this.insert("input", {
                            'text'   : name,
                            'value' : obj[name]
                        });
                        
                        break;
                        
                    case 2:
                        
                        this.insert("slider", {
                            'text'   : name,
                            'value'  : obj[name],
                            'min'    : args[0],
                            'max'    : args[1]
                        });
                        
                        break;
                        
                }
                
                break;
                
            case 'object' :
                
                if(Array.isArray(obj[name])) {
                    
                    this.insert("input", {
                        'text'   : name,
                        'value' : obj[name]
                    });
                    
                    break;
                }
                
            case 'function' :
                
                return;
        
        }
        
        this.nest()
            .on("modified", function () {
                obj[name] = this.valueOf();
            })
            .on("update-request", function () {
                this.set(obj[name]);
            });
        
        return this;
        
    }
    
    Dialog.prototype.destroy = function () {
        
        var components = this._components, component;
        
        while( (component = components.pop()) )
            component.destroy();
        
        this.element.remove();
        
        this.emit("destroy");
        
    }
    
    Dialog.prototype.update = function () {
        
        var components = this._components;
        
        for(var i = 0, len = components.length; i < len; i++) {
            components[i].update();
        }
        
        return this;
    }
    
    Dialog.prototype.refresh = function () {
        
        var components = this._components, component;
        
        while( (component = components.pop()) )
            component.refresh();
        
        this.emit("refresh");
        
        return this;
        
    }
    
    Dialog.prototype.trigger = function (eventname) {
        var context = this;
        return function () {
            context.emit(eventname);
        }
    }
    
    Dialog.prototype.emit = function (eventname) {
        
        var callbacks;
        
        if( (callbacks = this._events[eventname]) )
            for(var i = 0, len  = callbacks.length; i < len; i++)
                callbacks[i].call(this, eventname);
        
        return this;
    }
    
    Dialog.prototype.on = function (eventname, callback) {
        
        var events = this._events;
        
        switch(arguments.length) {
            case 0:
            case 1:
            case 2:
                if(typeof eventname === 'string' && typeof callback === 'function')
                    break;
            default:
                throw "Invalid number of arguments or wrong type(s)";
        }
        
        events = (events[eventname] = events[eventname] || []);
        
        if(events.indexOf(callback) === -1)
            events.push(callback);
        
        return this;
    }
    
    DialogComponent.prototype.on      = Dialog.prototype.on;
    DialogComponent.prototype.trigger = Dialog.prototype.trigger;
    DialogComponent.prototype.insert  = Dialog.prototype.insert;
    DialogComponent.prototype.add     = Dialog.prototype.add;
    DialogComponent.prototype.nest    = Dialog.prototype.nest;
    DialogComponent.prototype.destroy = Dialog.prototype.destroy;
    DialogComponent.prototype.emit    = Dialog.prototype.emit;
    
    return Dialog;

});