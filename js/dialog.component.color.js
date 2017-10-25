/*
    VRT - Copyright © 2017 Odd Marthon Lende
    All Rights Reserved
*/

import {DialogComponent} from "./dialog.component.js";
import {random} from "./random.js";

const classmap = {

    'large'    : ['form-group-lg', 'color-square'],
    'small'    : ['form-group-sm', 'color-square'],
    'smallest' : ['form-group-xs', 'color-square'],

};

export function Color (options) {

    var context = this, s, n, data = [], current;

    options = options || {};

    DialogComponent.call(this, options.style, "color");

    s = n =
    this.element
        .classed("form-horizontal", true)
        .append("div")
        .classed("form-group", true);

    if(classmap[options.size])
        s.classed(classmap[options.size][0], true);

    s.append("label")
     .classed("col-sm-4 control-label", true)
     .text(options.text || "");

    s =
    s.append("div")
     .classed("col-sm-8", true)
     .append("div")
     .classed("colors", true)
     .on("mouseover", function () {
        s.select(".control.add")
         .style("display", null);
     })
    .on("mouseout", function () {
        s.selectAll(".control")
         .style("display", "none");
        s.selectAll("label")
         .style("opacity", null);
     });

    if(Array.isArray(options.value)) {

        s.selectAll("span.control")
         .data(["add", "subtract"])
         .enter()
         .append("span")
         .attr("class", function (name) {
            return name;
         })
         .classed("control glyphicon", true)
         .style("display", "none")
         .on("click", function (name) {

            var button = this,
                values = context.valueOf(),
                done   = false,
                part;

            s.selectAll(".color-square")
             .each(function (_, i) {

                if(name === "subtract" && (done = this === current))
                    values.splice(i, 1);
                 else if(name === "add" && (done = this === current)) {

                    part = values.splice(i + 1);

                    values.push("#ffffff");
                    values = values.concat(part);

                }

            });

            if(!done)
                values.push("#ffffff");

            context.set(values);
            context.emit("modified");

         });

    }

    function map_values (v, i) {

        var d = data[i];

        if(d) {
            d.value = v;
            return d;
        }

        return {value: v, id: random()};
    }

    this.set = function (value) {
        data = (Array.isArray(value) ? value : [value] ).map(map_values);
        return this.refresh();
    }

    this.disabled = function (yes) {

        s.selectAll("input")
         .each(function () {
            this.disabled = yes;
        });

        return this;
    }

    this.node = function () {
        return n.node();
    }

    this.valueOf = function () {
        return Array.isArray(options.value) ? data.map(getValue) : data[0].value;
    }

    function modified (d, i) {
        d.value = this.value;
        context.emit("modified");
    }

    function refresh () {

        var c, u;

        s.selectAll(".control")
         .style("display", "none");

        c =
        s.selectAll("label")
         .style("opacity", null)
         .data(data)
         .call(update);

        u =
        c.enter()
         .append("label")
         .on("mouseover", function (_, i) {

            var plus = s.select(".control.add")
                        .style("display", null),

                minus = s.select(".control.subtract")
                        .style("display", null),

                top   = this.offsetTop;

            current = this;

            d3.event.stopPropagation();

            s.selectAll(".color-square")
             .each(function (_, j) {

                if(j === i) {

                    minus.style({
                        "left" : this.offsetLeft + "px",
                        "top"  : (this.offsetTop + this.offsetHeight) + "px"
                    });


                    plus.style({
                        "left" : this.offsetLeft + "px",
                        "top"  : (this.offsetTop - this.offsetHeight) + "px"
                    });
                }

            })
            .style("opacity", function () {
                return this.offsetTop !== top ? .05 : null;
            })

         })
         .on("mouseout", function () {
             d3.event.stopPropagation();
        });

        if(classmap[options.size])
            u.classed(classmap[options.size][1], true);

        u.attr("for", getId)
         .append("input")
         .attr("type", "color")
         .style("visibility", "hidden")
         .attr("id", getId)
         .on("input", modified);

        u.call(update);

        c.exit().remove();

        return this;
    }

    this.refresh = refresh;

    this.on("modified", refresh)
         .set(options.value);
}

function getId (d) { return d.id; }
function getValue (d) { return d.value; }

function update (s) {

    s.select("input")
     .attr("value", getValue);

    s.style("background-color", getValue);

}

Color.prototype = Object.create(DialogComponent.prototype);
