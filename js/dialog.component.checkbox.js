/*
    VRT - Copyright © 2017 Odd Marthon Lende
    All Rights Reserved
*/

import {DialogComponent} from "./dialog.component.js";
import {random} from "./random.js";

const classmap = {

    'large': 'form-group-lg',
    'small': 'form-group-sm',
    'smallest': 'form-group-xs'

};

export function CheckBox (options) {

    var s, id = random();

    options = options || {};

    DialogComponent.call(this, options.style, "checkbox");

    s =
    this.element
        .classed("form-horizontal", true)
        .append("div")
        .classed("form-group", true);

    if(classmap[options.size])
        s.classed(classmap[options.size], true);

    s.append("label")
     .attr("for", id)
     .classed("col-sm-4 control-label", true)
     .text(options.text || "");

    s =
    s.append("div")
     .classed("col-sm-8", true)
     .append("input")
     .attr("type", "checkbox" )
     .attr("checked", options.checked || null)
     .attr("id", id)
     .attr("name", options.name || options.text.toLowerCase().split(" ")[0])
     .classed("form-control", true)
     .on("change", this.trigger("modified"))
     .node();

    this.set = function (checked) {
        return (s.checked = !!checked);
    }

    this.node = function () {
        return s.parentNode.parentNode;
    }

    this.valueOf = function () {
        return !!s.checked;
    }

}

CheckBox.prototype = Object.create(DialogComponent.prototype);
