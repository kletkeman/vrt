/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
    
*/

define([
    
      'debug'
    , 'jquery'
    , 'types/widget'
    , 'lib/types/base/image'
    , 'lib/api'
    , 'd3'
    , 'types/lib/effect'
    , 'text!types/lib/shaders/minimal.vert.c'
    , 'text!types/lib/shaders/effect.blur.frag.c'
    
], function(
       
      debug
    , $
    , Widget
    , Image
    , vrt
    , d3
    , Effect
    , vertsha_src
    , blursha_src
    
) { debug = debug("widget:image");

    const   transition_time_milliseconds = 500,
            default_ease                 = d3.ease("cubic-in-out");
   
    Image.prototype.blur = function (yes) {
        
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
                
    Image.prototype.create = function () {
        
        Widget.prototype.create.call(this);
        
        var context    = this, 
            element    = d3.select(this.element),
            interval, gl;
        
        (this.options =
        $.extend({
            url  : "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAxNi4wLjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIHZlcnNpb249IjEuMSINCgkgaWQ9InN2ZzIiIGlua3NjYXBlOnZlcnNpb249IjAuNDguNSByMTAwNDAiIHNvZGlwb2RpOmRvY25hbWU9ImxvZ29fdnJ0LnN2ZyIgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIiB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIiB4bWxuczpzdmc9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiIHhtbG5zOnNvZGlwb2RpPSJodHRwOi8vc29kaXBvZGkuc291cmNlZm9yZ2UubmV0L0RURC9zb2RpcG9kaS0wLmR0ZCIgeG1sbnM6aW5rc2NhcGU9Imh0dHA6Ly93d3cuaW5rc2NhcGUub3JnL25hbWVzcGFjZXMvaW5rc2NhcGUiDQoJIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IiB3aWR0aD0iNDAwLjc2MnB4Ig0KCSBoZWlnaHQ9IjI2My4xODlweCIgdmlld0JveD0iMCAwIDQwMC43NjIgMjYzLjE4OSIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgNDAwLjc2MiAyNjMuMTg5IiB4bWw6c3BhY2U9InByZXNlcnZlIj4NCjxnIGZpbGw9IiNGNEY0RjQiPg0KCTxwYXRoIGQ9Ik0zODguMzI3LDIuMzI2SDE4My45M2MwLDAsMCwwLjAxNCwwLDAuMDE2aC0wLjQ0N2MtNDguMTg1LDAtNzQuNzUsMjUuNTYzLTc0Ljc1LDY2LjQzOA0KCQljMCwzOC4yMTYsMjEuNTk2LDU4LjE2Nyw1Mi41LDY0LjgxMmMtMTkuOTM4LDUuOTgxLTMwLjU2NSwyOC4yMzMtNTUuMTU2LDkwLjM3NWMtMy42NTUtMTMuMjkzLTQuMzktMTkuNTk3LTguNzEtMzEuODkyDQoJCUwzMi41NjcsOS42MzVDMzAuMjQsMi45OTEsMjQuNTkxLDAsMTguMjc3LDBjLTEuOTkzLDAtMy45ODcsMC4zMzMtNS45ODEsMC45OTdDNS4zMTcsMi42NTgsMCw4LjMwNywwLDE0Ljk1NA0KCQljMCwxLjY2MSwwLjMzMiwzLjY1NSwwLjk5Nyw1LjMxN0w4Ni40LDI0Ny45MDNjNC4zMTksMTEuNjMxLDEyLjI5NSwxNS4yODYsMjIuNTk3LDE1LjI4NmwtMC4wNTMtMC43MDkNCgkJYzIuMDEyLDAuNDYsNC4xNjcsMC43MDUsNi4xMDEsMC43MDVjNS42NDksMCwxMC42NDMtMi42NDUsMTIuOTY5LTguNjI1bDguMjgxLTIxLjI4MWMyMS45Ny01OS41LDM5LjU4NS04OC4wNjMsNjQuMDg2LTg4LjA2Mw0KCQljMjYuNDk5LDAsMjcuNDk5LTM0LjQ1OCwwLTM0LjQ1OGwtMTYuMzM0LTAuMTY3Yy0yOC4yNDYsMC00My40MDgtMTAuNTctNDMuNDA4LTM3LjE1NWMwLTI4LjI0NiwxNS4yNjktNDMuNTMxLDQ0Ljg0NC00My41MzENCgkJaDY3LjQ2OWM1LjY1MSwwLDkuMzQyLDIuMzk2LDEwLjU0MSw3LjU0MmMtMC4wMDIsMC4yNi0wLjAxMSwwLjUxMS0wLjAxMSwwLjc3M3YyMTAuNjg4YzAsNy41OCw0LjExMywxMi4wNTgsMTAuMzk0LDEzLjYzDQoJCWMxLjYzNSwwLjQyMywzLjQxNSwwLjY0Nyw1LjMyNiwwLjY0N2MwLjAxNywwLDAuMDMtMC4wMDIsMC4wNDgtMC4wMDJjMC4wNTksMC4wMDEsMC4xMTMsMC4wMDYsMC4xNzEsMC4wMDYNCgkJYzIuMjM4LDAsNC4zMTItMC4yOTEsNi4xNjEtMC44NzFjNS44MTEtMS43NTEsOS41NTktNi4xNzIsOS41NTktMTMuNDE0VjM4LjIxN2MwLTAuMjYtMC4wMDktMC41MDktMC4wMTEtMC43NjcNCgkJYzEuMTk5LTUuMTQ2LDQuODktNy41NDIsMTAuNTQxLTcuNTQybDc1LjIxMS0wLjE1bC0wLjQ2LTAuMTVoNy45MDZjNy41MjUsMCwxMi40MzUtNC42ODUsMTIuNDM1LTEyLjMyNw0KCQlDNDAwLjc2Miw5LjMwNCwzOTYuMTc5LDIuMzI2LDM4OC4zMjcsMi4zMjZ6Ii8+DQo8L2c+DQo8L3N2Zz4NCg==",
            scale : 1,
            blur : 0,
            fill : false,
            color : "#FFFFFF"
        }, this.options));
        
        with(this.options) {
            prepend ("scale", 0, 2);
            prepend ("blur", 0, 1);
            prepend ("color", "color");
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
        
        with(this.__WebGLObjects) {
            
            blur.use()
                .quad("position", 0)
                .mode(Effect.PASSTHROUGH);
        }
        
        this.blur(false);
        
    }
    
    Image.prototype.destroy = function () {
            
        with(this.__WebGLObjects) {
            blur.destroy();
        }
        
        return Widget.prototype.destroy.call(this);
    }
    
    Image.prototype.resize = function () {
        
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
    
    function image_load_handler (image) {
            
        var canvas     = this.__WebGLObjects.canvas,
            blur       = this.__WebGLObjects.blur,
            dimensions = this.dimensions.compensated,
            width      = dimensions.width,
            height     = dimensions.height,
            ctx        = canvas.getContext("2d"),
            options    = this.options,
            scale      = options.scale,
            xhr        = new XMLHttpRequest();
            
        ctx.clearRect(0,0, width, height);
        ctx.save();

        ctx.scale(scale, scale);

        ctx.drawImage(image,
            ((width  / (scale * 2)) - (image.width  / 2)),
            ((height / (scale * 2)) - (image.height / 2))
        );

        if(options.fill) {
            ctx.globalCompositeOperation = "source-atop";
            ctx.fillStyle = options.color;
            ctx.fillRect(0, 0, width / scale, height / scale);
        }

        ctx.restore();

        blur.render()
            .activate(0)
            .texture({
                37440 : true, //UNPACK_FLIP_Y_WEBGL
                image : canvas
          });
            
    }
   
    function xhr_load_handler (context) {
        
        var image = document.createElement('img');

            image.src    = window.URL.createObjectURL(this.response);
            image.onload = image_load_handler.bind(context, image);
    }
   
    function xhr_error_handler () {
        
        var options    = this.options,
            dimensions = this.dimensions.compensated,
            width      = dimensions.width,
            height     = dimensions.height,
            image      = document.createElement('img'),
            canvas     = this.__WebGLObjects.canvas,
            ctx        = canvas.getContext("2d"),
            blur       = this.__WebGLObjects.blur,
            lw         = Math.sqrt(width * height) / 50,
            radius     = Math.min(width, height) / 2 - lw;
            
            ctx.save();
            ctx.clearRect(0,0, width, height);
        
            ctx.strokeStyle = "#FF0000";
            ctx.lineWidth = lw;
        
            ctx.beginPath();
            ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
            
            ctx.closePath();
            ctx.stroke();
            ctx.translate(width / 2, height / 2);
            ctx.rotate(45 * Math.PI / 180);
            ctx.beginPath();
            ctx.moveTo(0, radius);
            ctx.lineTo(0, -radius);
        
            ctx.stroke();
        
            ctx.restore();
        
            blur.render()
                .activate(0)
                .texture({
                    37440 : true, //UNPACK_FLIP_Y_WEBGL
                    image : canvas
              });
        
            image.src    = options.url;
            image.onload = image_load_handler.bind(this, image);
    }
   
    Image.prototype.draw = function () {
        
        var context = this,
            options = this.options,
            xhr     = new XMLHttpRequest();
        
        xhr.open('GET', options.url, true);
        xhr.responseType = 'blob';
        
        xhr.onload = xhr_load_handler.bind(xhr, this);
        xhr.onerror = xhr_error_handler.bind(this);

        xhr.send();
        
    }
    
    return Image;
    
});