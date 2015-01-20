/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

define([
    
      'debug'
    , 'jquery'
    , 'interact'
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
    , 'js/dialog.component.progress'
    , 'js/dialog.component.alert'
    , 'js/dialog.component.jumbotron'
    , 'js/dialog.component.titlebar'
    
], function (debug, $, interact, random, d3, DialogComponent) { debug = debug("lib:dialog")
    
    var   zIndex   = 10999;
    const bindings = [];
                                                               
    function Dialog (classnames, style, options) {
        
        var background, dialog = this;
        
        switch(arguments.length) {
            
            case 1:
                
                if(typeof classnames === 'object') {
                    style = classnames;
                    classnames = null;
                }
                
                break;
                
            case 2:
                
                if( typeof classnames !== 'string' ) {
                    
                    options = style;
                    style = classnames;
                    
                    classnames = null;
                    
                }
        }
        
        options  = options || {};
        style    = style || {};
        
        style["z-index"] = ++zIndex;
        
        this._components = [];
        this._events     = {};
        this._options    = options;
        this._style      = style;
        
        if(options.isModal) {
            
            background = 
            d3.select(document.body)
            .append("div")
            .classed("dialog-modal", true)
            .style("z-index", zIndex - 1)
            
            d3.select("html").style("pointer-events", "none");
            
            this.destroy = function () {
                background.remove();
                d3.select("html").style("pointer-events", null);
                return Dialog.prototype.destroy.call(this);
            }
        }
        
        this.element = (background || d3.select(document.body))
             .append(function () {
                return dialog.element || document.createElement("div");
             })
             .classed("dialog", true)
             .attr("id", (this.id = random()))
             .style(style);
        
        if(options.resizable)
            interact(this.element.node(), {})
            .resizable(true)
            .on("resizemove",  function (event) {

                style.width   = parseInt(dialog.element.style('width'))  + event.dx + 'px';
                style.height  = parseInt(dialog.element.style('height')) + event.dy + 'px';

                refresh();

            });
        
        if(classnames)
            this.element.classed(classnames, true);
        
        function refresh () {
            dialog.refresh();
        }
        
        window.addEventListener("resize", refresh, false);
                                
        this.on("destroy", function () {
            return window.removeEventListener("resize", refresh);
        });
                
    }
    
    function insert (cmp, options) {
        
        var node, dialog = this.dialog;
        
        with(this._components) {
            
            options = $.extend({}, this._options || (dialog ? dialog._options : {}), options);
            
            push( typeof cmp === 'function' ? 
                 new cmp( options ) : cmp );
            
            (cmp = valueOf()[length - 1]);
            
            this.element.node()
                 .appendChild(
                    (node = this instanceof DialogComponent ? cmp.node() : cmp.element.node())
                 );
            
        }
        
        cmp.dialog = dialog || this;
        cmp.parent = this;
        
        d3.select(node).style(cmp._style);
        
        cmp.parent.emit("insert", cmp);
        
        cmp.dialog.refresh();
        
    }
    
    Dialog.prototype.node = function () {
        return this.element.node();
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
    
    Dialog.prototype.add = function (obj, name, type) {
        
        var args = Array.prototype.slice.call(arguments, typeof type === 'string' ? 3 : 2), i;
        
        switch(arguments.length) {
                
            case 0:
                
                throw "Minimum 1 argument (object) is required";
                
            case 1:
                
                debug(" Auto add properties ", obj);
                
                for(name in obj) {
                    
                    if( (i = bindings.indexOf(obj)) > -1 && bindings[++i][name]) {
                        debug("Property '"+ name + "' has already been added, skipping...");
                        continue;
                    }
                    
                    this.add(obj, name);
                }
                
                return this;
                
            default:
                
                if(typeof obj !== 'object' || typeof name !== 'string')
                    throw "Argument(s) has wrong type, must be (object, string)";    
        }
        
        if( (i = bindings.indexOf(obj)) > -1 && bindings[++i][name])
            throw "Property '" + name + "' has already been added";
        
        switch(typeof type === "string" ? type : typeof obj[name]) {
                
            case 'undefined':
                throw "Property '" + name + "' does not exist in the given object";
                
            case 'color':
                
                this.insert("color", {
                    'text'    : name,
                    'value' : obj[name]
                });
                
                break;
                
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
                this.dialog.emit("modified", this, name, obj);
            })
            .on("update-request", function () {
                this.set(obj[name]);
            })
            .disabled(!Object.getOwnPropertyDescriptor(obj, name).writable);
        
        if( ( i = bindings.indexOf(obj) ) === -1) {
            
            for(i = 0, l = bindings.length; i < l; i += 3) {
                
                if(bindings[i] === null) {
                    
                    bindings[i] = obj;
                    bindings[i+1] = {};
                    bindings[i+2] = 0;
                    
                    break;
                }
            }
            
            if(bindings[i] !== obj) {
                bindings.push(obj, {}, 0);
                i = bindings.length - 3;
            }
        }
        
        bindings[++i][name] = this.nest();
        bindings[i+1]++;
        
        this.on("destroy", function () {
            
            bindings[i][name] = null;
            
            if(! --bindings[i+1] ) {
                bindings[i-1] = null;
                bindings[i] = null;
            }
        });
        
        return this;
        
    }
    
    Dialog.prototype.destroy = function () {
        
        var components = this._components,
            parent      = this.parent,
            component, length;
        
        while( (component = components.pop()) )
            component.destroy();
        
        this.element.remove();
        
        if(parent && (components = parent._components).indexOf(this) > -1) {
            
            length = components.length;
            
            while ( length-- && (component = components.shift())) {
                
                if(component !== this)
                    components.push(component);
                
            }
            
            if(parent instanceof Dialog && !components.length)
                parent.destroy();
        }
        
        return this.emit("destroy");
        
    }
    
    Dialog.prototype.update = function () {
        
        var components = this._components;
        
        for(var i = 0, len = components.length; i < len; i++) {
            components[i].update();
        }
        
        this.emit("update");
        
        return this;
    }
    
    Dialog.prototype.refresh = function refresh () {
        
        var components = this._components, component;
        
        this.element.style(this._style);
        
        for(var i = 0, len = components.length; i < len; i++) {
            components[i].refresh();
            refresh.call(components[i]);
        }
        
        this.emit("refresh");
        
        return this;
        
    }
    
    Dialog.prototype.trigger = function (eventname) {
        var context = this, e = [eventname];
        return function () {
            context.emit.apply(context, e.concat(Array.prototype.slice.call(arguments)));
        }
    }
    
    Dialog.prototype.emit = function (eventname) {
        
        var callbacks;
        
        if( (callbacks = this._events[eventname]) )
            for(var i = 0, len  = callbacks.length; i < len; i++)
                callbacks[i].apply(this, Array.prototype.slice.call(arguments, 1));
        
        return this;
    }
    
    function on (eventname, callback) {
        
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
    
    Dialog.prototype.on = on;
                                                                   
    Dialog.prototype.each = function () {
        
        var components = this._components, component;
        
        for(var i = 0, len = components.length; i < len; i++) {
            on.apply(components[i], arguments);
        }
        
        return this;
        
    }
    
    Dialog.prototype.components = function () {
        return this._components;
    }
    
    DialogComponent.prototype.on         = Dialog.prototype.on;
    DialogComponent.prototype.trigger    = Dialog.prototype.trigger;
    DialogComponent.prototype.insert     = Dialog.prototype.insert;
    DialogComponent.prototype.add        = Dialog.prototype.add;
    DialogComponent.prototype.nest       = Dialog.prototype.nest;
    DialogComponent.prototype.destroy    = Dialog.prototype.destroy;
    DialogComponent.prototype.emit       = Dialog.prototype.emit;
    DialogComponent.prototype.each       = Dialog.prototype.each;
    DialogComponent.prototype.components = Dialog.prototype.components;
    
    return Dialog;

});