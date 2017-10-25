/*
    VRT - Copyright © 2017 Odd Marthon Lende
    All Rights Reserved
*/

import $ from 'jquery';
import {interact} from 'interact';
import {random} from "./random.js";
import * as d3 from 'd3';
import {EventEmitter} from 'events';
import {DialogComponent} from "./dialog.component.js";

var   zIndex   = 10999;
const bindings = [];

export function Dialog (classnames, style, options) {

    var background, interactable, opacity, dialog = this;

    EventEmitter.call(this);

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
    this._options    = options;
    this._style      = style;

    if(options.isModal) {

        background =
        d3.select(document.body)
        .append("div")
        .classed("dialog-modal", true)
        .style("z-index", zIndex - 1);

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
         .attr("id", (this.id = random()));

    for(var prop in style) {
        this.element.style(prop, style[prop]);
    }

    opacity = this.element.style("opacity");

    this.element.style("opacity", 0);

    this.element.transition()
                .duration(500)
                .style("opacity", opacity);

    if(options.resizable)
        interactable =
        interact(this.element.node(), {})
        .resizable({
            edges: {
                top : true, left: true, bottom: true, right: true
            }
        })
        .on("resizemove",  function (event) {

            var r = event.rect;

            style.width   = r.width  + 'px';
            style.height  = r.height + 'px';

            refresh();

            dialog.emit("resize");

        });

    if(classnames)
        this.element.classed(classnames, true);

    function refresh () {
        dialog.refresh();
    }

    window.addEventListener("resize", refresh, false);

    this.on("destroy", function () {

        if(options.resizable)
            interactable.unset();

        return window.removeEventListener("resize", refresh);
    });

    setTimeout(refresh, 0);

}

Dialog.prototype = Object.create(EventEmitter.prototype);

function insert (cmp, options) {

    var node, dialog = this.dialog, components = this._components;

    options = $.extend({}, this._options || (dialog ? dialog._options : {}), options);

    components.push( typeof cmp === 'function' ?
         new cmp( options ) : cmp );

    (cmp = components.valueOf()[components.length - 1]);

    this.element.node()
         .appendChild(
            (node = this instanceof DialogComponent ? cmp.node() : cmp.element.node())
         );

    cmp.dialog = dialog || this;
    cmp.parent = this;

    d3.select(node).style(cmp._style);

    if(this instanceof DialogComponent)
        d3.select(node).classed(cmp.element.attr("class"), true);

    cmp.parent.emit("insert", cmp);

}

Dialog.prototype.remove = function (component) {
    var components = this._components, len = components.length;
    for(var i = 0; i < len; i++) {
      var c = components.shift();
      if(c !== component)
        components.push(c);
      else {
        var n = c.element.node();
        n.parentNode.removeChild(n);
      }
    }
}

Dialog.prototype.node = function () {
    return this.element.node();
}

Dialog.prototype.insert = function (name, options) {

    var context = this;

    if(name instanceof DialogComponent)
        insert.call(this, name, options);
    else if(typeof name === 'string') {

        var r = require('./dialog.component.' + name);

        for(var n in r) {
          insert.call(context, r[n], options);
        }

      }

    return this;

}

Dialog.prototype.nest = function () {

    var components = this._components;
    return components.valueOf()[components.length - 1];
}

Dialog.prototype.add = function (obj, name, type) {

    var args = Array.prototype.slice.call(arguments, typeof type === 'string' ? 3 : 2), i;

    switch(arguments.length) {

        case 0:

            throw "Minimum 1 argument (object) is required";

        case 1:

            console.debug(" Auto add properties ", obj);

            for(name in obj) {

                if( (i = bindings.indexOf(obj)) > -1 && bindings[++i][name]) {
                    console.debug("Property '"+ name + "' has already been added, skipping...");
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

                case 2:
                case 1:

                    if( !Array.isArray(args[0]) )
                        throw "No options list provided";

                    this.insert("select", {
                        'text'     : name,
                        'records'  : args[0],
                        'value'    : obj[name]
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

                case 3:
                case 2:

                    this.insert("slider", {
                        'text'   : name,
                        'value'  : obj[name],
                        'min'    : args[0],
                        'max'    : args[1],
                        'step'    : args[2]
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

            var callback = args[args.length - 1];

            if(typeof callback === "function") {
                callback.call(this);
            }
            else
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

Dialog.prototype.set = function () {
    var obj = this.nest();
    return obj.set.apply(obj, arguments);
}

Dialog.prototype.disabled = function () {
    var obj = this.nest();
    return obj.disabled.apply(obj, arguments);
}

Dialog.prototype.validate = function () {
    var obj = this.nest();
    return obj.validate.apply(obj, arguments);
}

Dialog.prototype.destroy = function () {

    var components  = this._components,
        parent      = this.parent,
        component;

    while( (component = components.pop()) )
        component.destroy();

    this.element.remove();

    if(parent && (components = parent._components).indexOf(this) > -1) {

        components.splice(components.indexOf(this), 1);

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

Dialog.prototype.style = function (style) {

    if(Array.isArray(style) || typeof style !== "object")
        throw "TypeError: Argument must be an object";

    this._style = $.extend(this._style, style);
    return this.refresh();
}

Dialog.prototype.refresh = function refresh () {

    var components = this._components, component;

    for(var prop in this._style)
      this.element.style(prop, this._style[prop]);

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

Dialog.prototype.each = function () {

    var components = this._components, component;

    for(var i = 0, len = components.length; i < len; i++) {
       components[i].on.apply(components[i], arguments);
    }

    return this;

}

Dialog.prototype.components = function () {
    return this._components;
}

DialogComponent.prototype.trigger    = Dialog.prototype.trigger;
DialogComponent.prototype.insert     = Dialog.prototype.insert;
DialogComponent.prototype.add        = Dialog.prototype.add;
DialogComponent.prototype.nest       = Dialog.prototype.nest;
DialogComponent.prototype.destroy    = Dialog.prototype.destroy;
DialogComponent.prototype.each       = Dialog.prototype.each;
DialogComponent.prototype.components = Dialog.prototype.components;
DialogComponent.prototype.refresh    = Dialog.prototype.refresh;
