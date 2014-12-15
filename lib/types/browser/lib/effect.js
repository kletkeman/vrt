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
) { debug = debug("effect");
    
    function Effect (fs_src, vs_src, gl, ease) {
        
        var shader, shaders = [], length = 2;
        
        with (gl) {
            
            shaders.push( createShader(FRAGMENT_SHADER) );
            shaders.push( createShader(VERTEX_SHADER) );
                         
            this.program = createProgram();
            
            shaderSource(shaders[0], fs_src);
            shaderSource(shaders[1], vs_src);
            
            while( length ) {
                
                shader = shaders[length-1];
                        
                compileShader(shader);
                    
                if(!getShaderParameter(shader, COMPILE_STATUS))
                    throw getShaderInfoLog(shader);
                    
                attachShader(this.program, shader);
                
                length--;
                                 
            }
                    
            linkProgram(this.program);
                    
            if(!getProgramParameter(this.program, LINK_STATUS))
                throw getProgramInfoLog(this.program);                        
        }
        
        this.gl         = gl;
        this.shaders    = shaders;
        this.ease       = ease;
        
        this._parameters = {};        
        this._transition = {
            alpha: 1,
            parameters: {
                a: {},
                b: {}
            }
        };
        
        this.use().parameter('sampler', '1i', 0);
                
    }
        
    Effect.prototype.parameter = function (name, type, arg) {
        
        var context    = this, 
            gl         = this.gl,
            program    = this.program,
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
    
    Effect.prototype.inertia = function () {
        
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
            
            result = new Array(paramA.length);
            
            for(var i = 0, len = paramA.length; i < len; i ++)
               result[i] = (paramB[i] - paramA[i]) * alpha + paramA[i];
        }
        else
            result = (paramB - paramA) * alpha + paramA;
        
        return this.parameter(name, result);
    }
    
    Effect.prototype.use = function () {
        return this.gl.useProgram(this.program), this; 
    }
    
    Effect.prototype.tick = function (t) {
        
        var transition = this._transition, ms = transition.milliseconds, start = transition.start;
        
        t = t || window.performance.now();
        t = t - transition.start;
        t /= ms;
        t = Math.min(t || 1., 1.);
        
        transition.alpha = typeof this.ease === 'function' ? this.ease(t) || t : t;
            
        return t >= 1.;
        
    }
    
    Effect.prototype.transition = function (ms, options) {
        
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
    
    Effect.prototype.destroy = function () {
        
        var prg = this.program, fs = this.shaders[0], vs = this.shaders[1];
        
        unlinkProgram(prg); detachShader(prg, vs); detachShader(prg, fs); deleteShader(fs); deleteShader(vs); deleteProgram(prg);
        
    }
    
    return Effect;

});