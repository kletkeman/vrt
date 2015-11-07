/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
    
*/

define([
    
      'debug'
    , 'interact'
    , 'jquery'
    , 'types/widget'
    , 'lib/types/base/bargraph'
    , 'lib/api'
    , 'd3'
    , 'types/lib/labels'
    , 'types/lib/effect'
    , 'text!types/lib/shaders/minimal.vert.c'
    , 'text!types/lib/bargraph/shaders/bars.frag.c'
    , 'text!types/lib/shaders/effect.blur.frag.c'
    , 'text!types/lib/shaders/zoom.frag.c'
    
], function(
       
      debug
    , interact
    , $
    , Widget
    , BarGraph
    , vrt
    , d3
    , Labels
    , Effect
    , vertsha_src
    , barssha_src
    , blursha_src
    , zoomsha_src
    
) { debug = debug("widget:bargraph");
 
    const   transition_time_milliseconds = 500,
            default_ease                 = d3.ease("cubic-in-out");
    
    BarGraph.prototype.blur = function (yes) {
        
        var min_blur = this.options.blur;
        
        with(this.__WebGLObjects) {
            
            if(yes)
                blur.use()
                    .transition(transition_time_milliseconds)
                    .parameter("dir", "2f", [1.,1.])
                    .render();
            else
                blur.use()
                        .transition(transition_time_milliseconds)
                        .parameter("dir", "2f", [min_blur, min_blur])
                        .render();
            
             this.gutter.transition()
                 .duration(transition_time_milliseconds)
                 .style("opacity", yes ? 0 : 1);
        }
        
        return Widget.prototype.blur.call(this, yes);
        
    }
    
    
                
    BarGraph.prototype.create = function () {
        
        Widget.prototype.create.call(this);
        
        var context    = this, 
            element    = d3.select(this.element),
            dimensions = this.dimensions.compensated,
            margin     = this.dimensions.margin,
            brush, gl, texture, interactable;
        
        this.destroy = function () {
        
            with(this.__WebGLObjects) {
                draw.destroy(),
                zoom.destroy(),
                blur.destroy();
            }
            
            interactable.unset();

            return Widget.prototype.destroy.call(this);
        }
        
        this.labels = [];
        
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
            scale  : [0,1]
        }, this.options);
        
        with(this.options) {
            prepend ("align", ["bottom", "center", "top", "auto"]);
            prepend ("blur", 0, 1);
            prepend ("colors", "color");
        }
        
        this.selector = [
            "label", 0, function (d) {
                
                if(typeof d === "number")
                    return d.toFixed();
                
                return String(d);
            },
            "value", [2], d3.scale.linear().domain(this.options.scale).range([0, 1])
        ];
        
        this.canvas  = element.append("canvas");
        this.overlay = element.append("svg");
        this.gutter  = element.append("svg");
        
        with( (gl = this.canvas.node().getContext("webgl")) ) {
            
            getExtension("OES_texture_float");
            getExtension("OES_float_linear");
            getExtension("OES_half_float_linear");
         
            this.__WebGLObjects = {
                
                textures : [
                    (texture = createTexture()),
                    createTexture()
                ],

                zoom : new Effect (zoomsha_src, vertsha_src, gl),
                
                blur : new Effect (blursha_src, vertsha_src, gl, function blur (t) {
                    this.interpolate("dir");
                    return default_ease(t);
                }),

                draw : new Effect (barssha_src, vertsha_src, gl, function draw (t) {
                    
                    var buffer = this.buffer;
                    
                    this.activate(0)
                         .texture(texture, {
                            'height' : 1,
                            'width'  : buffer.length / 4,
                            'type'   : gl.FLOAT,
                            'data'   : buffer
                        });

                })
            };
            
        }
               
        this.overlay
        .on("mousemove", function () {

            var e = d3.event,
                margin = context.dimensions.margin,
                bar = select.call(context, e.x - margin.left);

            bar && context.status(bar.value);
            

        })
        .on("mouseout", function () {
           
        })
        .append("g")
        .attr("class", "brush");
        
        interactable = interact(context.overlay.node()).draggable(true)
        .on("dragend", function () {
            
            
        })
        .on("dragmove", function (event)
        {
            
                
        });
        
        this.brush = brush = d3.svg.brush()
            .on("brushend", function () {
            
                var extent;
            
                if(!brush.empty() && (extent = brush.extent())) {
                                        
                    brush.clear(),
                    context.overlay.select("g.brush").call(brush);
                    

                }
        });
        
        with (this) {
            
            gutter.append("g").attr("class", "labels");
            
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
        
        with(this.__WebGLObjects) {
            
            draw.use()
                .quad("position", 0)
                .parameter("color", "1i", 1)
                .chain(zoom)
                .use()
                .parameter('magnification', '2f', [1., 1.])
                .parameter('offset', '2f', [0., 0.])
                .chain(blur)
                .mode(Effect.PASSTHROUGH);
            
        }
        
        this.blur(false);
    }
    
    BarGraph.prototype.resize = function () {
        
        var context    = this,
            dimensions = this.dimensions.compensated,
            margin     = this.dimensions.margin, 
            width      = dimensions.width, 
            height     = dimensions.height,
            brush;
        
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
        
        this.gutter
            .style({
                'position' : 'absolute',
                'left' : margin.left + 'px',
                'top': (height + margin.top) + 'px'
            })
            .attr('width', width)
            .attr('height', margin.bottom)
            .attr("class", "gutter");
        
        this.brush.x(d3.scale.ordinal());
        this.brush.x().domain([0, width]).range([0, width]);
        
        this.brush.clear();
        
        this.overlay
            .selectAll("g.brush")
            .call(this.brush)
            .selectAll("rect")
            .attr("y", 0)
            .attr("height", height - 1 );
        
        this.gutter.select("g.labels")
            .attr("transform", "rotate(-90)");
        
        with(this.__WebGLObjects)
            zoom.render();
        
        return Widget.prototype.resize.call(this);
        
    }
        
    BarGraph.prototype.update = function (label, value, i) {
        
        var context    = this,
            e          = this.event,
            draw       = this.__WebGLObjects.draw,
            hideLabels = this.options.hideLabels,
            texture, labels, buffer, colors;
        
        switch(e ? e.type : null) {
                
            case null    :
                
                buffer = draw.buffer;
                labels = this.labels;
                
                draw.render();
            
                if(!hideLabels && typeof labels[i] !== "object") {
                    labels[i] = label;
                }

                for(var j = 0, x, length = value.length; j < length; j++ ) {

                    buffer[(i * (length * 4)) + (j * 4) + 3] = value[j];
                }
                
                buffer.width = Math.max(buffer.width || 0, length * (i + 1));
                
                break;
                
            case 'save'    :
                
            case 'refresh' :
                
                labels      = [];
                texture     = this.__WebGLObjects.textures[1];
                colors      = this.options.colors.map(convert);
                draw.buffer = [];
                
                for(var i = 0, length = colors.length; i < length; i++) {
                    colors.push.apply(colors, colors[i]);
                    colors.push(255);
                }

                colors.splice(0, length);        
                colors = new Uint8Array(colors);

                draw.use()
                    .parameter("horizon", "1f", this.options.align === "auto" ?  Math.min(this.options.scale.slice(0, 2).reduce(horizon), 0) : Math.max(0, ["bottom", "center", "top"].indexOf(this.options.align) / 2.) )
                    .activate(1)
                    .texture(texture, {
                        'width'  : colors.length / 4,
                        'height' : 1,
                        10241   : 9729, // TEXTURE_MIN_FILTER : LINEAR
                        10240   : 9729, // TEXTURE_MAG_FILTER : LINEAR
                        'data'   : colors
                    });

                this.labels = labels;
                this.selector[5].domain(this.options.scale);
                
        }
    }
    
    function convert (hex ) { return d3.values(d3.rgb(hex)).slice(0, 3); }
    function horizon (a, b) { return a / (b - a); }
   
    BarGraph.prototype.draw = function () {
        
        var draw = this.__WebGLObjects.draw,
            buffer = draw.buffer;
        
        Position.update.call(this); Labels.call(this, this.labels, this.gutter, true);
        
        if(Array.isArray(buffer)) {
            
            draw.resize(buffer.width || 0, 1024);
            draw.buffer = new Float32Array(buffer);
                        
        }
    }
   
    function Position (index) {
        this.index = index || 0.;
        this.width = this.x = this.height = this.y = 0.;
    }
   
    Position.update = function () {

        var width     = this.dimensions.compensated.width,
            selection = this.data.selection,
            labels    = this.labels,
            length    = labels.length,
            w         = width / length,
            zoom      = this.__WebGLObjects.zoom,
            magnification2f, offset2f;

        magnification2f = zoom.parameter('magnification');
        offset2f        = zoom.parameter('offset');
                    
        for (var i = 0, position, obj; i < length; i++) {
            
            obj = labels[i];
            
            obj = labels[i] = typeof obj !== "object" ? {
                'label'    : obj,
                'position' : new Position(i)
            } : obj;
            
            position = obj.position;
            
            position.width  = position.height =  w * magnification2f[0];
            position.x      = position.y      = (position.index * position.width) + (width * (offset2f[0] * magnification2f[0]));
        }
        
        return true;
        
    }
   
    function select (x0, x1) {

            var i          = 0,
                selected   = [],
                labels     = this.labels,
                len        = labels.length,
                dimensions = this.dimensions.compensated,
                width      = dimensions.width,
                height     = dimensions.height,
                two        = arguments.length === 2,
                one        = arguments.length === 1,
                obj, x, x2, position;

            if (Number.isFinite(x0)) {

                for (; i < len; i++) {

                    obj = labels[i];

                    if ( typeof obj !== "object" ) continue;

                    position = obj.position;
                    
                    x = position.x;

                    x2 = x + position.width;

                    if ((one && x <= x0 && x2 >= x0) ||
                        (two && x >= x0 && x2 <= x1) ||
                        (two && x0 >= x && x0 <= x2 && x1 <= x2 && x0 >= x))
                    {
                            selected.push(obj);
                        
                            if(one) break;
                    }

                }
            }

            return one ? obj : selected;

        }
    
    return BarGraph;
    
});