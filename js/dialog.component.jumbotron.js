/*
    VRT - Copyright © 2017 Odd Marthon Lende
    All Rights Reserved
*/

import {DialogComponent} from "./dialog.component.js";
import {random} from "./random.js";

export function JumboTron (options) {

    var e, t, c;

    options = options || {};

    DialogComponent.call(this, options.style, "jumbotron");

    e =
    this.element
         .classed("jumbotron", true);

    e.append("h1")
     .text(options.title || "");

    s = e.append("p");

    if(options.link) {

        e.append("p")
         .append("a")
         .attr("role", "button")
         .attr("href", "#")
         .classed("btn btn-primary btn-lg", true)
         .text(options.link)
         .on("click", this.trigger("action"));

        if(options.action)
            this.on("action", options.action);

    }

    this.set = function (value) {
        return s.html(value), this;
    }

    this.valueOf = function () {
        return s.node().innerHTML;
    }

    this.set(options.content);

}

JumboTron.prototype = Object.create(DialogComponent.prototype);
