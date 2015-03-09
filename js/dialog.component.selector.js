/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

define(['js/dialog.component', 'js/dialog.component.datagrid', 'd3', 'interact', 'lib/api', 'debug'],
    function (
        DialogComponent, DataGrid, d3, interact, vrt, debug
    ) { debug = debug("dialog:component:selector");

       var   bs     = 0;
       
       const colors = [
                    
           "#0000FF",
           "#4B0082",
           "#7F00FF",
           "#00FF00",
           "#FFFF00",
           "#FF7F00",
           "#FF0000"
       ];

        function is_string(d) {
            return typeof d === "string";
        }

        function Selector(options) {

            var context = this,
                colors = [],
                isDragging = false,
                interactables = [],
                selector, table, viewport, p, b, parameter_names;

            options = options || {};

            DialogComponent.call(this, options.style);

            selector = Array.isArray(options.data) ? options.data : [];
            parameter_names = selector.filter(is_string);

            function is_range(_, i) {
                return Array.isArray(selector[i * 3 + 1]);
            }

            function is_single(_, i) {
                return typeof selector[i * 3 + 1] === "number";
            }

            function is_cell(_, i) {
                var s = selector[i * 3 + 1];
                return !Array.isArray(s) && typeof s === "object";
            }

            this.element.selectAll("div.parameter")
                .data(parameter_names)
                .enter()
                .append("div")
                .classed("parameter", true)
                .append("div")
                .classed("track", true)
                .classed("range", is_range)
                .classed("single", is_single)
                .classed("cell", is_cell)
                .append("div")
                .classed("handle", true)
                .text(get_value_text)
                .on("mousedown", function (d, i) {
                    
                    context.parent.element
                    .selectAll("div.curtain")
                    .each(function (_, j) {
                        d3.select(this)
                        .style("display", j === i ? null : "none");
                    });
                
                    context.element.selectAll(".track > .handle")
                    .each(function (d, j) {
                        d3.select(this)
                        .style("background-color", j === i ? color(d,j) : null);
                    });
                
                })
                .each(function (_, i) {
                
                    var v        = selector[i * 3 + 1],
                        isArray  = Array.isArray(v),
                        isObject = typeof v === "object",
                        edges    = { left: true, right: true, bottom: false, top: false },
                        left     = 0,
                        width    = 0,
                        f        = 0,
                        a        = 1;
                    
                    function start () {
                            
                        var v = selector[i * 3 + 1];
                        
                        a = (viewport.right - viewport.left) / (viewport.width);
                                
                        isDragging = true;
                        
                        width = 1 / (viewport.width);
                            
                        if(isObject) {
                            
                            if(isArray)
                                width = (v[1] - v[0] + 1) / (viewport.width);
                            
                            v = isArray ? v[0] : v.left;
                        }
                         
                        f    = 1 / (viewport.width),
                        left = v * f;
                        
                            
                    }
                
                    function end () {
                        
                        isDragging = false;
                        
                        context.parent.emit("modified");
                        context.parent.refresh();
                    
                    }                
                
                    d3.select(this)
                      .on("dblclick", function () {
                        
                            start();
                            viewport.pan(left);
                            end();
                        
                    });
                
                    interactables.push(
                    interact(this)
                        .draggable(true)
                        .resizable(Array.isArray(v) ? {
                            "edges": edges
                          } : false)
                        .on('resizestart', start)
                        .on('resizemove', function (event) {
                            
                            var target = d3.select(event.target),
                                rect   = event.deltaRect,
                                v0     = v[0],
                                v1     = v[1],
                                w      = target.node().parentNode.offsetWidth - 4;
                            
                            width += (rect.width / w) * Math.min(w / (viewport.width), 1) * (event.shiftKey ? a : 1);
                            left  += (rect.left  / w) * Math.min(w / (viewport.width), 1) * (event.shiftKey ? a : 1);
                            
                            width = Math.max(0, Math.min(1 - left, width));
                            left  = Math.max(0, Math.min(1 - width, left));
                            
                            snap(left / (1- f), (width - f) / (1 - f), i);
                            
                            if( compare(v0, 0, i) || compare(v1, 1, i) ) {
                                
                                isDragging = false;
                                
                                context.parent.refresh();
                                context.parent.emit("modified");
                                
                                isDragging = true;
                                
                                update_statusbar(i);
                                
                            }
                            
                            target.style({
                                "width" : Math.round(width * w) + "px",
                                "left"  : round( (left / (1 - width)) * (w - target.node().offsetWidth) ) + "px"
                            });
                            
                        })
                        .on('resizeend', end)
                        .on("dragstart", start)
                        .on("dragend", end)
                        .on("dragmove", function (event) {

                            var target = d3.select(event.target),
                                v      = selector[i * 3 + 1],
                                w      = target.node().parentNode.offsetWidth - 4;
                            
                            left += (event.dx / w) * Math.min(w / (viewport.width), 1) * (event.shiftKey ? a : 1);
                            left  = Math.max(0, Math.min(1 - width, left));
                            
                            if(isObject)
                                v = isArray ? v[0] : v.left;

                            snap( left / (1- f), i);

                            if(compare(v, 0, i)) {
                                
                                isDragging = false;
                                
                                context.parent.refresh();
                                context.parent.emit("modified");
                                
                                isDragging = true;
                            
                                update_statusbar(i);
                            }
                            
                            target.style("left", round( (left / (1 - width)) * (w - target.node().offsetWidth) ) + "px");
                            
                        }));
                
                    setTimeout(function () {
                        return start(), snap(left, width, i), end();
                    }, 0);

                });
            
            function compare (a, j, i) {
                        
                var v = selector[i * 3 + 1];
                
                if(typeof v === 'object')
                        return Array.isArray(v) ? a !== v[j] : a !== v.left;
                
                return a !== v;
            }

            this.refresh = function () {

                var s;

                if (!(this.parent instanceof DataGrid))
                    throw "parent is not datagrid component";

                if (isDragging)
                    return;

                table    = this.parent.element.select("table");
                viewport = this.parent.viewport;
                bs       = (parseFloat(table.style("border-spacing")) || 0);

                this.element.selectAll(".track > .handle")
                    .each(position);

                s = this.parent.element
                    .selectAll("div.curtain")
                    .data(parameter_names);

                s.each(stretch);

                s.enter()
                    .append("div")
                    .classed("curtain", true)
                    .classed("range", is_range)
                    .classed("single", is_single)
                    .classed("cell", is_cell)
                    .style("border-color", brighter)
                    .style("display", "none")
                    .each(stretch)
                    .each(function (d, i) {
                    
                        var v        = selector[i * 3 + 1],
                            isArray  = Array.isArray(v),
                            isObject = typeof v === "object",
                            t        = table.node(),
                            b        = table.select("tbody").node(),
                            width, height, left = 0;
                    
                        function move (event) {

                            var target = event.target,
                                v      = selector[i * 3 + 1],
                                l      = Math.max(t.offsetLeft, Math.min( (left += event.dx), (t.offsetWidth + t.offsetLeft))),
                                T      = Math.max(t.offsetTop + b.offsetTop, Math.min( (isObject && !isArray ? event.dy : 0) + target.offsetTop, (t.offsetHeight + t.offsetTop - height))),
                                row, cell, x, y;
                            
                            if(viewport.right === viewport.width)
                                
                                l = Math.min((t.offsetWidth + t.offsetLeft) - width, l);
                            
                            x    = Math.max( b.offsetLeft, Math.min( (t.offsetWidth + t.offsetLeft), (left < t.offsetLeft ? (width + left) - (bs * 2) : l) - b.offsetLeft - t.offsetLeft)) + (!isArray ? (width  / 2) : bs);
                            y    = Math.max( b.offsetTop, Math.min((t.offsetHeight + t.offsetTop),   T - t.offsetTop)) + (!isArray && isObject ? (height / 2) : bs);
                            
                            row  = get_element_from_point(x, y, table.select("tbody").selectAll("tr")[0]);
                            cell = get_element_from_point(x, y, d3.select(row[0]).selectAll("td")[0]);
                            
                            if(isArray && left < t.offsetLeft)
                            
                                cell[1] -= (v[1] - v[0]);
                           
                            if(isObject)
                                
                                v = isArray ? v[0] : v.left;
                            
                            if(!isArray)
                                
                                    snap( (cell[1] + viewport.left ) / viewport.width, ( row[1] + viewport.top ) / viewport.height, i);
                            else
                                
                                snap( (cell[1] + viewport.left ) / viewport.width, i);
                            
                            if(compare(v, 0, i)) {
                                
                                isDragging = false;
                                
                                context.parent.refresh();
                                context.parent.emit("modified");
                                
                                isDragging = true;
                                
                                update_statusbar(i);
                                
                            }
                            
                            target = d3.select(target);
                            
                            
                            
                            if( !parseInt(target.style("border-right-width")) )
                            
                                width = t.offsetWidth;
                            
                            else if (event.dx && left >= t.offsetLeft)
                                
                                width = target.node().offsetWidth;
                            
                            if(viewport.right === viewport.width)
                                 
                                width = Math.min((t.offsetWidth + t.offsetLeft) - l, width);
                            
                            stretch.call(target.node(), d, i, new Rect(
                                (viewport.left === 0) ? false : left < t.offsetLeft || left > (t.offsetWidth + t.offsetLeft),
                                !parseInt(target.style("border-top-width")),
                                false,
                                false,
                                (viewport.right === viewport.width) ? false : (left + width) < t.offsetLeft || (left + width) > (t.offsetWidth + t.offsetLeft),
                                !parseInt(target.style("border-bottom-width"))
                            ));
                            
                            target.style({
                                "top"   : (isObject && !isArray ? round(T) : target.node().offsetTop) + "px",
                                "left"  : Math.max(t.offsetLeft, round(l)) + "px",
                                "width" : Math.min( round((t.offsetWidth + t.offsetLeft) - left),  left < t.offsetLeft ? (width + left) : width) + "px"
                            });
                        }
                    
                        function start (event) {
                            
                            var target = event.target,
                                w      = t.offsetWidth / (viewport.right - viewport.left);
                            
                            isDragging = true;
                            
                            width  = target.offsetWidth;
                            height = target.offsetHeight;
                            left   = target.offsetLeft;
                            
                            target = d3.select(target);
                            
                            width  = isArray && (!parseInt(target.style("border-left-width")) || !parseInt(target.style("border-right-width"))) ? w * (v[1] - v[0]) : width;
                            left   = left - (isArray && !parseInt(target.style("border-left-width")) ? w * Math.max(0, (viewport.left - v[0])) : 0);
                            
                        }
                        
                        function end (event) {

                            isDragging = false;
                            
                            context.parent.emit("modified");
                            context.parent.refresh();
                            
                        }
                    
                        function resize (event) {
                            
                             var target = event.target,
                                v       = selector[i * 3 + 1],
                                v0      = v[0],
                                v1      = v[1],
                                delta   = event.deltaRect,
                                l       = Math.max(t.offsetLeft, Math.min(delta.left + target.offsetLeft, (t.offsetWidth + t.offsetLeft))),
                                row, cell, x, y;
                            
                            width += delta.width;
                            width = Math.min((t.offsetWidth + t.offsetLeft) - l, width);
                            
                            x    = Math.max( 0, Math.min( (t.offsetWidth + t.offsetLeft), l + width - b.offsetLeft - t.offsetLeft)) - bs;
                            y    = b.offsetTop + bs;
                            
                            row  = get_element_from_point(x, y, table.select("tbody").selectAll("tr")[0]);
                            cell = get_element_from_point(x, y, d3.select(row[0]).selectAll("td")[0]);
                            
                            snap( v0 / viewport.width , ( ( cell[1] + viewport.left ) - v0) / viewport.width, i);
                            
                            event.dx = event.dy = 0;
                            
                            d3.select(target).style({
                                "left"  : round(l) + "px"
                            });
                            
                            move(event);
                            
                            if(compare(v0, 0, i) || compare(v1, 1, i))
                                update_statusbar(i);
                            
                        }
                    
                        interactables.push(
                        interact(this)
                        .draggable(true)
                        .resizable(isArray ? {
                            edges: { left: true, right: true, bottom: false, top: false }
                          } : false)
                        .on('resizemove', resize)
                        .on("resizestart", start)
                        .on("resizeend", end)
                        .on("dragstart", start)
                        .on("dragmove", move)
                        .on("dragend", end));
                    
                    });


                return DialogComponent.prototype.refresh.call(this);
            }
            
            this.destroy = function () {
                
                while(interactables.length)
                    interactables.pop().unset();
                
                return DialogComponent.prototype.destroy.call(this);
            }

            function snap (p0, p1, i) {

                var v, length;
                
                switch(arguments.length) {
                        
                        case 2:
                            i  = p1;
                            p1 = undefined;
                            break;
                        case 3:
                            p1 = Math.max(0, Math.min(1, p1)) || 0;
                            break;
                        default:
                            throw "Invalid number of arguments";
                }
                
                p0 = Math.max(0, Math.min(1, p0)) || 0;
                v  = selector[i * 3 + 1];

                debug("snap", p0, p1, i, v);
                       
                if (Array.isArray(v)) {
                    
                    length = typeof p1 === "number" ? round(p1 * viewport.width) : (v[1] - v[0]);
                    
                    v[0] = Math.max(0, Math.min(viewport.width - length, round(p0 * viewport.width)));
                    v[1] = Math.max(0, Math.min(viewport.width - 1, v[0] + length));
                    
                }
                else if (typeof v === "number" || typeof v === "object") {

                    p0 = round(p0 * viewport.width);

                    if (typeof v === "object") {
                        
                        v.left = p0;
                        
                        if(p1 !== undefined)
                            v.top = round(p1 * viewport.height);
                    }
                    else
                        selector[i * 3 + 1] = p0;
                    
                }
            }
            
            function update_statusbar (i) {
                
                var v = selector[i * 3 + 1];
                
                if(Array.isArray(v)) {
                    return vrt.controls.status( context.parent.data.get(v[0] - 1, -1) + " : " + context.parent.data.get(v[1] - 1, -1) );
                }
                else
                    return vrt.controls.status( context.parent.data.get( (typeof v === "number" ? v : v.left) - 1, -1) + ( typeof v === "object" ? " ^ " + context.parent.data.get(-1, v.top) : "" ) );
            }
            
            function Rect (left, top, width, height, right, bottom) {
                
                
                this.left     = left;
                this.top      = top;
                this.right    = typeof right !== "object" ? right : undefined;
                this.bottom   = bottom;
                this.width    = width;
                this.height   = height;
                this.overflow = typeof right === "object" && right ? right : undefined;
                
            }
            
            function rect (x0, y0, x1, y1) {
                
                var length = arguments.length,
                    two    = length === 2,
                    four   = length === 4,
                    h      = viewport.bottom - viewport.top + 1, 
                    w      = viewport.right - viewport.left + 1,
                    t      = viewport.top,
                    l      = viewport.left, s, overflow;
                
                overflow = new Rect(
                    
                    x0 < viewport.left || x0 > viewport.right,
                    y0 < viewport.top  || y0 > viewport.bottom,
                    
                    (x0 < viewport.left && (two || x1 < viewport.left)) || (x0 > viewport.right   && (two || x1 > viewport.right)),
                    (y0 < viewport.top  && (two || y1 < viewport.top))  || (y0 > viewport.bottom  && (two || y1 > viewport.bottom)),
                    
                    x1 < viewport.left || x1 > viewport.right,
                    y1 < viewport.top  || y1 > viewport.bottom
                    
                );
                
                x0 += 1 - viewport.left;
                y0 += 1 - viewport.top;
                x1 += 1 - viewport.left;
                y1 += 1 - viewport.top;
               
                x0 = Math.max(1, Math.min(w, x0));
                y0 = Math.max(1, Math.min(h, y0));
                x1 = Math.max(1, Math.min(w, x1));
                y1 = Math.max(1, Math.min(h, y1));
                
                w = h = l = t = 0;
                
                if(two) {
                    s =
                    table.selectAll("tbody tr:nth-child(" + y0 + ") td:nth-child(" + x0 + ")");
                }
                else if (four) {
                    s =
                    table.selectAll("tbody tr:nth-child(n+" + y0 + "):nth-child(-n+" + y1 + ") td:nth-child(n+" + x0 +"):nth-child(-n+" + x1 + ")");
                }
                
                s.each(function (_, i) {
                    
                    t  += i === 0 ? this.offsetTop  - bs : 0;
                    l  += i === 0 ? this.offsetLeft - bs : 0;
                    
                    w  += i <= (two ? x0 : (x1 - x0))            ? this.offsetWidth  + bs : 0;
                    h  += (i % (two ? x0 : (x1 - x0) + 1)) === 0 ? this.offsetHeight + bs : 0;

                });
                
                return new Rect(l, t, w, h, overflow);
                
            }

            function stretch (d, i, o) {

                var s = d3.select(this),
                    t = table.node(),
                    v = selector[i * 3 + 1],
                    r;
                
                if (Array.isArray(v)) {
                    
                    r = rect(v[0], 0, v[1], viewport.height);
                    
                }
                else if (typeof v === "number" || typeof v === "object") {
                    
                    if(typeof v === "object")
                        r = rect(v.left, v.top);
                    else
                        r = rect(v, 0, v, viewport.height);
                         
                }
                
                o = typeof o === "object" ? o : r.overflow;

                s.style({
                    "left"                : r.left   + t.offsetLeft + "px",
                    "top"                 : r.top    + t.offsetTop + "px",
                    "width"               : r.width  + "px",
                    "height"              : r.height + "px",
                    "border-top-width"    : o.top    ? 0 : null,
                    "border-bottom-width" : o.bottom ? 0 : null,
                    "border-left-width"   : o.left   ? 0 : null,
                    "border-right-width"  : o.right  ? 0 : null,
                    "visibility"          : o.width || o.height ? "hidden" : null 
                });
                
                o.left   = !o.left;
                o.right  = !o.right;
                o.bottom = false;
                o.top    = false;
                
                interact(this).resizable(Array.isArray(v) ? { "edges" : o } : false);

            }

            function position (d, i) {

                var s = d3.select(this),
                    t = table.select("tbody > tr > td").node(),
                    w = s.node().parentNode.offsetWidth - 4,
                    v = selector[i * 3 + 1],
                    f = 1 / (viewport.width), left, width;

                if (Array.isArray(v)) {

                    width = round(f * (v[1] - v[0] + 1) * w);
                    left  = Math.min(w - width, round(f * v[0] * w));

                }
                else if (typeof v === "number" || typeof v === "object") {

                    if (typeof v === "object")
                        v = v.left || 0;

                    width = round(f * w);
                    left  = Math.min(w - width, round(f * v * w));

                }
                
               s.style({
                    "width" : width + "px",
                    "left"  : round( (left / (w - width)) * (w - Math.max(width, parseInt(s.style("min-width")) || 0)) ) + "px"
                });
                
            }
            
            setTimeout(function () {
                
                context.parent.element
                    .node().insertBefore(
                        context.element.node(),
                        table.node()
                );
                
                context.parent.emit("modified");
                context.dialog.refresh();
                
            }, 0);

        }
    
        function get_element_from_point (x, y, elements) {
            
            var element;
                
            for(var i = 0, length = elements.length; i < length; i++) {
                    
                element = elements[i];
                    
                if(y >= element.offsetTop - bs  && y <= element.offsetTop - bs  + element.offsetHeight + bs &&
                   x >= element.offsetLeft - bs && x <= element.offsetLeft - bs + element.offsetWidth + bs)
                    break;
            }
                
            return [element, i];
                
        }

        function round () {
            return Math.round.apply(Math, arguments);
        }

        function brighter (_, i) {
            return d3.rgb(color(_, i)).brighter().toString();
        }

        function color (_, i) {
            colors[i] = colors[i] || d3.rgb(Math.random() * 255, Math.random() * 255, Math.random() * 255).toString();
            return colors[i];
        }

        function get_value_text (d) {
            return String(d);
        }

        Selector.prototype = new DialogComponent("selector");

        return Selector;

    })