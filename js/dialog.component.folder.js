/*
    VRT - Copyright © 2017 Odd Marthon Lende
    All Rights Reserved
*/

import {DialogComponent} from "./dialog.component.js";

export function Folder(options) {

    var u, s, collapsed;

    options = options || {};

    DialogComponent.call(this, options.style, "folder");

    u = s =
    this.element
        .classed("form-horizontal", true)
        .classed("collapsed", (collapsed = !!options.collapsed));

    u.append("h6")
     .classed("title", true)
     .text(options.text)
     .on("click", this.trigger("collapse"))
     .append("span")
     .classed("glyphicon", true);

    u =
    u.append("ul");

    this.on("insert", function (comp) {

        d3.select(comp.node()).remove();

        u.append("li")
         .append(function () {
            return comp.node();
        });
    });

    function collapse () {
        s.classed("collapsed", (collapsed = !collapsed));
        this.dialog.refresh();
    }

    this.on("collapse", collapse);

}

Folder.prototype = Object.create(DialogComponent.prototype);
