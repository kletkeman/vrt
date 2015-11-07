/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

define([
      'debug'
    , 'interact'
    , 'jquery'
    , 'types/widget'
    , 'lib/types/base/heatmap'
    , 'lib/api'
    , 'd3'
    , 'types/lib/labels'
    , 'text!types/lib/shaders/minimal.vert.c'
    , 'text!types/lib/heatmap/shaders/cells.frag.c'
    , 'text!types/lib/heatmap/shaders/text.frag.c'
    , 'text!types/lib/shaders/zoom.frag.c'
    , 'text!types/lib/shaders/effect.blur.frag.c'
    , 'text!types/lib/shaders/effect.brightness.frag.c'
    , 'types/lib/effect'
],
    function (
        debug, interact, $, Widget, HeatMap, vrt, d3, labels, vertex_src, draw_src, text_src, zoom_src, blur_src, bright_src, Effect
    ) {
    
        const   transition_time_milliseconds = 1000,
                default_ease                 = d3.ease("cubic-in-out");
    
        debug = debug("widget:heatmap");

        HeatMap.prototype.destroy = function () {

            with(this.canvas.node().getContext("webgl")) {
                with(this.__WebGLObjects) {

                    draw.destroy();
                    zoom.destroy();
                    brightness.destroy();
                    blur.destroy();

                }
            }

            return Widget.prototype.destroy.apply(this, arguments);
        };
    
    
       HeatMap.prototype.blur = function (yes) {
           
           with(this.__WebGLObjects) {
               
               if(yes)
                    blur.use().transition(transition_time_milliseconds)
                        .parameter("dir", "2f", [1., 1.])
                        .render();
               else
                   blur.use().transition(transition_time_milliseconds)
                            .parameter("dir", "2f", [0.,0.])
                            .render();
            }
           
           this.gutter.bottom.transition()
                .duration(transition_time_milliseconds)
                .style("opacity", yes ? 0 : 1);
           
           this.gutter.right.transition()
               .duration(transition_time_milliseconds)
               .style("opacity", yes ? 0 : 1);
           
           return Widget.prototype.blur.call(this, yes);
           
       }

        HeatMap.prototype.create = function () {

            Widget.prototype.create.call(this);
            
            var context    = this,
                element    = d3.select(this.element),
                dimensions = this.dimensions.compensated,
                brush, interactable, gl, texture;
            
            this.options =
            $.extend(true, {
                colors : [
                    "#0000FF",
                    "#4B0082",
                    "#7F00FF",
                    "#00FF00",
                    "#FFFF00",
                    "#FF7F00",
                    "#FF0000"
                ],
                scale : [0, 1]
            }, this.options);
            
            with(this.options) {
                prepend("colors", "color");
            }
            
            this.selector = [
                "label", 0, function (d) {
                    if(typeof d === "number")
                        return d.toFixed();

                    return String(d);
                },
                "value", [1,2], d3.scale.linear().domain(this.options.scale).range([0, 1])
            ];

            this.canvas = element.append("canvas");

            with((gl = this.canvas.node().getContext("webgl"))) {

                getExtension("OES_texture_float");
                getExtension("OES_float_linear");
                getExtension("OES_half_float_linear");

                this.__WebGLObjects = {
                    
                    'textures'  : [
                        (texture = createTexture()), // Value buffer
                        createTexture() // Color buffer
                    ],
                    
                    'brightness' : new Effect (bright_src, vertex_src, gl, function brightness (t, lambda) { 
                        
                        debug("ease brightness, inputs (t, blur, text, zoom, draw)", arguments);
                        
                        this.parameter("brightness", "1f", lambda * 0.5);
                        
                        return 1. - lambda;
                        
                    }),
                    
                    'blur' : new Effect (blur_src, vertex_src, gl, function blur (t, lambda) {
                        
                        debug("ease blur, inputs (t, text, zoom, draw)", arguments);
                        
                        if(lambda) {
                        
                            lambda = lambda < .5 ? 
                                Effect.interpolate(0, 2, lambda) : 
                                Effect.interpolate(2, 0, lambda);

                            this.parameter("dir", "2f", [lambda, lambda]);

                            this.out(lambda);

                        }
                        else {
                            
                            this.out(0);
                            this.interpolate("dir");
                        }

                        return default_ease(t);
                        
                    }),
                    
                    'zoom' : new Effect (zoom_src, vertex_src, gl, function zoom (t) {

                        var offset2f        = this.interpolate("offset"),
                            magnification2f = this.interpolate("magnification");
                       
                        debug("ease zoom, inputs (t, draw)", arguments);
                        
                        this.out(t < 1. ? t : 0);
                        
                        return default_ease(t);

                    }),
                    
                    'draw' : new Effect (draw_src, vertex_src, gl, function draw (t) {

                        var dimensions = this.dimensions();
                        
                        this.activate(0)
                             .texture(texture, {
                                width  : dimensions[1],
                                height : dimensions[0],
                                data   : this.buffer,
                                type   : gl.FLOAT

                            });

                    })
                };

                with(this.__WebGLObjects) {

                    draw.use()
                        .quad("position", 0)
                        .parameter('colors', '1i', 1)
                        .chain(zoom)
                        .use()
                        .parameter('magnification', '2f', [1., 1.])
                        .parameter('offset', '2f', [0., 0.])
                        .chain(blur)
                        .chain(brightness)
                        .use()
                        .parameter("cutoff", "1f", 0.)
                        .mode(Effect.PASSTHROUGH);

                }

            }

            this.overlay = element.append("svg");

            this.gutter = {
                right: element.append("svg"),
                bottom: element.append("svg")
            };

            this.brush = brush = d3.svg.brush()
                .on("brushend", function () {

                    var extent;
                
                    if (!brush.empty() && (extent = brush.extent())) {

                        brush.clear(),
                        context.overlay.select("g.brush").call(brush);
                        
                    }
                });

            this.overlay.on("mousemove", function () {

                var e = d3.event,
                    margin = context.dimensions.margin,
                    cell = select.call(context, e.x - margin.left, e.y - margin.top);

                cell && context.status(cell.value);

            });

            interactable = interact(context.overlay.node()).draggable(true)
            .on("dragend", function () {
            
                
            })
            .on("dragmove", function (event)
            {
              
            });

            with(this) {

                gutter.right.append("g").attr("class", "labels");
                gutter.bottom.append("g").attr("class", "labels");

                gutter.bottom.select("g.labels")
                    .attr("transform", "rotate(-90)");

                brush.y(d3.scale.ordinal());
                brush.x(d3.scale.ordinal());

                toolbar.add("zoom", {

                    'on': function () {

                        interactable.options.draggable = false;

                        overlay.append("g")
                            .attr("class", "brush")
                            .call(brush);

                        return "Drag and move around";

                    },
                    'off': function () {

                        interactable.options.draggable = true;

                        brush.clear();
                        overlay.selectAll("g.brush").remove();

                        return "Select Zoom Area";

                    }
                });

            }
            
            this.blur(false);
        }

        HeatMap.prototype.resize = function () {

            var dimensions = this.dimensions.compensated,
                margin     = this.dimensions.margin,
                width      = dimensions.width,
                height     = dimensions.height,
                context    = this,
                canvas     = this.canvas.node(),
                gl;

            (function () {

                for (var i = 0, selection; i < arguments.length; i++) {

                    selection = arguments[i];

                    selection
                        .style({
                            'position': 'absolute',
                            'left': margin.left + 'px',
                            'top': margin.top + 'px',
                            'z-index': i + 1
                        })
                        .attr('width', width)
                        .attr('height', height);

                }

            })(this.canvas, this.overlay);

            this.gutter.bottom
                .style({
                    'position': 'absolute',
                    'left': margin.left + 'px',
                    'top': height + margin.top + 'px'
                })
                .attr('width', width)
                .attr('height', margin.bottom)
                .attr("class", "gutter");

            this.gutter.right
                .style({
                    'position': 'absolute',
                    'left': width + margin.left + 'px',
                    'top': margin.top + 'px'
                })
                .attr('width', margin.right)
                .attr('height', height)
                .attr("class", "gutter");

            this.brush.y().domain([0, height]).range([0, height]);
            this.brush.x().domain([0, width]).range([0, width]);

            this.brush.clear();

            with(this.__WebGLObjects) {
                zoom.render();
            }
            
            return Widget.prototype.resize.call(this);

        }

        HeatMap.prototype.update = function (label, values, i) {
        
            var e       = this.event,
                draw    = this.__WebGLObjects.draw,
                texture, colors, buffer;
            
            switch(e ? e.type : null) {
                
                case null      :
                    
                    buffer = draw.buffer;
                    
                    draw.render();
                
                    for(var j = 0, length = values.length; j < length; j++) {

                        buffer[(i * (length * 4)) + (j * 4) + 3] = values[j];
                    }
                    
                    buffer.width  = Math.max(buffer.width || 0, i + 1);
                    buffer.height = length;
                    
                    break;
                    
                case 'save'    :
                    
                case 'refresh' :
                    
                    texture = this.__WebGLObjects.textures[1];
                    colors  = this.options.colors.map(convert);
                    
                    draw.buffer = [];
                    
                    for(var i = 0, length = colors.length; i < length; i++) {
                        colors.push.apply(colors, colors[i]);
                        colors.push(255);
                    }

                    colors.splice(0, length);
                    colors = new Uint8Array(colors);

                    draw.activate(1)
                        .texture(texture, {
                            'width'  : colors.length / 4,
                            'height' : 1,
                            10241    : 9729, // TEXTURE_MIN_FILTER : LINEAR
                            10240    : 9729, // TEXTURE_MAG_FILTER : LINEAR
                            'data'   : colors
                    });
                    
                    this.selector[5].domain(this.options.scale);
            }
            
        }

        function convert (hex) { return d3.values(d3.rgb(hex)).slice(0, 3); }
    
        HeatMap.prototype.draw = function () {
            
            var draw   = this.__WebGLObjects.draw,
                buffer = draw.buffer;
            
            if(Array.isArray(buffer)) {
                draw.resize(buffer.width || 0, buffer.height || 0);
                draw.buffer = new Float32Array(buffer);
            }
            
            draw.render();
        }
        
        function Position(index) {
            this.index = index || 0;
            this.width = this.height = this.x = this.y = 0;
        }

        Position.update = function () {

            var heatmap = this,
                dimensions = heatmap.dimensions.compensated,
                width      = dimensions.width,
                height     = dimensions.height,
                data       = heatmap.data,
                selection  = data.selection,
                keys       = selection.keys(),
                columns    = selection.columns(),
                w          = width / columns.length,
                h          = height / keys.length,
                zoom       = heatmap.__WebGLObjects.zoom,
                magnification2f, offset2f, id;
            
            magnification2f = zoom.parameter('magnification');
            offset2f = zoom.parameter('offset');
                    
            if( (id = add(magnification2f, offset2f, w, h)) === zoom.id && id)
                return false;

            zoom.id = id;
            
            for (var i = 0, position, obj, labels = keys.concat(columns), length = labels.length; i < length; i++) {
                
                obj = labels[i];
                
                obj = labels[i] = typeof obj !== "object" ? {
                    'label'    : obj,
                    'position' : new Position(i>=keys.length? (i - keys.length) : i)
                } : obj;

                selection.set(i>=keys.length? (i - keys.length) : -1, i>=keys.length? -1 : i, 0, obj);

                position = obj.position;

                position.width  = w * magnification2f[0];
                position.height = h * magnification2f[1];

                position.x = (position.index * position.width) + (width * (offset2f[0] * magnification2f[0]));
                position.y = (position.index * position.height) + (height * ((offset2f[1] - (1. - (1. / magnification2f[1]))) * magnification2f[1]));
                
            }
            
            return true;
        }

        function select(x0, y0, x1, y1) {

            var i = 0, cells, rows, columns, area,
                selected = {
                    cells   : (cells   = []),
                    rows    : (rows    = []),
                    columns : (columns = [])
                },
                data = this.data,
                len = data.length,
                dimensions = this.dimensions.compensated,
                width = dimensions.width,
                height = dimensions.height,
                two = arguments.length === 2,
                four = arguments.length === 4,
                cell, column, row, values, y, x, x2, y2;

            if (Number.isFinite(x0) && Number.isFinite(y0)) {

                for (; i < len; i++) {

                    row = data[i];

                    if (!(row instanceof Row)) continue;

                    y = row.position.y;

                    y2 = y + row.position.height;

                    if ((two && y <= y0 && y2 >= y0) ||
                        (four && y >= y0 && y2 <= y1) ||
                        (four && y0 >= y && y0 <= y2 && y1 <= y2 && y0 >= y)) {

                        values = row.values;

                        for (var label in values) {

                            cell = values[label];

                            if (!(cell instanceof Cell)) continue;

                            column = cell.column;

                            x = column.position.x;

                            x2 = x + column.position.width;
                            
                            if ((two && x <= x0 && x2 >= x0) ||
                                (four && x >= x0 && x2 <= x1) ||
                                (four && x0 >= x && x0 <= x2 && x1 <= x2 && x0 >= x)) {

                                cells.push(cell);

                                if (two) break;

                                if (columns.indexOf(column) === -1)
                                    columns.push(column);
                            }

                        }

                        if (two) break;

                        rows.push(row);

                    }

                }
            }

            return two ? cell : selected;

        }

        return HeatMap;

    });