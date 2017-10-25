/*

    VRT - Copyright © 2017 Odd Marthon Lende
    All Rights Reserved

    Button Group

*/

import {DialogComponent} from "./dialog.component.js";
import * as d3 from 'd3';

export function Buttons (options) {

    var context = this,
        b, buttons, selectedIndex;

    options = options || {};

    DialogComponent.call(this, options.style, "buttons");

    buttons = options.data;
    buttons = Array.isArray(buttons) ? buttons : [];

    selectedIndex = options.selectedIndex;
    selectedIndex = typeof selectedIndex === "number" ? selectedIndex : 0;

    this.selectedIndex = selectedIndex;

    b =
    this.element
        .append("div")
        .classed("btn-group btn-group-xs options", true)
        .attr("role", "group")
        .attr("aria-label", "...");

    b.selectAll("button")
        .data(buttons)
        .enter()
        .append("button")
        .attr("type", "button")
        .classed("btn", true)
        .classed("btn-primary-black", function (_, i) { return i === selectedIndex;})
        .classed("btn-default", function (_, i) { return i !== selectedIndex; })
        .on("click", function (_, i) {

            context.set(i);
            context.emit("modified");

        })
        .append("span")
        .attr("class", classNames);

    this.set = function (j) {

        if(j >= buttons.length)
            return this;

        b.selectAll("button")
             .classed("btn-primary-black", function (_, i) {
            return j === i;
        });

        context.selectedIndex = j;

        return this;
    }

}

function classNames (d, i) {
    return String(d);
}

Buttons.prototype = Object.create(DialogComponent.prototype);
