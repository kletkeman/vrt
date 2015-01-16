/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
    
*/

define([
     'jquery'
    ,'debug'
    , 'text!types/lib/shaders/minimal.vert.c'
    , 'text!types/lib/shaders/composite.frag.c'
],
function (
    $
   , debug
   , vertex_src
   , composite_src
) { debug = debug("lib:effect");
    
   const PASSTHROUGH       = 0x1,
         PINGPONG          = 0x2,
         pixelstorei_enums = [3317, 3333, 37440, 37441, 37443]; // UNPACK_ALIGNMENT, PACK_ALIGNMENT, UNPACK_FLIP_Y_WEBGL, UNPACK_PREMULTIPLY_ALPHA_WEBGL, UNPACK_COLORSPACE_CONVERSION_WEBGL
   
   var instance__counter = 0;
   
   function default_ease (t) {
       return t;
   }
   
   function default_draw (gl) {
       with( (gl = gl || this._gl)) {
        return drawArrays(TRIANGLE_STRIP, 0, 4), this;
       }
   }
    
   function Effect (fs_src, vs_src, gl, ease, draw) {
        
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
        }
        
        
        this._gl            = gl;
        this._shaders       = shaders;
        this._ease          = typeof ease === 'function' ? ease : default_ease;
        this.draw           = typeof draw === 'function' ? draw : default_draw;
        
        this._parameters    = {};
        this._transition    = {
            parameters: {}
        };
        
        this._iterations    = 0;
        this._mode          = PASSTHROUGH;
        this._out           = null;
        this._composite     = null;
        this._previous      = null;
        this._next          = null;
        this._bypassed      = false;
       
        with (gl) {
           
            canvas.__framebuffers__ =  canvas.__framebuffers__ || [];
            canvas.__textures__     =  canvas.__textures__     || [];
            canvas.__queue__        =  canvas.__queue__        || [];
           
           this._texture            = texture.call(this, createTexture());
            
           with (canvas.__framebuffers__) {

                if(!length) {

                    debug("creating framebuffers");

                    for(var i = 0; i < 2; i++) {

                        push(createFramebuffer(), texture.call(this, createTexture()));

                        bindFramebuffer(FRAMEBUFFER, valueOf()[length - 2]);

                        framebufferTexture2D(FRAMEBUFFER, COLOR_ATTACHMENT0, TEXTURE_2D, valueOf()[length - 1], 0);

                    }

                }
            }


            this.stop();

            this.use()
                .parameter('alpha', '1f', 1.)
                .parameter('sampler', '1i', 0)
                .parameter('time', '1f', 0.)
                .parameter('resolution', '2f', [canvas.width, canvas.height]);
           
       }
       
       instance__counter++;
                
    }
   
    Effect.prototype.bypass = function (bypassed) {
        return (this._bypassed = bypassed), this;
    }
    
    function bypassed (name) {
        
        var sibling = this[name];
        
        if(sibling instanceof Effect) {
            
            while(sibling._bypassed) {
                
                if(sibling[name] instanceof Effect)
                    sibling = sibling[name];
                else
                    break;
            
            }
            
            return sibling;
            
        }
        else if(sibling !== null)
            throw "Sibling is not an [Effect] instance";
    }
   
    Effect.prototype.destination = function () {
        return this._next;
    }
    
    Effect.prototype.source      = function () {
        return this._previous;
    } 
   
    Effect.prototype.resize = function (width, height) {
        
        var gl           = this._gl,
            renderbuffer = this._renderbuffer;
        
        if(!arguments.length === 2) 
                throw "Missing argument(s)";
           
        with(gl) {
            
            if(!width)
                console.warn("width is 0");
                    
            if(!height)
                console.warn("height is 0");
                    
            if(!width || !height) {
                debug("0 dimension detected, will not continue");
                return this;
            }
            
            if(!renderbuffer)
                debug("creating renderbuffer");
            
            this._renderbuffer  = renderbuffer = this._renderbuffer || [createFramebuffer(), createRenderbuffer()];
            
            renderbuffer.width  = width;
            renderbuffer.height = height;
            
            this.texture(width, height);
        
            bindFramebuffer(FRAMEBUFFER,   renderbuffer[0]);
            bindRenderbuffer(RENDERBUFFER, renderbuffer[1]);
                
            framebufferRenderbuffer(FRAMEBUFFER, COLOR_ATTACHMENT0, RENDERBUFFER, renderbuffer[1]);
                
            renderbufferStorage(RENDERBUFFER, RGBA4, width, height);
            
            debug("configured renderbuffer (width, height)", width, height);
            
            bindFramebuffer(FRAMEBUFFER,   null);
            bindRenderbuffer(RENDERBUFFER, null);
            
        }
        
        return this;
        
    }
   
    Effect.prototype.mode = function (mode) {
        
        var previous = this._previous, next = this._next;
        
        while(previous) {
            
            previous._mode = mode;
            previous = previous._previous;
        }
        
        while(next) {
            
            next._mode = mode;
            next = next._next;
        }
        
        this._mode = mode;
        
        return this;
    }
   
    function configure () {

        var framebuffers, textures, resolution2f, width, height, i,
            gl        = this._gl,
            sampler1i = this.parameter("sampler") || 0;

        with(gl) {

            activeTexture(gl['TEXTURE' + sampler1i]);

            width = canvas.__width__,
            height = canvas.__height__;

            framebuffers = canvas.__framebuffers__;

            if (width !== canvas.width || height !== canvas.height) {

                width  = canvas.__width__  = canvas.width,
                height = canvas.__height__ = canvas.height;
                
                debug("resizing textures to canvas dimensions (width, height)", width, height);

                for (i = 0, textures = canvas.__textures__; i < textures.length; i++) {

                    if ('__width__' in textures[i] && '__height__' in textures[i])
                        continue;

                    texture.call(this, textures[i], width, height);

                }

               

            }
        }



        return this;
    }
   
    function texture (texture, width, height) {
        
        var textures,
            gl      = this._gl,
            canvas  = gl.canvas,
            options = {},
            length = arguments.length,
            image;
        
        with(gl) {
            
            textures = canvas.__textures__;
            
            switch(length) {
                    
                case 0: 
                    
                    texture = this._texture;
                    options = null;
                    
                case 3:
                    
                    break;
                    
                case 1:
                    
                    if (typeof texture === 'object' && !(texture instanceof WebGLTexture) ) {
                    
                        options = texture;
                        texture = this._texture;

                    }
                    else {
                        
                        if( textures.indexOf(texture) > -1)
                            options = null;
                            
                        break;
                    }
                    
                case 2:
                    
                    if(length === 2)
                        if (typeof width === 'object') {

                            options = width;
                            
                        }
                        else {

                            options.width   = texture;
                            options.height  = width;

                            texture         = this._texture;
                        }
                    
                
                default:
                    
                    if( (image = options.image) ) {
                        options.width  = image.width; 
                        options.height = image.height;
                    }
                    
                    if('width' in options)
                        texture.__width__  = width  = options.width;
                    else if('__width__' in texture)
                        width = texture.__width__; 
                    else
                        width = canvas.width;
                    
                    if(!width)
                        console.warn("width is 0");
                    
                    if('height' in options)
                        texture.__height__ = height = options.height;
                    else if('__height__' in texture)
                        height = texture.__height__;
                    else
                        height = canvas.height;
                    
                    if(!height)
                        console.warn("height is 0");
                    
                    if(!width || !height) {
                        debug("0 dimension detected, will not continue");
                        return texture;
                    }
                    
            }

            width   = typeof width  === 'number' ? width  : canvas.width;
            height  = typeof height === 'number' ? height : canvas.height;
        
            bindTexture(TEXTURE_2D, texture || null);
            
            if(options === null)
                return texture;
            
            debug("texture (width, height)", width, height);
            
            for(var p in options) {
            
                if ( (i = pixelstorei_enums.indexOf( (p = parseInt(p)) )) > -1 )
                    pixelStorei(p, options[p]);
                    
            }
            
            if(image)
                texImage2D(options["target"] || TEXTURE_2D, options["level"] || 0, options["internalFormat"] || RGBA, options["format"] || RGBA, options["type"] || UNSIGNED_BYTE, image);
            else
                texImage2D(options["target"] || TEXTURE_2D, options["level"] || 0, options["internalFormat"] || RGBA, width, height, options["border"] || 0, options["format"] || RGBA, options["type"] || UNSIGNED_BYTE, options["data"] || null);

            texParameteri(options["target"] || TEXTURE_2D, TEXTURE_MIN_FILTER, options[TEXTURE_MIN_FILTER] || NEAREST);
            texParameteri(options["target"] || TEXTURE_2D, TEXTURE_MAG_FILTER, options[TEXTURE_MAG_FILTER] || NEAREST);
            texParameteri(options["target"] || TEXTURE_2D, TEXTURE_WRAP_S,     options[TEXTURE_WRAP_S]     || CLAMP_TO_EDGE);
            texParameteri(options["target"] || TEXTURE_2D, TEXTURE_WRAP_T,     options[TEXTURE_WRAP_T]     || CLAMP_TO_EDGE);
            
            with(textures) {
                
                if(indexOf(texture) === -1)
                    push(texture);
            }
        }
        
        return texture;
    }
   
    Effect.prototype.texture = texture;
   
    function bind (sampler1i, width, height) {
        
        var gl           = this._gl,
            iterations   = this._iterations,
            previous     = bypassed.call(this, '_previous'),
            next         = bypassed.call(this, '_next'),
            renderbuffer = this._renderbuffer,
            mode         = this._mode,
            texture = null, framebuffer = null;
        
        sampler1i = typeof sampler1i === 'number' ? sampler1i : this.parameter("sampler") || 0;
        
        with (gl) { with (gl.canvas.__framebuffers__) {
            
            activeTexture(gl['TEXTURE' + sampler1i]);
            
            if(previous && !iterations)
                texture = previous._texture;
            else if(!previous && !iterations && this._mode === PASSTHROUGH)
                texture = this._texture;
            else
                texture = valueOf()[1];
            
            
            if(mode === PASSTHROUGH && renderbuffer)
                framebuffer = this._renderbuffer[0];
            else if(next || iterations)
                framebuffer = valueOf()[2];
            
            width  = framebuffer && renderbuffer ? renderbuffer.width  : (width  || canvas.width);
            height = framebuffer && renderbuffer ? renderbuffer.height : (height || canvas.height);
            
            bindTexture(TEXTURE_2D, texture );
            bindFramebuffer(FRAMEBUFFER,  framebuffer);
            
            framebuffer && viewport(0, 0, width, height);
                        
            this.parameter('resolution', '2f', [width, height]);
            
        }}
        
        return this;
        
    }
   
    Effect.prototype.bind = bind;
    
    Effect.prototype.dimensions = function () {
        
        var renderbuffer = this._renderbuffer
            gl           = this._gl;
        
        with(gl) {
            return renderbuffer ? [renderbuffer.width, renderbuffer.height] : [canvas.width, canvas.height];
        }
    
    }
    
     Effect.prototype.activate = function (u) {
        
        var gl           = this._gl;
        
        with(gl) {
            activeTexture(TEXTURE0 + (typeof u === 'number' ? u : this.parameter("sampler")));
        }
         
         return this;
    
    }
   
    Effect.prototype.render = function (immediately) {

        var gl           = this._gl,
            canvas       = gl.canvas,
            queue        = immediately ? [] : canvas.__queue__,
            framebuffers = canvas.__framebuffers__;
        
        if(queue.indexOf(this) === -1)
            configure.call(this), queue.push(this);
            
        function draw (t) {

            var obj, last, exit, texture, next;

            (canvas.__animationRequestId__ = null);

            with(gl) {

                while ( !exit && (obj = queue.shift()) ) {

                    if (obj instanceof Effect) {
                        
                        if(obj !== last) (last = obj).use();
                        
                        if(obj._mode === PINGPONG) {
                            
                            with(framebuffers) {
                                for(i = 0; i < 2; i++)
                                    push( shift() );
                                
                            }
                        }
                        
                        bind.call(obj);
                        
                        texture = obj._texture;

                        if(obj._iterations) {
                            
                            obj.tick(t);
                            
                            if(obj._iterations) {
                                queue.unshift(obj);
                            }
                            else
                                bind.call(obj);
                            
                        }
                        else if (!obj.tick(t)) {
                            
                            if(obj._iterations) {
                                
                                bind.call(obj);
                                
                                queue.unshift(obj);
                            }
                            else
                                queue.push(obj);
                        }
                        else if(obj._iterations) {
                            
                            bind.call(obj);
                            
                            queue.unshift(obj);
                            
                        }
                        
                        if ( !obj._iterations && (next = bypassed.call(obj, '_next')) ) {
                            
                            if(queue.indexOf(next) === -1)
                                queue.unshift(next);
                            
                        }
                        else {
                            
                            next = null;
                            exit = !obj || (!obj._iterations && queue.length);
                        
                        }
                        
                        

                    } else
                        throw "This should not happen";

                    obj.draw(gl);
                    
                    if (next && obj._mode === PASSTHROUGH) {
                    
                        bindTexture(TEXTURE_2D, texture);

                        copy.call(obj, texture);
                        
                    }
                    
                }
            }

            debug("render", (window.performance.now() - t), "milliseconds");

            if (queue.length && !immediately)
                (canvas.__animationRequestId__ = requestAnimationFrame(draw));
            
            return last;
        }
        
        return (immediately ? draw(window.performance.now()) : ((canvas.__animationRequestId__ || (canvas.__animationRequestId__ = requestAnimationFrame(draw))), this));
    }
    
    function copy (texture, x, y, width, height) {
        
        switch(arguments.length) {
                
            case 2:
                
                y = x;
                x = texture;
                texture = undefined;
                
                break;
                
            case 4:
                
                height = width;
                width = y;
                y = x;
                x = texture;
                texture = undefined;
        }
        
        with(this._gl) {
            
            if( !(texture instanceof WebGLTexture))
                bindTexture(TEXTURE_2D, (texture = this._texture));
            
            x      = x || 0;
            y      = y || 0;
            
            width  = width  || ('__width__'  in texture ? texture.__width__  :  (width  || canvas.width )),
            height = height || ('__height__' in texture ? texture.__height__ :  (height || canvas.height))

            copyTexSubImage2D(
                TEXTURE_2D, 0, x, y,
                x, y,
                width,
                height
            );
            
        }
        
        return this;
    }
   
    Effect.prototype.copy  = copy;
   
    function composite (src, opera) {
        
        var _composite = this._composite,
            context     = this,
            gl          = this._gl,
            destination;
        
        switch(arguments.length) {
            
            case 0:
                
                return _composite ? _composite[1] : undefined;
            
            default:
            
                if(_composite) {
                    
                    destination = _composite[1];
                    
                    if(_composite[0] !== src)
                        destination.destroy();
                    else
                        return this.chain(destination);
                }
        }
        
        destination = (new Effect(composite_src, vertex_src, gl, function composite () {
               
            context.chain(src).render(true).activate(1).copy();
            context.chain(destination).use().bind();
                
            with(gl) {
                clearColor(0, 0, 0, 0);
                clear(COLOR_BUFFER_BIT);
            }
               
            debug("composite (context, src, destination)", context, src, destination);
                
            return src._transition.alpha;
        
        }));
        
        opera = opera || 0;
        
        this._composite = [src, destination];
        
        return this.chain(destination.parameter("source", "1i", 1).parameter("operation", "1i", opera));
        
    }
   
    Effect.prototype.composite = composite;
   
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
            
            if (this._previous) {
                
                this._previous._next = null;
                this._previous       = null;
            
            }
            
            if (this._next) {
                
                this._next._previous = null;
                this._next           = null;
                
            }
            
        }
            
        return next || this;
        
    }
    
    Effect.prototype.parameter = function (name, type, arg) {
        
        var gl         = this._gl,
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
        
        debug("set parameter (name, type, value)", arguments)
        
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
                    return location === null ? undefined : gl.getUniform(program, location);
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
    
    Effect.prototype.quad = function (name, location) {
        
        with(this._gl) {
            
            bindBuffer(ARRAY_BUFFER, createBuffer());
            bufferData(ARRAY_BUFFER, new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]), STATIC_DRAW);
            bindAttribLocation(this._program, location || 0, String(name));
            enableVertexAttribArray(location || 0);
            vertexAttribPointer(0, 2, FLOAT, false, 0, 0);
            
        }
        
        return this;
    }
    
    Effect.prototype.out = function (value) {
        this._out = value;
        return this;
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
            out, t     = time || window.performance.now();
        
        this.parameter('time', '1f', t);
        
        t = t - start;
        t /= ms;
        t = Math.min(t || 1., 1.);
        
        args.push(t);
        
        while(previous) {
            
            if( (out = previous._out) === null) {
                out = previous._transition.alpha;
            }
            else
                this.parameter("out", "1f", out);
            
            args.push(out);
            previous = previous._previous;
            
        }
        
        alpha = this._ease.apply(this, args);
        
        if(alpha === undefined)
            alpha = t;
        else if(!start && !this._iterations)
            t = alpha;
        
        this.parameter('alpha', '1f', (transition.alpha = alpha));
        
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
        
        var prg    = this._program,
            fs     = this._shaders[0],
            vs     = this._shaders[1],
            gl     = this._gl,
            canvas = gl.canvas,
            obj;
        
        this.chain();
        
        with(gl) {
        
            detachShader(prg, vs);
            detachShader(prg, fs);
            
            deleteShader(fs);
            deleteShader(vs);
            
            deleteProgram(prg);
            
            deleteTexture(this._texture);
            
            if(!--instance__counter) {

                with(canvas.__framebuffers__) {

                    while( length ) {

                        obj = shift();

                        if( obj instanceof WebGLFramebuffer )
                            deleteFramebuffer(obj);
                    }
                }

                with(canvas.__textures__) {

                    while( length ) {

                        obj = shift();

                        if( obj instanceof WebGLTexture )
                            deleteTexture(obj);
                    }
                }
                
            }
        }
        
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
   
    Effect.PASSTHROUGH = PASSTHROUGH;
    Effect.PINGPONG    = PINGPONG;
    
    return Effect;

});