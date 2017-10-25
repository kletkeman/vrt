/*

    VRT - Copyright © 2017 Odd Marthon Lende
    All Rights Reserved

    A simple layout component

*/

import {DialogComponent} from "./dialog.component.js";
import * as d3 from 'd3';

export function Layout (options) {

    var layout, elements = [], nth = null;

    options = options || {};

    DialogComponent.call(this, options.style, "layout");

    layout = options.data;
    layout = Array.isArray(layout) ? layout : [];

    this.element
        .classed("container-fluid", true)
        .selectAll("div")
        .data(layout)
        .enter()
        .append("div")
        .attr("class", classNames)
        .classed("column", true)
        .each(function () {
            return elements.push(this);
        });

    this.set = function (n) {
        return ( nth = Number(n) ), this;
    }

    this.valueOf = function () {
        return nth;
    }

    this.on("insert", function () {

        var s, node = this.nest().node();

        if(typeof nth === 'number')
            elements[nth].appendChild(node);

    });


}

function classNames (d, i) {
    return String(d);
}

Layout.prototype = Object.create(DialogComponent.prototype);
