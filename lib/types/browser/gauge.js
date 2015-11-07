/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
    
*/

define([
    
      'debug'
    , 'jquery'
    , 'types/widget'
    , 'lib/types/base/gauge'
    , 'lib/api'
    , 'd3'
    , 'types/lib/effect'
    , 'text!types/lib/shaders/minimal.vert.c'
    , 'text!types/lib/shaders/effect.blur.frag.c'
    , 'text!types/lib/gauge/shaders/gauge.frag.c'
    , 'text!types/lib/gauge/shaders/gauge.vertex.c'
    
], function(
       
      debug
    , $
    , Widget
    , Gauge
    , vrt
    , d3
    , Effect
    , vertex_shader_source
    , blur_fragment_shader_source
    , gauge_fragment_shader_source
    , gauge_vertex_shader_source
    
) { debug = debug("widget:image");

    const   transition_time_milliseconds = 500,
            default_ease                 = d3.ease("cubic-in-out");
   
    Gauge.prototype.blur = function (yes) {
        
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
        }
        
        return Widget.prototype.blur.call(this, yes);
        
    }
                
    Gauge.prototype.create = function () {
        
        Widget.prototype.create.call(this);
        
        var context    = this, 
            element    = d3.select(this.element),
            gl, buffer;
        
        this.value = 0;
        
        (this.options =
        $.extend({
            colors : [
                "#0000FF",
                "#4B0082",
                "#7F00FF",
                "#00FF00",
                "#FFFF00",
                "#FF7F00",
                "#FF0000"
            ],
            blur         : 0,
            fill         : true,
            innerRadius  : .5,
            outerRadius  : 1,
            startAngle   : 0,
            endAngle     : 360,
            lineWidth    : 2,
            scale        : [0, 1]
        }, this.options));
        
        with(this.options) {
            
            
            prepend ("blur", 0, 1);
            prepend ("outerRadius", 0, 1);
            prepend ("innerRadius", 0, 1);
            prepend ("colors", "color");
        }
        
        this.selector = [
            "value",
            {
                left : 1,
                top  : 0
            },
            d3.scale.linear().domain(this.options.scale).range([0, 1])
        ];
        
        this.canvas  = [element.append("canvas"), element.append("canvas")];
        
        with( (gl = this.canvas[1].node().getContext("webgl")) ) {
            
            this.__WebGLObjects = {
                
                textures : [createTexture()],
                
                buffer : (buffer = createBuffer()),
                
                blur : new Effect (blur_fragment_shader_source, vertex_shader_source, gl,
                function blur (t) {
                    this.interpolate("dir");
                    return default_ease(t);
                }),
                
                draw : new Effect (gauge_fragment_shader_source, gauge_vertex_shader_source, gl,
                function gauge (t) {
                    return default_ease(t);
                }, function (gl) {
                    
                    gl.clear(gl.COLOR_BUFFER_BIT)
                    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
                    
                    this.parameter("value", "1f", context.value);
                    
                    return gl.drawArrays(context.options.fill ? gl.TRIANGLE_STRIP : gl.LINES, 0, this.length / 3), this;
                })
            }
        }
        
        with(this.__WebGLObjects) {
            
            draw.use()
                .getContext(function (gl, program) {
                
                    gl.clearColor(0,0,0,0);
                    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                    gl.bindAttribLocation(program, 0, "position");
                    gl.enableVertexAttribArray(0);
                    
                    this.parameter("colors", "1i", 1);
                
                })
                .chain(blur)
                .quad(0, "position")
                .mode(Effect.PASSTHROUGH);
        }
        
        this.blur(false);
        
    }
    
    Gauge.prototype.destroy = function () {
        
        with(this.__WebGLObjects) {
            
            blur.destroy();
            draw.destroy();
            
        }
        
        return Widget.prototype.destroy.call(this);
    }
    
    Gauge.prototype.resize = function () {
        
        var context    = this,
            dimensions = this.dimensions.compensated,
            margin     = this.dimensions.margin, 
            width      = dimensions.width, 
            height     = dimensions.height;
        
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
            
        })(this.canvas[0], this.canvas[1]);
        
        
        with(this.__WebGLObjects) {
            
            draw.getContext(function (gl) {
                
                if(!gl.getParameter(gl.SAMPLES))
                    this.resize(width * 2, height * 2)
                        .texture({
                          10241    : 9729, // TEXTURE_MIN_FILTER : LINEAR
                          10240    : 9729, // TEXTURE_MAG_FILTER : LINEAR
                     });
                
            });
            
            
        }
        
        return Widget.prototype.resize.call(this), this.render();;
        
    }

    Gauge.prototype.update = function (value, i) {
        
        var context    = this,
            e          = this.event,
            draw       = this.__WebGLObjects.draw,
            options    = this.options,
            startAngle, endAngle,
            colors, texture,
            dimensions, width, height,
            outer, inner, angle, divisions,
            buffer, data, scale_w, scale_h, i, a, length, ctx;
        
        switch(e ? e.type : null) {
                
            case null    :
                
                this.value = value;
                this.render();
                
                break;
                
            case 'save'    :
                
            case 'refresh' :
                
                ctx        = this.canvas[0].node().getContext("2d"),
                dimensions = this.dimensions.compensated,
                width      = dimensions.width,
                height     = dimensions.height,
                scale_w    = Math.min(1, height / width),
                scale_h    = Math.min(1, width / height),
                buffer     = this.__WebGLObjects.buffer,
                colors     = this.options.colors.map(convert),
                texture    = this.__WebGLObjects.textures[0],
                startAngle = (options.startAngle * (Math.PI / 180)),
                endAngle   = (options.endAngle   * (Math.PI / 180)),
                data       = [],
                outer      = options.outerRadius,
                inner      = options.innerRadius,
                divisions  = 256,
                angle      = endAngle / divisions;
               
                
                for(i = 0, length = colors.length; i < length; i++) {
                    colors.push.apply(colors, colors[i]);
                    colors.push(255);
                }

                colors.splice(0, length);
                colors = new Uint8Array(colors);
                
                for(i = 0, a; i <= divisions; i++) {
                    
                    a = (endAngle - startAngle) + (angle * i);
                    
                    data.push(
                        Math.cos( a ) * outer * scale_w,
                        Math.sin( a ) * outer * scale_h,
                        angle * i,
                        Math.cos( a ) * inner * scale_w,
                        Math.sin( a ) * inner * scale_h,
                        angle * i
                    );

                }
                
                draw.getContext(function (gl, program) {
                    
                    gl.lineWidth(options.lineWidth);
                    
                    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
                    
                    this.parameter("startAngle", "1f", startAngle)
                         .parameter("endAngle", "1f", endAngle)
                         .activate(1)
                         .texture(texture, {
                            'width'  : colors.length / 4,
                            'height' : 1,
                            10241   : 9729, // TEXTURE_MIN_FILTER : LINEAR
                            10240   : 9729, // TEXTURE_MAG_FILTER : LINEAR
                            'data'   : colors
                         });
                        
                    
                });
                
                draw.length = data.length;
                this.selector[2].domain(this.options.scale);
      
        }
    }
    
    function convert (hex ) { return d3.values(d3.rgb(hex)).slice(0, 3); }
    
    Gauge.prototype.draw = function () {
        
        var dimensions = this.dimensions.compensated,
            draw       = this.__WebGLObjects.draw,
            width      = dimensions.width,
            height     = dimensions.height,
            canvas     = this.canvas[0].node(),
            ctx        = canvas.getContext("2d");
        
        ctx.font   = "40px Arial";
        ctx.fillStyle = "#FFFFFF";
        
        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";
        
        ctx.clearRect(0, 0, width, height);
        
        ctx.fillText( this.selector[2].invert(this.value), width / 2, height / 2);
        
        draw.render();
        
    }
    
    return Gauge;
    
});