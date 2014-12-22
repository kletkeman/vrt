/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
    
*/

define([
     'jquery'
    ,'debug'
],
function (
    $
   ,debug
) { debug = debug("lib:effect");
   
   function default_ease (t) {
       return t;
   }
   
   var __WebGLObjects = [];
    
   function Effect (fs_src, vs_src, gl, ease) {
        
        var shader, shaders = [], length = 2;
        
        with (gl) {
            
            shaders.push( createShader(FRAGMENT_SHADER) );
            shaders.push( createShader(VERTEX_SHADER) );
                         
            this._program = createProgram();
            
            shaderSource(shaders[0], fs_src);
            shaderSource(shaders[1], vs_src);
            
            while( length ) {
                
                shader = shaders[length-1];
                        
                compileShader(shader);
                    
                if(!getShaderParameter(shader, COMPILE_STATUS))
                    throw getShaderInfoLog(shader);
                    
                attachShader(this._program, shader);
                
                length--;
                                 
            }
                    
            linkProgram(this._program);
                    
            if(!getProgramParameter(this._program, LINK_STATUS))
                throw getProgramInfoLog(this._program);
            
            with(__WebGLObjects) {
            
                if(!length) {

                    for(var i = 0;i < 2; i++) {

                        push(createFramebuffer(), createTexture());

                        bindFramebuffer(FRAMEBUFFER, valueOf()[length - 2]);
                        bindTexture(TEXTURE_2D, valueOf()[length - 1]);

                        framebufferTexture2D(FRAMEBUFFER, COLOR_ATTACHMENT0, TEXTURE_2D, valueOf()[length - 1], 0);

                    }

                    bindFramebuffer(FRAMEBUFFER, null);
                    bindTexture(TEXTURE_2D, null);
                    
                }
                
            }
            
        }
        
        
        this._gl         = gl;
        this._shaders    = shaders;
        this._ease       = typeof ease === 'function' ? ease : default_ease;
        
        this._parameters = {};
        this._transition = {
            parameters: {}
        };
        this._queue      = [];
        this._iterations = 0;
        
        this.stop();
       
        this.use()
            .parameter('alpha', '1f', 1.)
            .parameter('sampler', '1i', 0)
            .parameter('time', '1f', 0.)
            .parameter('resolution', '2f', [gl.canvas.width, gl.canvas.height]);
                
    }
   
    function switch_framebuffer () {
        
        var framebuffer, texture, width, height,
            sampler1i = this.parameter("sampler");
        
        if(!this._previous && !this._next)
            return;
        
        with (this._gl) {
            
            width  = canvas.width,
            height = canvas.height;
            
            activeTexture(this._gl['TEXTURE' + sampler1i]);
            
            if(!this._previous) {
                
                debug("resizing textures to canvas dimensions (width, height)", width, height);
                
                for(var i = 1; i < __WebGLObjects.length; i+=2) {
                    
                    bindTexture(TEXTURE_2D, __WebGLObjects[i]);
                        
                    texImage2D(TEXTURE_2D, 0, RGBA, width, height, 0, RGBA, UNSIGNED_BYTE, null);

                    texParameteri(TEXTURE_2D, TEXTURE_MIN_FILTER, NEAREST);
                    texParameteri(TEXTURE_2D, TEXTURE_MAG_FILTER, NEAREST);
                    texParameteri(TEXTURE_2D, TEXTURE_WRAP_S, CLAMP_TO_EDGE);
                    texParameteri(TEXTURE_2D, TEXTURE_WRAP_T, CLAMP_TO_EDGE);
                    
                }
                
            }
            
            with (__WebGLObjects) {
                for(var i = 0; i < 2; i++)
                    push( shift() );   
            }
            
            this.bind();
        }   
        
    }
   
    Effect.prototype.bind = function () {
        
        with (this._gl) { with (__WebGLObjects) {
            
            bindTexture(TEXTURE_2D, valueOf()[1]);
            bindFramebuffer(FRAMEBUFFER, this._next || this._iterations ? valueOf()[2] : null);   
            
        }}
        
        return this;
        
    }
   
    Effect.prototype.render = function () {

        var context = this, gl, queue;
        
        while(context._previous) {
            context = context._previous;
        }
        
        gl      = context._gl;
        queue   = context._queue;
        
        if(queue.indexOf(this) === -1)
            queue.push(this);

        function draw (t) {

            var obj, last, exit;

            (context._animationRequestId = null);

            with(gl) {

                while ( !exit && (obj = queue.shift()) ) {

                    if (obj instanceof Effect) {
                        
                        if(obj !== last) (last = obj).use();

                        if(obj._iterations) {
                            
                            obj.tick(t);
                            
                            if(obj._iterations) {
                                queue.unshift(obj);
                                obj = null;
                            }
                            else
                                obj.bind();
                            
                        }
                        else if (!obj.tick(t)) {
                            
                            if(obj._iterations) {
                                
                                obj.bind();
                                
                                queue.unshift(obj);
                                obj = null;
                            }
                            else
                                queue.push(obj);
                        }
                        else if(obj._iterations) {
                            
                            obj.bind();
                            
                            queue.unshift(obj);
                            obj = null;
                            
                        }
                        
                        if ( obj && (obj = chained.call(obj)))
                            queue.unshift(obj);
                        else {
                            exit = queue.length;
                        }
                        
                        

                    } else
                        throw "This should not happen";

                    drawArrays(TRIANGLE_STRIP, 0, 4);
                    
                }
            }

            debug("render", (window.performance.now() - t), "milliseconds");

            if (queue.length)
                return (context._animationRequestId = requestAnimationFrame(draw));
        }
        
        return context._animationRequestId || (context._animationRequestId = requestAnimationFrame(draw));
    }
   
    Effect.prototype.chain = function (next) {
        
        if(next instanceof Effect) {
            
            if(next === this)
                throw "Cannot chain to same instance";
            
            this._next     = next;
            next._previous = this;
        }
        else {
            
            if(arguments.length)
                throw "Wrong type";
            
            while(this._previous) {
                this._previous.chain();
                this._previous = null;
            }
            
            this._next = null;
        }
            
        
        return next || this;
        
    }
    
    function chained () {
        return this._next;
    }
        
    Effect.prototype.parameter = function (name, type, arg) {
        
        var context    = this, 
            gl         = this._gl,
            program    = this._program,
            params     = this._parameters, fn, location;
        
        switch (arguments.length) {
                
            case 0:
                throw "Missing arguments";
            case 1:
                return params[name];
            case 2:
                arg = type;
                type = undefined;
                break;
                
        }
        
        if( ! (name in params) ) {
            
            if(type === undefined)
                throw "Missing parameter type";
            
            location = gl.getUniformLocation(program, name);
            fn       = gl['uniform'+type].bind(gl, location);
            
            if(typeof fn !== 'function')
                throw "Invalid type specified";

            Object.defineProperty(params, name,
            {
                enumerable: true,
                configurable : true,
                get : function () {
                    return gl.getUniform(program, location);
                },
                set : function set (arg) {

                    if(typeof arg === 'object') {
                        fn.apply(gl, arg);
                    }
                    else
                        fn.call(gl, arg);

                    return arg;
                }
            });
        }
        
        if(arg !== undefined)
            params[name] = arg;
        
        return this;
    }
    
    Effect.prototype.extrapolate = function (name, alpha) {
        
    }
    
    Effect.prototype.interpolate = function (name, alpha) {
        
        var transition = this._transition,
            paramA     = transition.parameters.a[name],
            paramB     = transition.parameters.b[name] || (transition.parameters.b[name] = this.parameter(name)),
            result;
        
        switch(arguments.length) {
                    
            case 0:
                throw "A least one arguments (name) is required";
            case 1:
                alpha = transition.alpha;
                break;                
        }
        
        if( paramA === undefined || paramB === undefined ) return paramA || this.parameter(name);
        
        if(typeof paramA === 'object') {
                        
            if( paramA.length !== paramB.length )
                throw "Cannot interpolate parameter";
            
            result = new paramA.constructor(paramA.length);
            
            for(var i = 0, len = paramA.length; i < len; i ++)
               result[i] = interpolate(paramA[i], paramB[i], alpha);
        }
        else
            result = interpolate(paramA, paramB, alpha);
        
        this.parameter(name, result);
        
        return result;
    }
    
    Effect.prototype.use = function () {
        return this._gl.useProgram(this._program), this; 
    }
    
    Effect.prototype.tick = function (time) {
        
        var transition = this._transition, 
            ms         = transition.milliseconds || 0, 
            start      = transition.start, 
            alpha      = transition.alpha,
            canvas     = this._gl.canvas,
            width      = canvas.width,
            height     = canvas.height,
            previous   = this._previous,
            args       = [],
            t, 
        
        t = time || window.performance.now();
        
        this.parameter('time', '1f', t);
        
        t = t - start;
        t /= ms;
        t = Math.min(t || 1., 1.);
        
        switch_framebuffer.call(this);
        
        
        args.push(t);
        
        while(previous) {
            args.push(previous._transition.alpha)
            previous = previous._previous;
        }
        
        alpha = this._ease.apply(this, args);
        
        if(alpha === undefined)
            alpha = t;
        
        this.parameter('alpha', '1f', alpha)
            .parameter('resolution', '2f', [width, height]);
        
        transition.alpha = alpha;
        
        return t >= 1. && this.stop();
        
    }
    
    Effect.prototype.loop = function (iterations) {
        
        if(iterations && --this._iterations < 0) {
            this._iterations = iterations - 1;
        }
        
        return this;
    }
   
    Effect.prototype.inertia = function () {
        
    }
    
    Effect.prototype.transition = function (ms) {
        
        var transition = this._transition;
        
        if(!arguments.length)
            return transition;
        
        transition.alpha        = 0.;
        transition.milliseconds = ms = ms || transition.milliseconds || 0.;
        transition.start        = window.performance.now();
        transition.parameters.a = $.extend(true, {}, this._parameters);
        transition.parameters.b = {};
            
        return this;
    }
    
    Effect.prototype.stop = function () {
        
        var transition = this._transition,
            parameters = transition.parameters;
        
        parameters.a = {};
        parameters.b = {};
        
        transition.alpha = 1.;
        transition.start = null;
        
        return this;
    }
    
    Effect.prototype.destroy = function () {
        
        var prg = this._program,
            fs  = this._shaders[0],
            vs  = this._shaders[1];
        
        unlinkProgram(prg);
        detachShader(prg, vs);
        detachShader(prg, fs);
        deleteShader(fs);
        deleteShader(vs);
        deleteProgram(prg);
        
    }
    
    function interpolate(a, b, alpha) {
        
        var result = (b - a) * alpha + a;
                        
        debug.enabled && debug("interpolate", arguments.length - 3, a, b, result);
                        
        if(arguments.length > 3 && ! (arguments.length % 3) ) {
            
            result = [result, interpolate.apply(null, Array.prototype.slice.call(arguments, 3))];
            
            if( Array.isArray(result[result.length-1]) )
               result = result.concat(result.pop());
        }
                        
        return result;
        
    }
    
    Effect.interpolate = interpolate;
    
    return Effect;

});