/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

import {DialogComponent} from "./dialog.component.js";
import {random} from "./random.js";

export default function Slider (options) {

    var s, n, l, id = random(), value;

    options = options || {};

    DialogComponent.call(this, options.style, "slider");

    s = n =
    this.element
        .classed("form-horizontal", true)
        .append("div")
        .classed("form-group", true);

    if(classmap[options.size])
        s.classed(classmap[options.size][0], true);

    s.append("label")
     .attr("for", id)
     .classed("col-sm-4 control-label", true)
     .text(options.text || "");


    s =
    s.append("div")
     .classed("col-sm-6", true)
     .append("input")
     .attr("type", "range")
     .attr("min", options.min || 0.)
     .attr("max", options.max || 1.)
     .attr("id", id)
     .attr("name", options.name || options.text.toLowerCase().split(" ")[0])
     .on("input", this.trigger("modified"))
     .attr("step", options.step ? options.step : null)
     .classed("form-control", true);

    if(classmap[options.size])
        s.classed(classmap[options.size][1], true);

    l =
    n.append("label")
     .classed("col-sm-2", true)
     .classed("control-label text-center", true);

    function refresh () {

        var node = s.node(), v = arguments.length ? (value = parseFloat(node.value)) : value;

        if( typeof options.step !== "number" )
            s.attr("step", ( ((options.max || 1) - (options.min || 0)) / node.offsetWidth ) );

        node.value = v;

        return l.node().innerText = v.toPrecision(2), this;
    }

    this.refresh = refresh;

    this.disabled = function (yes) {
        s.node().disabled = yes;
        return this;
    }

    this.set = function (v) {
        return s.node().value = value = v, this.refresh();
    }

    this.node = function () {
        return n.node();
    }

    this.valueOf = function () {
        return value;
    }

    this.on("modified", refresh)
         .set(options.value);
}

Slider.prototype = Object.create(DialogComponent.prototype);
