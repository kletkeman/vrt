/*
    VRT - Copyright © 2017 Odd Marthon Lende
    All Rights Reserved
*/

import {shrink} from "./shrink.js";
import {random} from "./random.js";
import {Box} from "./box.js";
import * as d3 from 'd3';
import $ from 'jquery';

const boxes = [];

export function toolbar(options) {

    var selection, box;

    options = options || {};

    const commands = [],
        orientation = {
            'vertical': options.vertical || 'top',
            'horizontal': options.horizontal || 'right',
            'stickTo': null
        },
        id = random();

    function add(name, desc, fn) {

        var args = Array.prototype.slice.call(arguments),
            obj;

        if(typeof name == "object") {

          obj = name;
          commands.unshift(obj);
          return obj;

        }
        else {

          commands.unshift(obj = {
              'name': args.shift(),
              'description': typeof desc === 'string' ? args.shift() : ((fn = desc), ""),
              '_on' : false,
              'remove': remove
          });

        }


        if (typeof fn === 'object')
            for (name in fn) {
                if (typeof fn[name] === 'function')
                    obj[name] = fn[name];
            } else {
            while ((fn = args.pop()) && (name = fn.name)) {
                obj[name] = fn;
            }
        }

        return obj;

    }

    function remove(name) {
        var obj = get(name = name || this.name);
        return commands.splice(commands.indexOf(obj), 1), obj;
    }

    function get(name) {
        return commands.filter(function (c) {
            return c.name === name;
        })[0];
    }

    function fade (selection) {

        return !selection || fade.disabled ? (clearTimeout(fade.id), (fade.id = null)) :
            (fade.id = fade.id || setTimeout(function () {
            return hide();
        }, 5000));

    }

    fade.disabled = typeof options.autoHide === "boolean" ? !options.autoHide : false;

    function orient(v, h, s) {

        var t, width, height, top, left;

        if (!arguments.length) {

            if (selection) {

                t = selection.select("#" + id).node(),
                s = orientation.stickTo ? selection.select(orientation.stickTo).node() : selection.node();

                if (s) {

                    width  = s.offsetWidth,
                    height = s.offsetHeight,
                    top    = s.offsetTop,
                    left   = s.offsetLeft;

                    switch (orientation.horizontal) {

                      case "left" :

                        orientation.left = left;

                        break;

                      case "right" :
                      default:

                         orientation.left =
                            (width - t.clientWidth + left);


                    }

                    switch (orientation.vertical) {

                      case "top" :

                         orientation.top  = top;

                         break;

                      case "bottom" :
                      default:

                         orientation.top  =
                            (height - t.clientHeight);


                    }

                    orientation.top  = `${orientation.top + t.parentNode.scrollTop}px`;
                    orientation.left += 'px';
                }
            }

            return orientation;

        }

        orientation.vertical = v,
        orientation.horizontal = h,
        orientation.stickTo = s;

        return invoke;

    }

    function clone () {

        var toolbar_ = toolbar.call(this),
             c        = toolbar_.commands;

        for(var i = 0; i < commands.length; i++)
            c.push(commands[i]);

        return toolbar_;
    }

    function move() {

        var event = d3.event,
            t = selection.select("#" + id);

        if (!t.node() || (box && box.compare(event.clientX, event.clientY)))
            return invoke.call(this);

        return fade(t);

    }

    function invoke (event) {

        var t = selection.select("#" + id),
            width = 0, o;

        try {
          o = orient();
          if(event)
             return (t && t.style("left", o.left).style("top", o.top));
        }
        catch(error) {

        }

        fade();

        if (!commands.length || event) return;

        t = t.node() ? t : selection
            .append("div")
            .attr("class", "widget toolbar")
            .attr("id", id).call(fade);

        t.selectAll("span")
         .data(commands)
         .each(show)
         .enter()
         .append("span")
         .style("opacity", .8)
         .attr("class", function (d) {
             d.element = this;
             return "icon small " + d.name;
         })
         .on("click", click)
         .on("mouseover", over)
         .on("mouseout", out)
         .on("mousedown", down)
         .on("mouseup", up)
         .each(show);

        t.selectAll("span")
         .each(function () {
             width += $(this).outerWidth() + parseInt(d3.select(this).style("margin-right") || 0, 10) + parseInt(d3.select(this).style("margin-left") || 0, 10) + parseInt(d3.select(this).style("padding-left") || 0, 10) + parseInt(d3.select(this).style("padding-right") || 0, 10);
         });

        width += Number.parseInt(t.style("padding-left"), 0, 10) + Number.parseInt(t.style("padding-right"), 0, 10);

        t.style("width", width + 'px');

        box = box || new Box(t.node());

        box.on('scroll', invoke, window)
           .on('resize', invoke, window);

        if (boxes.indexOf(box) === -1)
            boxes.push(box)

        o = orient();

        t.style("left", o.left)
         .style("top", o.top)
         .style("opacity", opacity)
         .style("display", null);

        collision_check();

        return invoke;

    }

    function collision_check () {

         for (var i = 0, a, b; i < boxes.length; i++) {

                a = box,
                b = boxes[i];

                if (a !== b) {

                    if(a.compare(b)) {

                        a = d3.select(a.target);
                        b = d3.select(b.target);

                        if(parseInt(a.style("z-index")) < parseInt(b.style("z-index"))) {
                            a.style("display", "none");
                            b.style("display", null);
                        }
                        else {
                            b.style("display", "none");
                            a.style("display", null);
                        }
                    }
                }
            }
    }

    function destroy() {
        boxes.splice(boxes.indexOf(box, 1));
        return selection.select("#" + id), (box && box.destroy());
    }

    function hide (f) {

        if(typeof f === "boolean" && (fade.disabled = !f)) {}
        else
            d3.select("#" + id)
              .transition(1000)
              .style("opacity", 0);
        return invoke;
    }

    return (selection = d3.select(this).on("mousemove", move)), (invoke.hide = hide), (invoke.id = id), (invoke.destroy = destroy), (invoke.orient = orient), (invoke.add = add), (invoke.get = get), (invoke.remove = remove), (invoke.clone = clone), (invoke.commands = commands), invoke;

}



function opacity () {
    var p = this.parentNode;
    return this.offsetWidth > p.offsetWidth || this.offsetHeight > p.offsetHeight ? 0 : null;
}

function click(d) {
    return d3.event.stopImmediatePropagation(), (d.click && d.click.call(this, d, d3.event)), (d.on && d.off && (d._on ? ( (d._on = false), (d.description = d.off.call(this, d, d3.event))) : ( (d._on = true), (d.description = d.on.call(this, d, d3.event)))));
}

function over(d) {
    return d3.select(this).style("opacity", 1), (d.over && d.over.call(this, d, d3.event));
}

function out(d) {
    return d3.select(this).style("opacity", .8), (d.out && d.out.call(this, d, d3.event));
}

function down(d) {
    return (shrink.call(this, .95), d.down && d.down.call(this, d, d3.event));
}

function up(d) {
    return (shrink.call(this), d.up && d.up.call(this, d, d3.event));
}

function show(d) {
    d3.select(this).classed("on", d._on);
    return ((d.on && d.off) && (!d._on && (d.description = d.off.call(this, d, d3.event)))), (d.show && d.show.apply(this, arguments));
}
