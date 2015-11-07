/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
    
*/

define([
    
      'debug'
    , 'interact'
    , 'jquery'
    , 'types/widget'
    , 'lib/types/base/linegraph'
    , 'lib/api'
    , 'd3'
    , 'gl-matrix'
    , 'types/lib/labels'
    , 'types/lib/effect'
    , 'text!types/lib/shaders/minimal.vert.c'
    , 'text!types/lib/linegraph/shaders/points.vert.c'
    , 'text!types/lib/linegraph/shaders/line.frag.c'
    , 'text!types/lib/shaders/effect.blur.frag.c'
    
], function(
       
      debug
    , interact
    , $
    , Widget
    , LineGraph
    , vrt
    , d3
    , glMatrix
    , labels
    , Effect
    , vertsha_minimal_src
    , vertsha_src
    , linesha_src
    , blursha_src
    
) { debug = debug("widget:linegraph");

    const   transition_time_milliseconds = 500,
             default_ease                = d3.ease("cubic-in-out");
   
   function Line (gl, options) {
        
        var Mat4 = glMatrix.mat4;
            
        var start             = 0,
            length            = 0,
            modelmatrix       = Mat4.create(),
            perspectivematrix = Mat4.create();

        const buffers = [],
              data    = [],
              degree  = Math.PI / 180;
            
        Mat4.identity(modelmatrix);
        Mat4.identity(perspectivematrix);
            var tr = 0;
        Effect.call(this, linesha_src, vertsha_src, gl,
        function line (t) {
            Mat4.rotate(modelmatrix, modelmatrix, 0.1 * degree , [0,1,0]);
            //Mat4.rotate(modelmatrix, modelmatrix, 1 * degree , [0, 0, 1]);
            this.parameter("model", "Matrix4fv", [false, modelmatrix]);
            return 0;
            
            
        },
        function draw (gl) {
 
            gl.lineWidth(options.lineWidth);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            for(var i = 0; i < buffers.length; i++) {

                gl.bindBuffer(gl.ARRAY_BUFFER, buffers[i]);
                gl.bufferData(gl.ARRAY_BUFFER, data[i], gl.STREAM_DRAW);
                gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
                    
                gl.drawArrays(gl.LINE_STRIP, start, data[i].length / 3), this;

            }

        });
       
       
        //Mat4.rotate(modelmatrix, modelmatrix, -45 * degree , [0, 1, 0]);
        //Mat4.translate(modelmatrix, modelmatrix, [0, 0, -2.0, 0.]);
        this.perspective = function (aspect) {
            
            //Mat4.lookAt(perspectivematrix, [.5, -.25, 0.], [0.,0.,0.], [0.,1.,0.]);
            //Mat4.ortho(perspectivematrix, -1, 1, -1, 1, 1, -100)
            //Mat4.perspective(perspectivematrix, 45 * degree, 1, 1, 100);
            
            //Mat4.rotate(modelmatrix, modelmatrix, 15 * degree , [0,0, 1]);
            
            
            
            this.use()
                .parameter("perspective", "Matrix4fv", [false, perspectivematrix])
                .parameter("model", "Matrix4fv", [false, modelmatrix])
        }
            
        this.destroy = function () {

            while(buffers.length)
                this.pop();

            return Effect.prototype.destroy.call(this);
        }

        this.getContext(function (gl, program) {
            
            gl.enable(gl.DEPTH_TEST);
            gl.clearColor(0,0,0,0);
            gl.bindAttribLocation(program, 0, "position");
            gl.enableVertexAttribArray(0);
                
        });

        this.push = function (data_) {
            data.push(data_);
            buffers.push(gl.createBuffer());
        }

        this.pop = function () {

            var buffer = buffers.pop(),
                data_   = data.pop();

            if(buffer)
                gl.deleteBuffer(buffer);

        }
            
        this.set = function (i, data_) {
            if(data[i])
                data[i] = data_;
            else
                throw "Invalid index";
        }

        Object.defineProperty(this, "length", {
            get: function () {
                return buffers.length;
            }
        });
       
    }

    Line.prototype = Object.create(Effect.prototype);
   
    LineGraph.prototype.destroy = function () {
        
        with(this.__WebGLObjects) {
            draw.destroy(),
            blur.destroy();
        }
        
        return Widget.prototype.destroy.call(this);
    }
    
    LineGraph.prototype.blur = function (yes) {
        
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
                
    LineGraph.prototype.create = function () {
        
        Widget.prototype.create.call(this);
        
        var context   = this, 
            element    = d3.select(this.element),
            dimensions = this.dimensions.compensated,
            margin     = this.dimensions.margin,
            brush, gl, texture;
        
        this.options =
        $.extend(true, {
            
            "lineWidth"   : 1,
            "colors" : [
                "#0000FF",
                "#4B0082",
                "#7F00FF",
                "#00FF00",
                "#FFFF00",
                "#FF7F00",
                "#FF0000"
            ],
            "blur"        : 0,
            "scale"       : [0, 1],
            "spacing"     : 0,
            "tilt"        : false
            
        }, this.options);
        
        with(this.options) {
            
            lineWidth = lineWidth || 1;
            
            prepend("blur", 0, 1);
            prepend("spacing", 0, 1);
            prepend("lineWidth", 1, 5);
            prepend("scale", "string");
            prepend("colors", "color");
            
            
        }
        
        this.selector = [
            "label", 0, String,
            "x",     0, function (value_, i) {
                var value = Number(value_);
                return value === NaN ? i : value;
            },
            "y",   [1], d3.scale.linear().domain(this.options.scale).range([-1, 1])
        ];
        
        this.canvas  = element.append("canvas");
        this.overlay = element.append("svg");
        this.gutter  = element.append("svg");
        
        with( (gl = this.canvas.node().getContext("webgl")) ) {
            
            this.__WebGLObjects = {
                
                textures : [
                    (texture = createTexture())
                ],
                blur : new Effect (blursha_src, vertsha_minimal_src, gl, function blur (t) {
                    this.interpolate("dir"); 
                    return default_ease(t);
                }),
                
                draw : new Line (gl, this.options)
            }
        }
        
        this.overlay
        .on("mousemove", function () {    

        })
        .on("mouseout", function () {
           
        })
        .append("g")
        .attr("class", "brush");
        
        this.brush = brush = d3.svg.brush()
            .on("brushend", function () {
            
                var extent;
            
                if(!brush.empty() && (extent = brush.extent())) {
                                        
                    brush.clear(),
                    context.overlay.select("g.brush").call(brush);
                    
                    //return context.zoom();

                }
        });
        
        with (this) {
            
            gutter.append("g").attr("class", "labels");
            
            toolbar.add("zoom", {

                'on': function () {

                    return "Drag and move around";

                },
                'off': function () {
                    return "Select Zoom Area";
                }
            });
        }
        
        with(this.__WebGLObjects) {
            
            draw.use()
                .parameter('colors', '1i', 1)
                .chain(blur)
                .quad("position", 0)
                .mode(Effect.PASSTHROUGH);
        }
        
        this.blur(false);
        
    }
    
    LineGraph.prototype.resize = function () {
        
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
        
        with(this.__WebGLObjects) {
             
            draw.getContext(function (gl) {
                
                this.perspective(width / height);
                
                if(!gl.getParameter(gl.SAMPLES))
                    this.resize(width * 2, height * 2)
                        .texture({
                          10241    : 9729, // TEXTURE_MIN_FILTER : LINEAR
                          10240    : 9729, // TEXTURE_MAG_FILTER : LINEAR
                     });
                
            });
             
        }
                
        return Widget.prototype.resize.call(this);
        
    }
        
    LineGraph.prototype.update = function (label, x, value, i_) {
        
        var e      = this.event, 
            draw   = this.__WebGLObjects.draw,
            buffer = draw.buffer,
            i, texture, colors;
        
        switch(e ? e.type : null) {
                
            case null :
                
                i = i_ * 3;
                
                draw.render();
            
                for(var j = 0, length = value.length; j < length; j++) {

                    buffer[j]           = buffer[j] || [];
                    buffer[j][ i  + 1 ] = value[j];

                }
                
                break;
            
            case 'save'   :
                
            case 'refresh':
                
                draw.buffer = [];
                
                texture = this.__WebGLObjects.textures[0];
                colors  = this.options.colors.map(convert);
                   
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
                
                this.selector[8].domain(this.options.scale);
        }
    }
    
    function convert (hex) { return d3.values(d3.rgb(hex)).slice(0, 3); }
   
    LineGraph.prototype.draw = function () {
       
        var context = this,
            draw    = this.__WebGLObjects.draw,
            buffer  = draw.buffer,
            scale   = d3.scale.linear().domain([0, 1]).range([-1, 1]);
        
        for(var i = 0; i < buffer.length; i++) {
            
            for(var j = 0, length = buffer[i].length; j < length; j+=3) {
                
                buffer[i][j     ] = scale( j / (buffer[i].length - 2) );
                buffer[i][j + 2 ] = -(i * .025);
            
            }
                
            buffer[i] = new Float32Array(buffer[i]);
            
            if(i > draw.length - 1)
                draw.push(buffer[i]);
            else
                draw.set(i, buffer[i]);
        }
        
        while(draw.length > buffer.length)
            draw.pop();
            
    }
   
    function Position (index) {
        this.index = index  || 0.;
        this.width = this.x = this.height = this.y = 0.;
    }
   
    Position.update = function (gl) {
        
    }
    
    return LineGraph;
    
});