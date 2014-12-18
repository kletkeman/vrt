/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

define([
      'debug'
    , 'interact'
    , 'jquery'
    , 'types/dataset'
    , 'lib/types/base/grid'
    , 'lib/api'
    , 'd3'
    , 'js/viewcontroller.contextmenu'
    , 'text!types/lib/grid/shaders/minimal.vert.c'
    , 'text!types/lib/grid/shaders/cells.frag.c'
    , 'text!types/lib/grid/shaders/zoom.frag.c'
    , 'text!types/lib/shaders/effect.blur.frag.c'
    , 'types/lib/effect.js'
],
function(
      debug
    , interact
    , $
    , DataSet
    , Grid
    , vrt
    , d3
    , contextmenu
    , vertex_src
    , draw_src
    , zoom_src
    , blur_src
    , Effect
    
) { debug = debug("widget:grid");

    const transition_time_milliseconds = 250,
          default_ease = d3.ease("cubic-in-out");
    
    $.extend(Grid.prototype, Grid.prototype.__proto__, $.extend({}, Grid.prototype));
    
    $.extend(Grid.required, {
        '__queue'     : Array,
        '__WebGLObjects' : Object
    });
    
    function glyphs (fontSize, color) {
        
        var chars  = d3.range(32, 126).map(function(d) {return String.fromCharCode(d); }),
            canvas = document.createElement("canvas"),
            ctx    = canvas.getContext("2d"),
            size   = Math.ceil(Math.sqrt(chars.length)),
            wh,  m = {};
        
        color    = color || 'black';
        fontSize = fontSize || 8;
        
        canvas.width = canvas.height = size * (wh = fontSize);

        with (ctx) {
          imageSmoothingEnabled = true;
          textAlign = 'center';
          textBaseline = 'middle';
          fillStyle = color;
          font = fontSize + "px Arial";
        }

        for(var y = 0; y < size; y++)
        {
           for(var x = 0, char, charcode; x < size; x++)
           {
             if(( char = chars[((y * size) + x)])) {
                 
                 charcode = char.charCodeAt(0);
                 
                 m[charcode] = new Float32Array([ (x * wh) / canvas.width, (y * wh) / canvas.height, 0., 0. ]);
                 
                 m[charcode][2] =  m[charcode][0] + (wh / canvas.width);
                 m[charcode][3] =  m[charcode][1] + (wh / canvas.height);
                 
                 ctx.fillText(char, (x*wh) + (wh/2), (y*wh) + (wh/2));
                 
                 //debug.enabled && debug(char, ctx.measureText(char));
                 
             }
           }
        }
        
        if(debug.enabled) {
            debug("glyphs.image", canvas.toDataURL());
            debug("glyphs.size", fontSize );
        }
        
        return {
            size        : fontSize,
            image       : ctx.getImageData(0, 0, canvas.width, canvas.height),
            coordinates : function (text)
            {
                
                var data = new Float32Array(new ArrayBuffer(text.length * 4 * 4));
                
                for(var i = 0, li, charcode, len = text.length; i < len; i++)
                {
                    charcode = text.charCodeAt(i);
                    
                    li = i * 4;
                    
                    data[li]   = m[charcode][0];
                    data[li+1] = m[charcode][1];
                    data[li+2] = m[charcode][2];
                    data[li+3] = m[charcode][3];
                    
                }
                
                return data;
            }
        };
    }
    
    Grid.prototype.destroy = function () {
        
        with(this.canvas.node().getContext("webgl")) { with(this.__WebGLObjects) {
            
            draw.destroy();
            zoom.destroy();
            blur.destroy();
            
            deleteBuffer(vb);     
            deleteFramebuffer(fb); 
            deleteRenderbuffer(rb); 
            deleteTexture(tex[0]); 
            deleteTexture(tex[1]);
            deleteTexture(tex[2]);
            deleteTexture(tex[3]);
            
        }}
        
        return Object.unobserve(this.columns), DataSet.prototype.destroy.apply(this, arguments);
    };
        
    Grid.prototype.create = function () {
        
        var context = this,
            element = d3.select(this.element),
            brush, interactable, gl;
        
        this.__queue = [];
        
        this.canvas  = element.append("canvas");
        
        with( (gl = this.canvas.node().getContext("webgl")) ) {
            
            getExtension("OES_texture_float");
            getExtension("OES_float_linear");
            getExtension("OES_half_float_linear");
            
            this.__WebGLObjects = {
                vb        : createBuffer(),
                tex       : [createTexture(), createTexture(), createTexture(), createTexture()],
                fb        : createFramebuffer(),
                rb        : createRenderbuffer(),
                text : null,
                blur      : new Effect(blur_src, vertex_src, gl, function (t) 
                {
                        
                }),
                zoom      : new Effect(zoom_src, vertex_src, gl, function (t)
                {
                    
                    var cell2f,
                        offset2f        = this.interpolate("offset"),
                        magnification2f = this.interpolate("magnification"),
                        size;
                    
                    with(context.__WebGLObjects) {
                        
                        cell2f = draw.parameter("cell");
                        size   = (cell2f[1] * magnification2f[1]) / 2.;
                            
                        if(!text || size !== text.size)
                          ( text = glyphs(size)       );
                            
                    }
                    
                    return default_ease(t);
                    
                }),
                draw      : new Effect(draw_src, vertex_src, gl, function (obj)
                {

                    if(obj instanceof Column) {

                        with( this.gl ) { with(context.__WebGLObjects) {

                            bindFramebuffer(FRAMEBUFFER, fb);

                            activeTexture(TEXTURE1);
                            bindTexture(TEXTURE_2D, tex[1]);

                            texImage2D(TEXTURE_2D, 0, RGBA, obj.domain.length / 4, 1, 0, RGBA, UNSIGNED_BYTE, obj.domain);

                            activeTexture(TEXTURE2);
                            bindTexture(TEXTURE_2D, tex[2]);

                            texSubImage2D(TEXTURE_2D, 0, 0, obj.position.index, obj.data.length / 4, 1, RGBA, FLOAT, obj.data);

                            this.parameter('unused', '1i', obj.data.length - context.data.length)
                                .parameter('repeat', '2f', [obj.position.repeat, 1.])
                                .parameter('bounds', '4f', [obj.position.index, 0, 1, context.data.length]);

                        }}
                    }

                })
            };
            
            with(this.__WebGLObjects) {
                
                bindBuffer(ARRAY_BUFFER, vb);
                bufferData(ARRAY_BUFFER, new Float32Array([-1,1, -1,-1, 1,1, 1,-1]), STATIC_DRAW);                
                bindAttribLocation(draw.program, 0, 'vertex_p');
                enableVertexAttribArray(0);                
                vertexAttribPointer(0, 2, FLOAT, false, 0, 0);
                                
                draw.use()
                    .parameter('bounds', '4f', [0.,0.,0.,0.])
                    .parameter('domain', '1i', 1)
                    .parameter('values', '1i', 2)
                    .parameter('repeat', '2f', [1,1]);
                
                zoom.use()
                    .parameter('magnification', '2f', [1., 1.])
                    .parameter('offset', '2f', [0., 0.]);
                
            }
            
        };

        this.overlay = element.append("svg");

        this.gutter  = {
            right  : element.append("svg"),
            bottom : element.append("svg")
        };
        
        this.brush = brush = d3.svg.brush()
            .on("brushend", function () {
 
                var dimensions      = context.dimensions,
                    height          = dimensions.height,
                    width           = dimensions.width,
                    magnification2f = context.zoom(),
                    offset2f        = context.shift(),
                    extent, selection;
            
                if(!brush.empty() && (extent = brush.extent())) {
                    
                    brush.clear(),
                    context.overlay.select("g.brush").call(brush);
                    
                    if(debug.enabled) {
                        
                        function get_label (d) { return d.label; }
                        
                        selection = select.apply(
                            context, extent[0].concat(extent[1])
                        );

                        debug("selected rows", selection.rows.map(get_label).join(", "));
                        debug("selected columns", selection.columns.map(get_label).join(", "));
                        debug("extent", JSON.stringify(extent));
                        debug("selection", selection);
                        
                    }
                    
                    extent[1][0] = extent[1][0] - extent[0][0];
                    extent[1][1] = extent[1][1] - extent[0][1];
                                        
                    debug("rectangle dimensions", JSON.stringify(extent[1]));
                    
                    extent[1][0] = (magnification2f[0] * width) / extent[1][0];
                    extent[1][1] = (magnification2f[1] * height) / extent[1][1];
                    
                    debug("calculate new zoom factors xy", JSON.stringify(extent[1]));
                    
                    extent[0][0] = (width * magnification2f[0]) - ((width * magnification2f[0]) + ((width  * (offset2f[0] * magnification2f[0])))) + extent[0][0];
                    extent[0][1] = (height * magnification2f[1]) - ((height * magnification2f[1]) + ((height * ((offset2f[1] - (1. - (1. / magnification2f[1]))) * magnification2f[1])))) + extent[0][1];
                    
                    debug("calculate new shift xy (pixels)", JSON.stringify(extent[0]));
                    
                    extent[0][0] /= (width * magnification2f[0]),
                    extent[0][1] /= (height * magnification2f[1]);
                    
                    debug("calculate alpha xy", JSON.stringify(extent[0]));
                    
                    extent[0] = Effect.interpolate(
                        0., -1. + (1. / extent[1][0]), extent[0][0] * extent[1][0],
                        1. - (1. / extent[1][1]), 0, extent[0][1] * extent[1][1]
                    );
                    
                    debug("calculate new shift xy (coordinates)", JSON.stringify(extent[0]));
                    
                    extent[0][3] = extent[1][2] = false;
                    extent[0][2] = extent[1];
                    
                    with(context.__WebGLObjects) {
                        zoom.transition(transition_time_milliseconds);
                    }
                    
                    return context.zoom.apply(context, extent[1]),
                           context.shift.apply(context, extent[0]);
                    
                }
        });
        
        this.overlay.on("mousemove", function () {
            
            var e      = d3.event,
                margin = context.dimensions.margin,
                cell   = select.call(context, e.x - margin.left, e.y - margin.top);
            
            //debug("mouse over cell", cell, e.x, e.y);
                        
            cell && context.status(cell.value);

        });
        
        (function (context) {
            
            var dimensions  = context.dimensions.compensated;
                
            interactable = interact(context.overlay.node()).draggable(true)
            .on("dragmove", function (event) {
                
                var magnification2f = context.zoom(),
                    x = ((event.dx) * (1. / dimensions.width)),
                    y = ((event.dy) * (1. / dimensions.height));
                
                if( event.ctrlKey )
                    return context.zoom(-x*magnification2f[0], y*magnification2f[1]);
                
                return context.shift(x/magnification2f[0],y/magnification2f[1]);
                
            });

        })(this);
        
        with (this) {
            
            gutter.right.append("g").attr("class", "labels");
            gutter.bottom.append("g").attr("class", "labels");

            gutter.bottom.select("g.labels")
                .attr("transform", "rotate(-90)");

            brush.y(d3.scale.ordinal());
            brush.x(d3.scale.ordinal());
            
            toolbar.add("zoom", {
                
                'on' : function () {
                    
                    interactable.options.draggable = false;
                    
                    overlay.append("g")
                        .attr("class", "brush")
                        .call(brush);
                    
                    return "Drag and move around";

                },
                'off' : function () {
                    
                    interactable.options.draggable = true;
                    
                    brush.clear();
                    overlay.selectAll("g.brush").remove();
                    
                    return "Select Zoom Area";                    

                }
            });
            
        }
                        
        Object.observe(this.columns, function (changes) {
            
            var change, name;
          
            for(var i = 0, len = changes.length; i < len; i++) {
              
              change = changes[i];
              name   = change.name;
                
              if(change.type === "add" || change.type === "delete")
                 return context.render('resize');
                
            }
                       
        });
    
    }
    
    Grid.prototype.resize = function () {
        
        var dimensions = this.dimensions.compensated,
            margin     = this.dimensions.margin, 
            width      = dimensions.width, 
            height     = dimensions.height,
            context    = this, canvas = this.canvas.node(), gl, w, h;
               
        (function () {
            
            for(var i = 0, selection; i < arguments.length; i++) {
            
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
                'position' : 'absolute',
                'left' : margin.left + 'px',
                'top': height + margin.top + 'px'
            })
            .attr('width', width)
            .attr('height',  margin.bottom)
            .attr("class", "gutter");
        
        this.gutter.right
            .style({
                'position' : 'absolute',
                'left' : width + margin.left + 'px',
                'top': margin.top + 'px'
            })
            .attr('width', margin.right)
            .attr('height',  height)
            .attr("class", "gutter");
        
        this.brush.y().domain([0, height]).range([0, height]);
        this.brush.x().domain([0, width]).range([0, width]);
        
        this.brush.clear();
                
        with (gl = (this.canvas.node().getContext("webgl")) ) { with(this.__WebGLObjects) {
                        
            clearColor(0.,0.,0.,0.);
                
            viewport(0,0, width, height);
            
             w = Math.max(this.columns.__length__, width);
             h = Math.max(this.data.length, height);
            
            function setTextureParameters (interpolation) {
                with(gl) {
                    texParameteri(TEXTURE_2D, TEXTURE_MIN_FILTER, interpolation||NEAREST);
                    texParameteri(TEXTURE_2D, TEXTURE_MAG_FILTER, interpolation||NEAREST);
                    texParameteri(TEXTURE_2D, TEXTURE_WRAP_S, CLAMP_TO_EDGE);
                    texParameteri(TEXTURE_2D, TEXTURE_WRAP_T, CLAMP_TO_EDGE);
                }
            };
                            
            for(var i = 0, d = [{'width' : w, 'height' : h}, {'width' : 1, 'height' : 1, 'interpolation' : gl.LINEAR}, {'width' : this.data.length / 4, 'height' : this.columns.__length__ / 4}, {'width' : 1, 'height' : 1}];  i < tex.length; i++)
            {
                
                activeTexture(TEXTURE0+i);

                bindTexture(TEXTURE_2D, tex[i]);
                texImage2D(TEXTURE_2D, 0, RGBA, d[i].width, d[i].height, 0, RGBA, UNSIGNED_BYTE, null);

                setTextureParameters(d[i].interpolation);
                    
            }
            
            bindFramebuffer(FRAMEBUFFER, fb);
            bindRenderbuffer(RENDERBUFFER, rb);
                
            framebufferRenderbuffer(FRAMEBUFFER, COLOR_ATTACHMENT0, RENDERBUFFER, rb);
                
            renderbufferStorage(RENDERBUFFER, RGBA4, w, h);
                
            bindFramebuffer(FRAMEBUFFER, null);
            bindRenderbuffer(RENDERBUFFER, null);
            bindTexture(TEXTURE_2D, null);
                        
            draw.use()
                .parameter('resolution', '2f', [width, height])
                .parameter('cell', '2f', [width / this.columns.__length__, height / this.data.length]);
            
            zoom.use()
                .parameter('resolution', '2f', [width, height]);
                
                    
        }}
        
        for(var i = 0, index = 0, row, rows = this.data, len = rows.length; i < len; i++)
        {
            
            row = rows[i];
            
            if( row && !(row instanceof Row) )
                row = rows[i] = new Row(row, this.columns, new Position(i));            
        }
                
        return DataSet.prototype.resize.apply(this, arguments);
    
    }
    
    Grid.prototype.fromJSON = function () {
        
        var columns = this.columns;
        
        Object.defineProperty(columns, '__length__',
        {
            enumerable: false,
            configurable: true,
            writable: true,
            value: 0
        });
        
        $.each(columns, function (label, column) {
            
            if( ! (column instanceof Column))
                new Column(
                    label,
                    columns,
                    new Position(columns.__length__));
                
        });
                
        return DataSet.prototype.fromJSON.apply(this, arguments);
    }
        
    Grid.prototype.update = function () {
        return render.call(this);
    }
    
    Grid.prototype.zoom = function (dx, dy, incremental) {
        
        var magnification2f, x, y;
        
        with (gl = (this.canvas.node().getContext("webgl")) ) { with(this.__WebGLObjects) {
            
            magnification2f = zoom.parameter('magnification');
            
            if(!arguments.length)
                return magnification2f;
            
            x = dx || 0;
            y = dy || 0;
                        
            if(incremental !== false) {
                x +=  magnification2f[0];
                y +=  magnification2f[1];
            }
            
            zoom.use()
                .parameter('magnification', '2f', [
                    (x = magnification2f[0] = Math.max(x, 1.)),
                    (y = magnification2f[1] = Math.max(y, 1.))
                ]);
                    
        }}
        
        debug("zoom", x, y);
                
        return this.shift((-dx / x) * (1. / x), (dy / y) * (1. / y), magnification2f, incremental), magnification2f;        
    }
    
    Grid.prototype.shift = function (dx, dy, magnification2f, incremental) {
        
        var queue = this.__queue, offset2f, x, y;
        
        with (gl = (this.canvas.node().getContext("webgl")) ) { with(this.__WebGLObjects) {
            
            offset2f        =                    zoom.parameter('offset');
            magnification2f = magnification2f || zoom.parameter('magnification'); 
            
            if( !arguments.length )
                return offset2f;
            
            x  = dx || 0;
            y  = dy || 0;
            
            if(incremental !== false) {
                x += offset2f[0];
                y += offset2f[1];
            }
            
            if(queue.indexOf(zoom) === -1)
                queue.push(zoom);
                     
            zoom.use()
                .parameter('offset', '2f', [
                    (offset2f[0] = Math.max(
                        Math.min(x, 0.),
                        -1 + (1 / magnification2f[0])
                    )),
                    (offset2f[1] = Math.min(
                        Math.max(y, 0.),
                        1 - (1 / magnification2f[1])
                    ))
                ]);
        }}
        
        debug("shift", x, y);
        
        Position.update(this);
        
        render.call(this);
        
        with (drawLabels) {
            call(this, this.data, this.gutter.right);
            call(this, d3.values(this.columns), this.gutter.bottom, true);
        }
        
        return offset2f;        
    }
           
    Grid.prototype.draw = function () {
                
        var queue      = this.__queue,
            dimensions = this.dimensions.compensated,
            rows       = this.data,
            columns    = d3.values(this.columns);
        
        if ( !this.visible() ) return;
        
        for(var i = 0, length = rows.length; i < length; i++) {
            if( ! (rows[i] instanceof Row) )
                return this.render('resize');
        }
        
        with (gl = (this.canvas.node().getContext("webgl")) ) { with(this.__WebGLObjects) {
           
            activeTexture(TEXTURE0);
            bindTexture(TEXTURE_2D, tex[0]);            
            bindFramebuffer(FRAMEBUFFER, fb);            
            clear(COLOR_BUFFER_BIT);            
            copyTexSubImage2D(TEXTURE_2D, 0, 0, 0, 0, 0, Math.max(dimensions.width, this.columns.__length__), Math.max(dimensions.height, this.data.length));            
            bindFramebuffer(FRAMEBUFFER, null);
            clear(COLOR_BUFFER_BIT);           
        
            activeTexture(TEXTURE2);
            bindTexture(TEXTURE_2D, tex[2]);

            texImage2D(TEXTURE_2D, 0, RGBA, (--length + (4 - (length % 4))) / 4, columns.length, 0, RGBA, FLOAT, null);
            
        }}
        
        for(var i = 0, column, length = columns.length; i < length; i++) {
            
            column = columns[i];

            if(column instanceof Column) {
               (queue.indexOf(column) === -1) && queue.push(column);
            }
            else if(column instanceof Object)
                return this.render('resize');
                
        }
                
        return this.zoom(0, 0);
            
    }
    
    function text (d) {
        return d.label;
    }
    
    function getTextHeight (rotated) {
        var rect = this.getBoundingClientRect();
        return (rotated ? rect.width : rect.height);
    }
    
    function drawLabels (data, gutter, rotated) {
            
        var labels,
            margin     = this.dimensions.margin,
            dimensions = this.dimensions.compensated,
            width      = dimensions[rotated?'width':'height'],
            text_height, skip;
                
        function opacity (d) {
            
            var i = data.indexOf(d);
            
            text_height = text_height || getTextHeight.call(this, rotated);
            skip        = Math.ceil(Math.max(text_height / d.position[rotated?'width':'height'], 1));
            
            return !( i % skip ) && i > -1 ? 1 : 0;
        }
        
        function y (d) {
            text_height = text_height || getTextHeight.call(this, rotated);            
            return  d.position[rotated?'x':'y'] + (d.position[rotated?'width':'height'] / 2) + (text_height / 2);
        }
        
        function x () {
            return (rotated ? -margin.bottom : margin.right) / 2;
        }
            
        labels = gutter.select("g.labels")
                 .selectAll("text.label")
                 .data(data);
        
        labels.text(text);
        
        labels.enter()
              .append("text")
              .text(text)
              .attr("class", "label")
              .attr("y", y  )
              .attr("x", x )
              .style("text-anchor", "middle")
              .style("opacity", 0);

        labels.transition()
              .duration(transition_time_milliseconds)
              .ease(default_ease)
              .style("opacity", opacity)
              .attr("x", x )
              .attr("y", y );
        
        labels.exit()
              .transition()
              .duration(transition_time_milliseconds)
              .ease(default_ease)
              .style("opacity", 0)
              .remove();
            
    }
        
    function column_set_width (w) {
        return (this.position.repeat = w);
    }
    
    function column_get_width () {
        return this.position.repeat;
    }

    function Column (label, columns, position) {
        
        var column, 
            domain     = new Uint8Array(),
            range      = [],
            width      = 1,
            dataType   = "String",
            dateFormat = "%a %b %e %H:%M:%S %Y",
            precision  = 0;

        Object.defineProperties(this, {

            'columns' : {
              configurable: false,
              enumerable: false,
              value : columns
            },
            'domain' : {
              configurable: false,
              enumerable: true,
              get : function () {
                  return domain;
              },
              set : function (d) {
                  if(Array.isArray(d)) {
                      domain = new Uint8Array(d);
                  }
              }
            },
            'range' : {
              configurable: false,
              enumerable: true,
              get : function () {
                  return range;
              },
              set : function (d) {
                  if(Array.isArray(d)) {
                      range = d;
                  }
              }
            },
            'data' : {
              configurable: false,
              enumerable: false,
              writable: true,
              value: new Float32Array()
            },
            'text' : {
              configurable: false,
              enumerable: false,
              writable: true,
              value: null
            },
            'label' : {
              configurable: false,
              enumerable: false,
              value: label
            },
            'position': {
                configurable : false,
                enumerable : false,
                writable : true,
                value: position
            },
            'width': {
                configurable : false,
                enumerable : true,
                set: column_set_width,
                get: column_get_width
            },
            'hideText' : {
                configurable : false,
                enumerable : true,
                writable: true,
                value : false
            },
            'textColor' : {
                configurable : false,
                enumerable : true,
                writable: true,
                value : null
            },
            'precision' : {
                
                get : function() {
                    return precision;
                },
                set : function(value) {
                    precision = Number(value) || 0;
                },
                enumerable: true
                
            },
            'dataType' : {
                
                get : function() {
                    return dataType;
                },
                set : function(value) {
                    if(this.dataTypes.indexOf(value) > -1) {
                        dataType = value;
                    }
                },
                enumerable: true                
            },
            'dateFormat' : {
                
                get : function() {
                    return dateFormat;
                },
                set : function(value) {
                    dateFormat = value;
                },
                enumerable: true                
            }

          });
        
        if( (column = columns[label]) ) {
            
            this.width  = width = column.width || width;
            this.domain = column.domain || [];
            
            if (this.dataTypes.indexOf(column.dataType) > -1) 
                this.dataType = column.dataType;
            
            if(column.dateFormat)
                this.dateFormat = String(column.dateFormat);
            
            if(Number.isFinite(column.precision)) 
                this.precision = column.precision;
        }
        
        this.domain = [255, 0, 0, 255, 255, 255, 0, 255, 0, 255, 0, 255, 0, 255, 255, 255, 0, 0, 255, 255];
        
        columns.__length__ += width;
        
        columns[label] = this;
        
    }
    
    Column.prototype.add = function (cell) {
                       
        if(cell instanceof Cell) {
                                    
            Object.defineProperty(this, cell.row.label, {
                enumerable: false,
                writable: false,
                configurable: true,
                value: cell
            });
                
        }
        
        return cell;
    }
    
    Column.prototype.delete = function (cell) {
        
        if(typeof cell === 'string')
            delete this[cell];
        if( cell instanceof Cell )
            delete this[cell.row.label];
        else if(!arguments.length) {
            
            if(this.label in this.columns)
                this.columns.__length__--;
            
            delete this.columns[this.label];
        }
    }
    
    Column.prototype.dataTypes  = ['Date', 'String', 'Number'];
    
    function cell_set_value (v) {
        
        var column = this.column,
            row    = this.row,
            index  = row.position.index,
            d1     = column.data, 
            d2, length;
            
        if(index >= d1.length) {
                 
            length = index + (4 - (index % 4));
                 
            d2 = column.data = new Float32Array(new ArrayBuffer(length*4));
            d2.set(d1, 0);
                
        }
                
        return (column.data[index] = (v +  (index + column.position.index) % 2) / 2);
    }
    
    function cell_get_value () {
        return this.column.data[this.row.position.index];
    }

    function Cell (row, column, value) {
        
        Object.defineProperties(this, {
            value : {
                configurable: false,
                get : cell_get_value,
                set : cell_set_value
            },
            row : {
              configurable: false,
              value : row
            },
            column : {
              configurable: false,
              value : column
            }
          });
        
        this.value = value;
    }
    
    Cell.prototype.toJSON = function () {
        return this.value;
    }
    
    Cell.prototype.toString = function (value) {
            
        var context  = this,
            column   = this.column,
            value    = this.value,
            dataType = window[column.dataType],
            n_float;
        
        switch(dataType) {
                
            case Date :
                
                n_float   = (typeof value === 'string' ? dataType.parse(value) : Number.isFinite(value) ? value : undefined);
                break;
                
            default :                
                n_float   = (Number.isFinite(value) ? value : (typeof value === 'string' ? parseFloat(value) : (typeof value === 'boolean' ? (value ? 1 : 0): undefined)));
        }
                
        switch(dataType) {
                
            case Date :               
                                
                value = new dataType(n_float);            
                
                if(column.dateFormat.length)
                    value = d3.time.format(column.dateFormat)(value);
                else 
                    value = value.toLocaleString();
                
                n_float = undefined;
                
                break;
                
            case String :
                
                value   = dataType(value).replace(/(\d+\.\d+)|(\d+)/, Number.isFinite(n_float) ? n_float.toFixed(column.precision) : value);
                n_float = undefined;
                
                break;
                
            case Number :
                break;
            
        }
        
        return Number.isFinite(n_float) ? n_float.toFixed(column.precision) : value;
        
    }

    function Row (data, columns, position) {
        
      var values = {}, row = this, length = 0; columns = columns || {};
        
      function divider () { return columns.__length__ }

      Object.defineProperties(this, {
     
        columns  : {
          configurable: false,
          enumerable: false,
          value : columns
        },
        label  : {
          configurable: false,
          enumerable: true,
          value : data.label
        },
        values : {
          configurable: false,
          enumerable: true,
          value : values

        },
        position : {
          configurable: false,
          enumerable : false,
          value: position
        },
        length : {
          configurable: false,
          enumerable : false,
          get: function () {
              return length;
          }
        }

      });
        
      Object.observe(values, function (changes) {
          
          var change, name, cell, obj;
          
          for(var i = 0, len = changes.length; i < len; i++) {
              
              change = changes[i];
              name   = change.name;
              obj    = change.object;
              
              if(change.type === "add") {
                  
                  if( ! ( obj[name] instanceof Cell ) ) {
                      
                      obj[name] = new Cell(
                          row, 
                          !(columns[name] instanceof Column) ? 
                          new Column(name, columns, new Position(columns.__length__)) : columns[name],
                          obj[name]
                      );
                    
                      columns[name].add(obj[name]);                                            
                  }
                  
                  length++;
              }
              else if(change.type === "delete") {
                  length--;
              }
              else if(change.type === "update") {
                  
                  if(change.oldValue instanceof Cell && ! (obj[name] instanceof Cell) ) {
                      
                      change.oldValue.value = obj[name];
                      obj[name] = change.oldValue;                      
                      
                  }
                                        
              }
          }
          
      });
        
      $.extend(values, data.values);
        
    }
    
    function render () {
        
        var context     = this,
            queue       = this.__queue,
            dimensions  = this.dimensions.compensated,
            width       = Math.max(dimensions.width, this.columns.__length__),
            height      = Math.max(dimensions.height, this.data.length),
            gl          = this.canvas.node().getContext("webgl");
                                
        function draw (t) {

            var obj, currentProgram, length = queue.length;
                
            (context.__animationRequestId__ = null);
                
            with(gl) { with(context.__WebGLObjects) {
                
                currentProgram = draw.use();
                                
                while( length )
                {
                    obj = queue.shift();
                    
                    if (obj instanceof Column)
                    {                                                
                        draw.ease(obj);
                    }
                    else if(obj instanceof Effect)
                    {
                        (currentProgram = obj.use());
                        
                        if(!obj.tick(t)) queue.push(obj);
                        
                    }
                    
                    drawArrays(TRIANGLE_STRIP, 0, 4);
                    
                    if(obj instanceof Column) {
                        
                        activeTexture(TEXTURE0);
                        bindTexture(TEXTURE_2D, tex[0]);
                        
                        copyTexSubImage2D(TEXTURE_2D, 0, 0, 0, 0, 0, width, height);
                        
                        bindFramebuffer(FRAMEBUFFER, null);
                        
                    }
                    
                    length--;
                }
                    
            }}
            
            debug("Draw took " + (window.performance.now() - t) + " milliseconds");

            if(queue.length)
                return (context.__animationRequestId__ = requestAnimationFrame(draw));
        };
        
        return this.__animationRequestId__ || (this.__animationRequestId__ = requestAnimationFrame(draw));
        
    }
    
    function Position (index, repeat) {
        this.index  = index  || 0;
        this.repeat = repeat || 1;
    }
    
    Position.update = function (gridObject) {
        
        var dimensions = gridObject.dimensions.compensated,
            width      = dimensions.width,
            height     = dimensions.height,
            cell2f, magnification2f, offset2f;
                
        with(gridObject.canvas.node().getContext("webgl")) { with(gridObject.__WebGLObjects) {
            
            cell2f          = draw.parameter('cell');            
            magnification2f = zoom.parameter('magnification');
            offset2f        = zoom.parameter('offset');
            
        }}
        
        for(var i    = 0, position, obj, 
                data = gridObject.data.concat(d3.values(gridObject.columns)), len = data.length; i < len; i++)
        {
            
            position = data[i].position;
            
            position.width  = cell2f[0] * position.repeat * magnification2f[0];
            position.height = cell2f[1] * position.repeat * magnification2f[1];
        
            position.x = (position.index * position.width)  + (width * (offset2f[0] * magnification2f[0]));
            position.y = (position.index * position.height) + (height * ((offset2f[1] - (1. - (1. / magnification2f[1]))) * magnification2f[1]));
                
        }
    }
    
    function select (x0, y0, x1, y1) {

       var i          = 0, selected = {cells: [], rows: [], columns: []},
           data       = this.data, len = data.length, 
           dimensions = this.dimensions.compensated, 
           width      = dimensions.width,
           height     = dimensions.height,
           two        = arguments.length === 2,
           four       = arguments.length === 4,
           cell, column, row, values, y, x, x2, y2;

       if( Number.isFinite(x0) && Number.isFinite(y0) ) {
                      
           for(;i < len; i++) {
               
               row = data[i];
               
               if(! (row instanceof Row) ) continue;
               
               y  = row.position.y;
               
               y2 = y + row.position.height;

              if( (two && y <= y0 && y2 >= y0) || 
                  (four && y >= y0 && y2 <= y1) ||
                  (four && y0 >= y && y0 <= y2 && y1 <= y2 && y0 >= y) ) {
                  
                  values = row.values;
                  
                  for(var label in values) {

                      cell   = values[label];
                      
                      if(! (cell instanceof Cell) ) continue;
                      
                      column = cell.column;
                      
                      x  = column.position.x;
                      
                      x2 = x + column.position.width;

                      if( (two && x <= x0 && x2 >= x0) ||
                          (four && x >= x0 && x2 <= x1) ||
                          (four && x0 >= x && x0 <= x2 && x1 <= x2 && x0 >= x) ) {
                          
                          selected.cells.push(cell);
                          
                          if(two) break;
                          
                          if(selected.columns.indexOf(column) === -1)
                              selected.columns.push(column);
                      }

                   }
                  
                  if(two) break;
                  
                  selected.rows.push(row);
                  
              }

           }
       }

       return two ? cell : selected;

    }
    
    return Grid;
    
});
