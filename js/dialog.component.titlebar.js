/*
    VRT - Copyright © 2017 Odd Marthon Lende
    All Rights Reserved
*/

import {DialogComponent} from "./dialog.component.js";

function dismiss () {
    return this.dialog.destroy();
}

export function TitleBar (options) {

    var context = this, s, t, interactable;

    function dialognode () {
        return context.dialog.node();
    }

    options = options || {};

    DialogComponent.call(this, $.extend(options.style || {}, {
        'width'  : function () { return dialognode().offsetWidth  + 'px'; }
    }), "titlebar");

    s =
    this.element
    .on("mousedown", function () {

        var dialog = context.dialog;

        if(!options.movable) return;

        interactable = interactable || interact(dialognode(), {allowFrom: this})
        .on("dragmove",  function (event) {

            dialog._style.left = parseInt(dialog.element.style('left')) + event.dx + 'px';
            dialog._style.top  = parseInt(dialog.element.style('top')) + event.dy + 'px';

            dialog.refresh();

            dialog.emit("move");

        });

        interactable.draggable(true);
    })
    .on("mouseup", function () {
        if(interactable)
            interactable.draggable(false);
    })
    .append("h5");

    t = s.append("span");

    s.text(options.text)
     .append("div")
     .style("display", "inline-block")
     .style("float", "right")
    .attr("type", "button")
    .classed("glyphicon glyphicon-remove", true)
    .on("click", this.trigger("dismiss"));

    this.set = function (value) {
        t.text(value);
        return this;
    }

    this.destroy = function () {

        if(interactable)
            interactable.unset();

        return DialogComponent.prototype.destroy.call(this);
    }

    this.on("dismiss", dismiss)
        .set(options.text);

}

TitleBar.prototype = Object.create(DialogComponent.prototype);

TitleBar.prototype.refresh = function () {
    this.dialog.element.classed("has-titlebar", true);
    return this;
}
