/*
    VRT - Copyright © 2017 Odd Marthon Lende
    All Rights Reserved
*/

import {DialogComponent} from "./dialog.component.js";
import {random} from "./random.js";
import $ from 'jquery';

const classmap = {

    'large'    : 'form-group-lg',
    'small'    : 'form-group-sm',
    'smallest' : 'form-group-xs'

};

function get_value (d) { return d; }

function Select (options) {

    var s,n, id = random();

    options = options || {};

    DialogComponent.call(this, options.style, "select");

    s = n =
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
     .append("select")
     .classed("form-control", true)
     .attr("id", id)
     .attr("name", options.name || options.text.toLowerCase().split(" ")[0])
     .on("change", this.trigger("modified"))
     .selectAll("option")
     .data(options.records || [])
     .text(get_value);

    function is_selected (d) {
        return d === options.value ? "" : null;
    }

    s.enter()
     .append("option")
     .text(get_value)
     .attr("value", get_value)
     .attr("selected", is_selected)

    s.exit()
     .remove();

    this.disabled = function (yes) {
        s.node().disabled = yes;
        return this;
    }

    this.set = function (value) {
        return $(s.node().parentNode).val(value, false), this;
    }

    this.node = function () {
        return n.node();
    }

    this.valueOf = function () {
        var field = s.node().parentNode;
        return field.options[field.selectedIndex].value;
    }

}

Select.prototype = Object.create(DialogComponent.prototype);
