/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
    
*/

define([
    
      'debug'
    , 'jquery'
    , 'types/widget'
    , 'lib/types/base/datetime'
    , 'lib/api'
    , 'd3'
    , 'types/lib/effect'
    , 'text!types/lib/shaders/minimal.vert.c'
    , 'text!types/lib/shaders/effect.blur.frag.c'
    
], function(
       
      debug
    , $
    , Widget
    , DateTime
    , vrt
    , d3
    , Effect
    , vertsha_src
    , blursha_src
    
) { debug = debug("widget:datetime");

    const   transition_time_milliseconds = 500,
            default_ease                 = d3.ease("cubic-in-out");
   
    DateTime.prototype.blur = function (yes) {
        
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
                
    DateTime.prototype.create = function () {
        
        Widget.prototype.create.call(this);
        
        var context    = this, 
            element    = d3.select(this.element),
            interval, gl;
        
        (this.options =
        $.extend({
            font       : "Helvetica Neue",
            color      : "#FFFFFF",
            dateformat : "%m/%d/%Y",
            timeformat : "%H:%M:%S",
            blur       : 0
        }, this.options));
        
        with(this.options) {
            prepend ("blur", 0, 1);
            prepend("color", "color");
        }
        
        this.canvas  = element.append("canvas");
        
        with( (gl = this.canvas.node().getContext("webgl")) ) {
            
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
            gl.enable(gl.BLEND);
            
            this.__WebGLObjects = {
                canvas : document.createElement("canvas"),
                blur : new Effect (blursha_src, vertsha_src, gl, function blur (t) {
                    this.interpolate("dir");
                    return default_ease(t);
                }),
            }
        }
        
        this.destroy = function () {
            
            clearInterval(interval);
        
            with(this.__WebGLObjects) {
                blur.destroy();
            }
        
            return Widget.prototype.destroy.call(this);
        }
        
        interval = setInterval(this.render.bind(this), 1000);
        
        with(this.__WebGLObjects) {
            
            blur.use()
                .quad("position", 0)
                .mode(Effect.PASSTHROUGH);
        }
        
        this.blur(false);
        
    }
    
    DateTime.prototype.resize = function () {
        
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
        
        return Widget.prototype.resize.call(this);
        
    }
    
    function font (size) {
        return size + "px " + this.options.font;
    }
   
    DateTime.prototype.draw = function () {
        
        var canvas     = this.__WebGLObjects.canvas,
            blur       = this.__WebGLObjects.blur,
            dimensions = this.dimensions.compensated,
            width      = dimensions.width,
            height     = dimensions.height,
            ctx        = canvas.getContext("2d"),
            now        = new Date,
            text       = [
                d3.time.format(this.options.timeformat)(now),
                d3.time.format(this.options.dateformat)(now)
            ],
            size = Math.round(height / 8);
        
        if (!this.visible())
            return;
        
        ctx.save();
        
        ctx.fillStyle = this.options.color;
        
        ctx.textAlign    = "center";
        ctx.textBaseline = "bottom";
        
        ctx.clearRect(0, 0, width, height);
        
        ctx.font = font.call(this, size  * 4);
        ctx.font = font.call(this, (size * 4) / Math.max(1, (ctx.measureText(text[0]).width / width)));
        
        ctx.fillText(text[0], width / 2,  size + height / 2);
        
        ctx.textBaseline = "top";
        
        ctx.font = font.call(this, size  * 2);
        ctx.font = font.call(this, (size * 2) / Math.max(1, (ctx.measureText(text[1]).width / width)));
        
        ctx.fillText(text[1], width / 2, size + height / 2);
        
        ctx.restore();
        
        blur.render()
            .activate(0)
            .texture({
                37440 : true, //UNPACK_FLIP_Y_WEBGL
                image : canvas
            });
    }
    
    return DateTime;
    
});