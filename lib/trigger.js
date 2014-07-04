define(['jquery', 'debug'], function ($, debug) {

    var handles = [], data;
    
    debug = debug('trigger');

    function read (key) {
      key = String(key);
      if(this[this.length - 1].input || this[this.length - 1] === 'input')
        this.pop();
        return this.push(arguments.length ? {input: key} : 'input'), this;
    };
    
    function to (key) {
        key = String(key);
        return this.push({output: key}), this;
    };
    
    function set (value) {
      if(this[this.length - 1].set)
        this.pop();
        return this.push({set: value}), this;
    };
                                
    function define (name) {
        name = String(name);
        if(name.indexOf('_') > -1) {
            this.destroy(); throw new Error('Variable names with underscore is reserved for internal use');
        }
        else if(!this.length || (this[this.length - 1].input && !this[this.length - 1].set))
            throw new Error("Must read() or set() a value first");
        return this.push({define: name}), this;
    };
    
    function cwd (path) {  
      path = String(path);
      if(this[this.length - 1].cwd)
        this.pop();
        return this.push({cwd: path}), this;
    };
    
    function wait (path) {
        path = path ? path : '';
        if(typeof this[this.length - 1].wait !== 'undefined')
            this.pop();
        return this.push({wait : path}), this;
    };
    
    function exit () {
        if(this[this.length - 1] !== 'exit')
            this.push('exit');
        return this;
    };
    
    function call (fn) {
      if(typeof fn !== 'function')
          throw new Error ('Must provide a function to call');
      this.push({call: fn});
      return this;
    };

    function clear () {
        var setup = this.setup();
        while(this[this.length-1].setup !== setup && this.pop());
        return this;
    };
    
    function _setup () {
        return this[0].setup;
    };

    function cast (type) {
      if([Number,String,Boolean].indexOf(type) === -1)
        throw new Error("Valid types are Number, String, Boolean");
        return this.push({cast: type.name}), this;
    };
        
    function write () {
        if(this[this.length - 1] !== 'write')
            this.push('write');    
        return this;
    };
    
    function enter () {
       if(this[this.length - 1] === 'enter')
            this.pop();    
        return this.push('enter'), this;
    };
    
    function save () {
       if(this[this.length - 1] === 'save')
            this.pop();    
        return this.push('save'), this;
    };
    
    function restore () {
       if(this[this.length - 1] === 'restore')
            this.pop();    
        return this.push('restore'), this;
    };
    /**
    function map (path, dest) {
        path = path ? path : '';
        if(typeof this[this.length - 1].map !== 'undefined')
            this.pop();
        return this.push({map : {path: path, destination: dest}), this;
    };*/
        
    function _trigger (path) {
        path  = path ? String(path) : '';
        if(this.context().constructor.name !== 'Api')
          throw new Error("Cannot call trigger() from this context");
        else if(this[this.length - 1].trigger || this[this.length - 1] === 'trigger')
            this.pop();    
        return this.push(path ? {trigger: path} : 'trigger'), this;
    };
    
    function toJSON () {
        var json = {};
        for(var k in this)
          json[k] = this[k];
        return json;
    };

    function destroy () {
      var self = this;
      handles = handles.filter(function(create) { return create !== self; });
    };
    
    function trigger () {
        
        var context = this; 

        function create (path) {
            
            if(!arguments.length)
                return create.toJSON();
            
            var instructions = (create[path] = create[path] || setup(path)), variables, internally_declared;
            
            (instructions.setup   = _setup),
            (instructions.destroy = function () {
                delete create[path];
            });
            
            (variables = instructions.setup().variables);
            
            (internally_declared = Object.keys(variables).filter(
                function(name) { 
                    return name.indexOf('_') > -1; 
                }
            ));
            
            for(var name in variables)
                (function def_init (name) {        
                        
                    var internal = internally_declared.indexOf(name) > -1;
                        
                    if (name in Array.prototype ) {
                      instructions.destroy(); throw new Error("Invalid variable name: " + name);
                    }

                    (instructions[internal ? name.slice(1) : name] = function () {
                        return set.call(this, '$'+name);
                    });

                })(name);
            
            return (instructions.read        = read), 
                   (instructions.to          = to),
                   (instructions.set         = set), 
                   (instructions.define      = define), 
                   (instructions.cwd         = cwd), 
                   (instructions.wait        = wait),
                   (instructions.clear       = clear),
                   (instructions.cast        = cast),
                   (instructions.call        = call),
                   (instructions.enter       = enter),
                   (instructions.trigger     = _trigger),
                   (instructions.context     = create.context),
                   (instructions.exit        = exit), instructions;
        };

        Object.defineProperties(create, {
          toJSON : {
            enumerable: false,
            configurable : false,
            value: toJSON
          },
          context : {
            enumerable: false,
            configurable : false,
            value : function () {
              return context;
            }
          },
          destroy : {
            enumerable: false,
            configurable : false,
            value: destroy
          }
        });
        
        return handles.push(create), create;
    
    };

    (trigger.data = function (d) {
      if(!arguments.length)
        return data;
      return (data = d), trigger;
     }),
    (trigger.dispatch = dispatch);
    
    function match (path) {

      var handle, index = 0, result, setup, instructions;

      path = encodeURIComponent(path);
      
      while((handle = handles[index++])) {
       for(var trigger_path in handle) {
         
         instructions = handle[trigger_path],
         setup        = instructions[0].setup;

         if(!setup)
           throw new Error("Missing setup");
         else if(result = RegExp(setup.regex).exec(path)) {

            for (var i=1,len=result.length,variables=setup.variables,keys=Object.keys(setup.variables),key,value;i<len;++i) {

                key   = keys[i-1];
                value = 'string' === typeof result[i]?decodeURIComponent(result[i]):result[i];

                if (key)
                  variables[key] = value;
            
            }
             
            (variables._path = path), execute.call(handle, instructions, variables, setup);
         }

        }
      }
    
    };
    
    function resolve (path, value) {
        
        var d = this;
        
        if(!path.length) return d;
        else if(typeof d !== 'object')
            throw new Error("resolve() called on non-object;");
        
        path = (typeof path === 'string' ? path.split(".") : "");
        
        if(arguments.length === 2 && path.length > 1 && typeof resolve.call(d, path.slice(0, path.length - 1).join(".")) !== 'object')
            throw new Error("Tried to set a value on a non-object or an object that does not exist");
            
        for(var i = 0, len = path.length, p = path[i]; i < len; i++, p = path[i]) {

            if(typeof d === 'object') {
                if(p === path[len - 1])
                    return typeof value !== 'undefined' ? (d[p] = value) : d[p];
                else d = d[p];
            }
        }
        
        return d;
            
    };

    function replace (s) {
        var context = this;
        if(typeof s !== 'string') return s;
        return s.replace(/(\$\w+)/gi, function(variable) {
            var v = context[variable.substr(1, variable.length)];
            if(typeof v === 'undefined')
                throw new Error ("Undefined variable: " + variable);
            return v;
        });
    };

    function goto (at, to, skip, position, data, instruction) {
        var pos = 0; 
        position = (to ? ((pos = this.slice(position).indexOf(to)) === -1 ? 0 : pos) : 0) + position + skip;
        return at ? at(position, data, instruction) : position;
    };
        
    function execute (instructions, variables) {
      
        var context = this.context(),
            vrt     = require('lib/api'),
            create  = this,
            output  = null, 
            value   = null,
            scope   = {},
            wd      = variables._path,
            stack;

        if(instructions[instructions.length - 1] !== 'exit')
           instructions.push('exit');
        
         debug("Trigger on ", wd);

        return (function at (position, data, instruction) 
                
            { var keys, len, path, sliced, handle, tr, pos;

              (value       = value !== null ? value : data),
              (instruction = instruction || instructions[position]);            
             
             if(!instruction) return;
             
             debug("Executing Instruction", instruction);
             debug("Value : ", value);
             debug("Scope : ", scope);
             debug("Ouput : ", output);
             debug("Variables : ", variables);

             if( instruction === 'save') {
                 
                stack = stack || {};
                 
                (output !== null ? (stack.output = stack.output || []) : (stack.scope  = stack.scope  || []))
                .push([
                    (function clone (obj, copy) {

                        if(typeof obj !== 'object' || typeof copy !== 'object'  )
                            throw new Error("Expected Object");

                        if(Array.isArray(obj)) {

                            obj.forEach(function(d, i) {

                                if(typeof d === 'object')
                                    copy[i] = clone(obj[i],  (Array.isArray(obj[k])?[]:{}) );
                                else
                                    copy[i] = obj[i];
                            });
                        }
                        else {

                            for(var k in obj) {

                                if(typeof obj[k] === 'object')
                                    copy[k] = clone(obj[k], (Array.isArray(obj[k])?[]:{}) );
                                else
                                    copy[k] = obj[k];
                            }

                        }

                        return copy;

                    })(output !== null ? output : scope, {})
                ]);
                 
             }
             else if(instruction === 'restore' && stack) {
                             
                 if (output !== null && stack.output && stack.output.length)
                    output = stack.output.pop();
                 else if (stack.scope && stack.scope.length)
                    scope = stack.scope.pop();
                                      
             }
             else if(instruction === 'enter') {
                  
                (output = $.extend(true, {}, scope));

                if(context.constructor.name === 'Api') {

                    if(context.list(scope).length)
                      return goto.call(instructions, at, 'exit', 0, position, data, {exit: false});
                    else {

                      if(typeof variables._sortKey === 'number')
                          ++variables._sortKey;
                      else (variables._sortKey = 0);                

                      (output.sortKey =  variables._sortKey);
                    }
                }

              }
              else if(instruction === 'trigger' || instruction.trigger) {
                if(output instanceof context.type.dataset)
                    return (tr = output.trigger(instruction === 'trigger' ? wd : 
                        replace.call(variables, instruction.trigger))).push.apply(tr,
                          instructions.slice(position + 1,
                            (position = goto.call(instructions, null, 'exit', 0, position)))),
                              at(position, data);
                else 
                    return at(position - 1, data, 'submit');
              }
              else if(typeof instruction.cwd !== 'undefined') {
                if(!instruction.cwd)
                    throw new Error("Can not change current working directory to : " + (instructions[position].cwd || instruction.cwd));
                return vrt.store.tree.get((path = replace.call(variables, instruction.cwd)), 
                    function (err, d) {
                      if(err) throw err;
                      else if(typeof d === 'undefined')
                          throw new Error("No data was returned");
                      return  (variables._path = wd = path), at(position + 1, d);
                    }
                );
              }
              else if (instruction === 'input' || typeof instruction.input !== 'undefined') {
                  
                path = replace.call(variables, instruction.input);

                (value = typeof data !== 'object' || instruction === 'input' ? data : resolve.call(data, path));

                if(typeof value === 'undefined' || value === null)
                  return goto.call(instructions, at, 'exit', 0, position, data, {exit: false});

                (variables._path = wd + '.' + path);

              }
              else if (instruction.output) {

                path = replace.call(variables, instruction.output);

                if(typeof value === 'object')
                  return goto.call(instructions, at, 'exit', 0, position, data, {exit: false});
                else if(path.indexOf(".") > 0 && (keys = path.split(".")).length > 1) {

                    len = 1;

                    while(len < keys.length)
                        typeof resolve.call(output || scope, (sliced = keys.slice(0, len++).join("."))) === 'object'
                        || resolve.call(output || scope, sliced, Object());

                }

                resolve.call(output || scope, path, value);

              }
              else if (typeof instruction.set !== 'undefined') {
                value = replace.call(variables, instruction.set);
              }
              else if (instruction.define) {
                variables[instruction.define] = value;
              }
              else if (instruction.cast) {
                value = instruction.cast(value);
              }
              else if (typeof instruction.call === 'function') {
                value = instruction.call.call(data, value);
              }
              else if (typeof instruction.wait !== 'undefined') {

                path   = replace.call(variables, instruction.wait);              
                handle = trigger.call(null);

                handle(path).call(function () {
                    return handle.destroy(), at(position, data, {cwd: path});
                });

              }
              else if (instruction === 'write') {
                return vrt.store.tree.write(variables._path, data, function (err) {
                    if(err) throw err;
                    return at(position + 1, data);
                });
              }
              else if (output !== null && (instruction === 'exit' || typeof instruction.exit !== 'undefined')) {
                
                for(var k in scope)
                  if(k in output)
                    scope[k] = output[k];
                  
                if(instruction.exit !== false && !(output instanceof vrt.type.dataset))
                    return at(position, data, 'submit');
                  
                (output = null);
                  
              }
              else if (instruction === 'submit') {
                
                if (context.constructor.name === 'Api')
                  return context.create(output, function (err, obj) {
                    if(err) throw err;
                    return (output = instructions[position] === 'exit' ? null : obj), at(position + 1, data);
                  });
                else context.write(output);
                  
                (output = null);
                  
              }

              return at(position + 1, data);

        })(1, data);

    };
 
    function dispatch (path, affected) {
        
       var stack   = [path], 
           data    = this.data();

       return (function dig (d) {
           
           var context = this;

            if(typeof d !== 'object')
                return;

            stack.push(null);

            for(var k in d) {

                stack[stack.length - 1] = k;

                if( typeof d[k] === 'object' && !Array.isArray(d[k]) )
                    dig.call(this, d[k]);
                else if( typeof d[k] !== 'object' )
                    this.data(d[k]), match(stack.join('.'));
                else if( Array.isArray(d[k]) ) {

                    this.data(d[k]), match(stack.join('.'));

                    d[k].forEach(function(_,i) {
                        if(typeof d[k][i] === 'object')
                            dig.call(context, d[k][i]);
                        else
                            context.data(d[k][i]), match(stack.join('.') + '.' + i);
                    });
                }

            }

            return stack.pop(), this.data(resolve.call(data, stack.slice(1, stack.length).join('.'))), match(stack.join('.')); 

        }).call(this, affected), trigger;

    };

    function setup (path) {

        var vars = {};

        if ({}.toString.call(path) == '[object RegExp]') return path;
        if (Array.isArray(path)) path = '(' + path.join('|') + ')';

        path = path
            .concat('/?')
            .replace(/\/\(/g, '(?:/')
            .replace(/(\/)?(\.)?\[(\w+)\](?:(\(.*?\)))?(\?)?(\*)?/g,

                function(_, dot, format, key, capture, optional, star) {

                    vars[key] = null,
                    dot = dot || '';

                    return '' + (optional ? '' : dot) + '(?:' + (optional ? dot : '') + (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')' + (optional || '') + (star ? '(/*)?' : '');

                })
            .replace(/([\/.])/g, '\\$1')
            .replace(/\*/g, '(.*)');

        return [{setup: {regex: ('^' + path + '$'), variables: vars}}];

    };
    
    return trigger;

});
