/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

define(['js/dialog.component', 'lib/data3', 'js/viewport'], function (DialogComponent, Data3, ViewPort) {

    function DataGrid (options) {
        
        const viewport = new ViewPort();

        var context = this,
            refreshInterval,
            t, h, b, m, nav, data3;

        options = options || {};

        DialogComponent.call(this, options.style);

        if (!(data3 = options.data) instanceof Data3)
            throw "data is not a valid";
        
        refreshInterval = options.refreshInterval || 1000;
        
        refreshInterval =
        setInterval(refresh.bind(this), refreshInterval);
        
        this.on("destroy", function () {
            clearInterval(refreshInterval);
        });
        
        t =
            this.element
            .classed("table-responsive", true)
            .append("table")
            .classed("table", true);

        h =
            t.append("thead")
             .append("tr")
             .classed("margin columns", true);

        b =
            t.append("tbody");
        
        // Right
        this.insert("scrollbar", {
                element : t.node(),
                style : {
                    position : "absolute",
                    left     : function () {
                        var node = t.node();
                        return node.offsetLeft + node.offsetWidth + "px";
                    },
                    top : function () {
                        return  b.node().offsetTop + t.node().offsetTop + "px";
                    },
                    height   : function () {
                    
                        var node  = b.select("tr:last-child td:last-child").node(),
                            bottom = node ? node.offsetTop + node.offsetHeight : 0,
                            top;

                        node = first = b.select("tr:first-child td:last-child").node();
                        top  = node ? node.offsetTop : 0;

                        return  (bottom - top) + "px";
                    }
                },
                position : viewport.position.top,
                size     : viewport.size.vertical
            })
            .nest()
            .on("scroll", function (alpha) {
                viewport.pan(null, alpha);
                context.refresh();
            });
        
        // Bottom scrollbar
        this.insert("scrollbar", {
            element : t.node(),
            style : {
                position : "absolute",
                top     : function () {
                    var node = t.node();
                    return node.offsetTop + node.offsetHeight + "px";
                },
                left : function () {
                    return t.node().offsetLeft + "px";
                },
                width   : function () {
                    
                    var node = t.node();
                    return node.offsetWidth + "px";
                }
            },
            position : viewport.position.left,
            size     : viewport.size.horizontal
        })
        .nest()
        .on("scroll", function (alpha) {
            viewport.pan(alpha);
            context.refresh();
        });
        
        function vp_multiply_map (d, i) { return d + (i ? 0 : 1)}
        
        function refresh () {
            
            var node = b.node(), dimensions = data3.dimensions();
            
            if(dimensions[0] + dimensions[1] + dimensions[2] === 0)
                return;
            
            viewport.multiply.apply(viewport, data3.dimensions().map(vp_multiply_map));
            
            viewport.zoom( Math.floor( Math.max(1, viewport.width / (node.offsetWidth / 100) ) ) );
            
            header.call(this, h, data3.columns(), viewport);
            
            viewport.zoom(null, Math.floor( Math.max(1, viewport.height / ( ( this.dialog.element.node().offsetHeight - (this.element.node().offsetTop + node.offsetTop + t.node().offsetTop) ) / 25) ) ))
            
            body.call(this, b, data3.slice(0, 1)[0], viewport); // change later to select paginated slice
            
            return DialogComponent.prototype.refresh.call(this);
        }
        
        this.refresh = refresh;

        function color_selector (d) {

            var color,
                t = get_value_text(d);

            if (t) {

                color =
                    context.dialog.insert("color", {
                        text: t,
                        size: "large",
                        value: d3.rgb(Math.random() * 255,Math.random() * 255,Math.random() * 255).toString()
                    }).nest();

                color.element.remove();

                color.element
                    .selectAll(".col-sm-8, .col-sm-4")
                    .classed("col-sm-8 col-sm-4", false);

                return color.node();

            }

            return document.createElement("span");

        }

        function header (s, columns, viewport) {
            
            columns = columns.slice.apply(columns, [viewport.left, viewport.right + 1 ]);
            
            s =
            s.selectAll("th")
             .data(columns);
            
            s.select("div")
             .select("span")
             .text(get_value_text);
            
            s.enter()
                .append("th")
                .classed("rotate", true)
                .append("div")
                .append("span")
                .text(get_value_text);
            
            s.exit().remove();

        }

        function body (s, d2, viewport) {

            var keys = d2.keys();

            s =
            s.classed("has-keys", viewport.left === 0)
             .selectAll("tr")
             .data(keys.slice.apply(keys, [viewport.top, viewport.bottom + 1]).map(function (k, i) {
                 var r = d2.row(keys.indexOf(k));
                 return r.slice.apply(r, [viewport.left, viewport.right + 1]);
             }));

            s.call(row);

            s.enter()
             .append("tr")
             .call(row);
            
            s.exit().remove();
            
            
        }

        function row (s) {

            s =
            s.selectAll("td")
             .data(function (d, i) {
                 return d;
             });
            
            //filter("td:not(:first-child)")
            s.text(get_value_text);
            
            s.filter("td:first-child")
             .classed("margin keys", viewport.left === 0)
             .select(".control-label")
             .text(get_value_text);

            s.enter()
                .append("td")
                .text(get_value_text)
                .filter("td:first-child")
                .classed("margin keys", viewport.left === 0)
                .text(get_value_text);
            
            s.exit().remove();

        }

        this.viewport = viewport;
        this.data     = options.data
        
    }

    function get_value_text (d) {
        return d === null ? "" : String(d);
    }

    DataGrid.prototype = new DialogComponent("datagrid");

    return DataGrid;

})