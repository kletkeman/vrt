/*
    VRT - Copyright © 2017 Odd Marthon Lende
    All Rights Reserved
*/

import * as d3 from 'd3';
import {random} from "./random.js";
import {EventEmitter} from 'events';

export function DialogComponent (style, name) {

    EventEmitter.call(this);

    if(typeof name === 'string') {

        Object.defineProperty(this, "name", {
            enumerable: true,
            writable : false,
            value : name
        });

    }

    style = style || {};

    this.element = d3.select(this.element || document.createElement("div"))
        .attr("id", (this.id = random()))
        .classed("dialog-component", true)
        .classed("dialog-component-" + this.name, true);

    this._components = [];
    this._style      = style;

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
