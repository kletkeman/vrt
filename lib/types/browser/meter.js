/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
    
*/

define([
    
      'debug'
    , 'jquery'
    , 'types/widget'
    , 'lib/types/base/meter'
    , 'lib/api'
    , 'd3'
    , 'types/lib/effect'
    , 'text!types/lib/shaders/minimal.vert.c'
    , 'text!types/lib/shaders/effect.blur.frag.c'
    , 'text!types/lib/meter/shaders/meter.frag.c'
    
], function(
       
      debug
    , $
    , Widget
    , Meter
    , vrt
    , d3
    , Effect
    , vertex_shader_source
    , blur_fragment_shader_source
    , meter_fragment_shader_source
    
) { debug = debug("widget:image");

    const   transition_time_milliseconds = 500,
            default_ease                 = d3.ease("cubic-in-out");
   
    Meter.prototype.blur = function (yes) {
        
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
                
    Meter.prototype.create = function () {
        
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
            fill         : false,
            lineWidth    : 2,
            scale        : [0,1]
        }, this.options));
        
        with(this.options) {
            
            
            prepend ("blur", 0, 1);
            prepend ("colors", "color");
        }
        
        this.selector = [
            "value",
             {
                left : 1,
                top  : 0
            },
            d3.scale.linear().domain(this.options.scale).range([0,1])
        ];
        
        this.canvas  = element.append("canvas");
        
        with( (gl = this.canvas.node().getContext("webgl")) ) {
            
            this.__WebGLObjects = {
                
                textures : [createTexture()],
                
                buffer : (buffer = createBuffer()),
                
                blur : new Effect (blur_fragment_shader_source, vertex_shader_source, gl,
                function blur (t) {
                    this.interpolate("dir");
                    return default_ease(t);
                }),
                
                draw : new Effect (meter_fragment_shader_source, vertex_shader_source, gl,
                function meter (t) {
                    return default_ease(t);
                }, function draw (gl) {
                    
                    gl.clear(gl.COLOR_BUFFER_BIT)
                    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
                    
                    this.parameter("value", "1f", context.value);
                    
                    return gl.drawArrays(context.options.fill ? gl.TRIANGLE_STRIP : gl.LINES, 0, this.length / 2), this;
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

                })
                .chain(blur)
                .quad(0, "position")
                .mode(Effect.PASSTHROUGH);
        }
        
        this.blur(false);
        
    }
    
    Meter.prototype.destroy = function () {
        
        with(this.__WebGLObjects) {
            
            blur.destroy();
            draw.destroy();
            
        }
        
        return Widget.prototype.destroy.call(this);
    }
    
    Meter.prototype.resize = function () {
        
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
            
        })(this.canvas, d3.select(this.__WebGLObjects.canvas));
        
        
        with(this.__WebGLObjects) {
            
            draw.parameter("colors", "1i", 1);
             
        }
        
        return Widget.prototype.resize.call(this);
        
    }

    Meter.prototype.update = function (value) {
        
        var context    = this,
            e          = this.event,
            draw       = this.__WebGLObjects.draw,
            options    = this.options,
            colors, texture, divisions,
            buffer, data, i, length, y;
        
        switch(e ? e.type : null) {
                
            case null    :
                
                this.value = value;
                draw.render();
                
                break;
                
            case 'save'    :
                
            case 'refresh' :
                
                
                buffer     = this.__WebGLObjects.buffer,
                colors     = this.options.colors.map(convert),
                texture    = this.__WebGLObjects.textures[0],
                data       = [],
                divisions  = 16;
                
                for(i = 0, length = colors.length; i < length; i++) {
                    colors.push.apply(colors, colors[i]);
                    colors.push(255);
                }

                colors.splice(0, length);
                colors = new Uint8Array(colors);
                
                for(i = 0; i <= divisions; i++) {
                    
                    y = ((2 / divisions) * i) - 1;
                    
                    data.push(
                        -1, y,
                         1, y
                    );

                }
                
                draw.getContext(function (gl, program) {
                    
                    gl.lineWidth(options.lineWidth);
                    
                    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
                    
                    this.activate(1)
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
    
    Meter.prototype.draw = function () {
        
        var draw = this.__WebGLObjects.draw;
        draw.render();
        
    }
    
    return Meter;
    
});