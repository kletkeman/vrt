/*
    VRT - Copyright © 2017 Odd Marthon Lende
    All Rights Reserved
*/

import {Dialog} from "./dialog.js";
import {DialogComponent} from "./dialog.component.js";
import * as d3 from 'd3';
import $ from 'jquery';

export function ContextMenuDialog ( element, leftClick ) {

    var show_t      = this.trigger("show"),
        hide_t      = this.trigger("hide"),
        dialog      = this,
        style       = {},
        escape_exit = function(event) {
          if(event.keyCode === 27)
            hide_t(event);
        }.bind(this);

    leftClick = !!leftClick;

    this.element = document.createElement("ul");

    Dialog.call(this, "contextmenu-dialog", style);

    if(element) {

        element.addEventListener(leftClick ? "click" : "contextmenu", show_t);

        this.on("destroy", function () {
            element.removeEventListener(leftClick ? "click" : "contextmenu", show_t);
        });

    }

    this.element
        .on("mouseover", this.trigger("focus"))
        .on("mouseout", this.trigger("blur"));

    this.on("show", function (event) {

        var parent = this, element = this.element.node();

        d3.selectAll(".contextmenu-dialog")
          .style("display", "none");

        while( parent ) {
            parent.style({"display": null});
            parent = parent.parent;
        }

        event = event || window.event;

        event.preventDefault();
        event.stopPropagation();

        parent = this.parent;

        style.display = null;

        style.left =
          (parent ?
            event.target.parentNode.offsetLeft +
               d3.select(event.target).select(".glyphicon-menu-right").node().offsetLeft : event.x);

        style.top =
          (parent ?
            event.target.parentNode.offsetTop + event.target.offsetTop : event.y);

        style.left = (style.left - Math.max(0, style.left + $(element).outerWidth() - $(element.parentNode).outerWidth() ));

        style.top = (style.top - Math.max(0, style.top + $(element).outerHeight() - $(element.parentNode).outerHeight() ));

        element = this.element;

        style.left = Math.max(0, style.left) - Number.parseInt(element.style("margin-right")) - Number.parseInt(element.style("margin-left")) + "px";

        style.top = Math.max(0, style.top) - Number.parseInt(element.style("margin-top")) - Number.parseInt(element.style("margin-bottom"))+ "px";


        this.refresh();
        window.addEventListener("click", hide_t);
        window.addEventListener("keyup", escape_exit);

        return false;

    }).on("hide", function (event) {

      event = event || window.event;
      style.display = "none";
      this.refresh();
      window.removeEventListener("click", hide_t);
      window.removeEventListener("keyup", escape_exit);

    }).on("focus", focus)
      .on("blur", focus);

    this.emit("hide");

}

function focus () {
    this.element.classed("focus", d3.event && d3.event.type === "mouseover");
}

ContextMenuDialog.prototype = Object.create(Dialog.prototype);

ContextMenuDialog.prototype.add = function add(classnames, html, desc, action) {

    var style = {}, dialog = this, item;

    if(html instanceof DialogComponent) {
      item = html;
    }
    else if(arguments.length < 4) {
        fn = desc;
        desc = html;
        html = classnames;
        classnames = null;
    }

    (item = item || new ContextMenuItem({
        'html'        : html,
        'description' : desc,
        'style'       : style
    }))
    .on("action", action);

    if(this instanceof ContextMenuItem) {

        if(!this.next) {
            this.next        = new ContextMenuDialog();
            this.next.parent = this.dialog;
        }

        this.element
            .classed("has-submenu", true)
            .on("mouseover", this.trigger("menu-next"))
            .append("span")
            .classed("glyphicon glyphicon-menu-right", true);

        this.next.insert(item);

        item.parent = this;

        this.on("menu-next", function () {

            var parent = this;

            this.next.emit("show");

            d3.selectAll(".contextmenu-dialog .active, .contextmenu-dialog.active")
              .classed("active", false);

            while(parent) {

                if(parent.dialog)
                    parent.dialog.element.classed("active", true);

                parent.element.classed("active", true);
                parent = parent.parent;

            }

            focus.call(this);
            this.dialog.emit("focus");

        });
    }
    else this.insert(item);

    item.element.classed(classnames || "", true);

    return this.next || this;
}

function node (n) {
    return n;
}

function ContextMenuItem (options) {

    var s;

    options = options || {};

    this.element = document.createElement("li");

    DialogComponent.call(this, options.style, "contextmenu-item");

    this.element.html(options.html);

    this.element
        .on("mouseover", this.trigger("focus"))
        .on("mouseout", this.trigger("blur"))
        .on("click", this.trigger("action"));

    this.on("focus", activate)
        .on("blur", deactivate);

}

function  activate () {

    var parent = this;

    d3.selectAll(".contextmenu-dialog")
      .style("display", "none");

    while( parent ) {

        parent.element.classed("active", true);

        if(parent.dialog) {
            parent.dialog.element.classed("active", true);
            parent.dialog.element.style("display", null);
        }

        parent = parent.parent;
    }

    focus.call(this);
    this.dialog.emit("focus");

}

function deactivate () {
    d3.selectAll(".contextmenu-dialog .active, .contextmenu-dialog.active")
      .classed("active", false);
    focus.call(this);
    this.dialog.emit("focus");
}

ContextMenuItem.prototype     = Object.create(DialogComponent.prototype);
ContextMenuItem.prototype.add = ContextMenuDialog.prototype.add;
