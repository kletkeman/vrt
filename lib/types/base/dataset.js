;!(function(module, Guid) {

  function DataSet(fields) {
    
    if(Guid && typeof Guid.create === 'function') {
          this.id = Guid.create().toString();
          fields.id = fields.id || this.id;
	}
      
    this.fromJSON.call(fields);
      
    fields.step = typeof fields.step === 'undefined' ? 1e4 : fields.step;
    fields.bufferSize = typeof fields.bufferSize === 'number' ? fields.bufferSize : 0;

    this.options = {};
    
    if(!(fields instanceof Object))
      throw new Error('TypeError: Missing argument');
      
    var bufferSize;

    Object.defineProperty(this, 'bufferSize', {
      set : function(value) {

          bufferSize = value;

          if(!bufferSize)
            this.data = {};
          else 
            this.data = Array.isArray(this.data) ? this.data : typeof this.data === 'object' ? [this.data] : [];
        },
        get : function() {
          return bufferSize;
        },
        enumerable : true
      
    });

    $.extend(this, fields);

    if(typeof this.onCreate === 'function')
      this.onCreate(DataSet);
    
    // Required properties for all Datasets
    var required = {};
    $.extend(required, arguments.callee.caller.required);
    $.extend(required, arguments.callee.required);

    this.type = this.constructor.name.toLowerCase();
    
    // Check if required properties exists and has the correct type
    for(var propname in required)
      if( (typeof this[propname] === 'undefined' || this[propname].constructor.name !== required[propname].name) && !(this[propname] instanceof required[propname]) )
        throw new Error(typeof this[propname] !== 'undefined' ?
         'Propery `' + propname + '` has wrong type. Type is [' + (typeof this[propname]).capitalize() + '], should be [' + required[propname].name + ']' :
         'Missing property `' + propname + '` [' + required[propname].name + ']');

    
    if(Guid && typeof Guid.isGuid === 'function' && !Guid.isGuid(this.id))
      throw new Error('Property `id` [String] is not a valid UUID');

  };

  DataSet.prototype.set = function(name, value) {
  
    if(typeof name !== 'string' || typeof value === 'undefined')
      throw new Error('Invalid argument(s): Must provide a name (string) and a value.');
    else if(typeof this[name] === 'undefined')
      throw new Error('Property "'+name+'" does not exist');
    else if(['id', 'stacked', 'group', 'sortkey'].indexOf(name) > -1)
      throw new Error('Cannot set property "'+name+'" ILLEGAL');

    this[name] = value;
    
  };


  DataSet.prototype.write = function() {

    var args = Array.prototype.slice.call(arguments),
      x        = args[0],
      data     = args[0],
      callback = args[1],
      context  = this;

    if(typeof x === 'number' && arguments.length === 1)
      return function() { 
        var args = Array.prototype.slice.call(arguments),
          y        = args[0],
          data     = args[0],
          callback = args[1];

        if(typeof y === 'number' && arguments.length === 1)
          return function(data, callback) {
            return vrt.push(x)(y)(context.id, data, callback);
          };

        return vrt.push(x)(context.id, data, callback);
      };

    return vrt.push(this.id, data, callback);
  };

  DataSet.prototype.select = function() {
	 return vrt.store.select.apply(vrt.store, [this.id].concat(Array.prototype.slice.call(arguments)));
  };

  DataSet.prototype.update = function() {
   return vrt.store.update.apply(vrt.store, [this.id].concat(Array.prototype.slice.call(arguments)));
  };

  DataSet.prototype.save = function() {
    return vrt.save.apply(vrt, [this.id].concat(Array.prototype.slice.call(arguments)));
  };

  DataSet.prototype.verify = function(data) {
    for(var name in this.format)
      if( (typeof data[name] === 'undefined' || data[name].constructor.name !== this.format[name].name) )
        throw new Error('Data has wrong format, correct format is : ' + (function(f) {var desc = {};for(var n in f) desc[n] = f[n].name; return JSON.stringify(desc);})(this.format));
  };

  DataSet.prototype.toJSON = function() {
      
	'use strict';
      
	var that = $.extend(true, {}, this);
	
	delete that.toJSON;
    delete that.format;
    delete that.data;
            
    var context = this, 
        stack = [];
      
    

    function walk(that) {
        
        'use strict';
        
        var prev, depth = stack.push(null), type, path;
        
        for(var key in that) {
            
              stack[depth - 1] = key;
            
              if(Array.isArray(that[key]))
                  that[key].forEach(function(d, i) {
                    stack[depth - 1] = key+"["+i+"]";
                    walk(d);
                  });
              else if(typeof that[key] === 'object')
                walk(that[key]);
              else if(typeof that[key] === 'function') {
                  
                  that[key] = that[key].toString();
						
				var m, f;
				if( m = /function (\w+)\(\) \{ \[native code\] \}/i.exec(f = that[key]) ) {
					that[key] = new Function("d", "return " + m[1] + "(d);").toString();
				}
                  
    
              }
            
        }
        
        stack.pop();
        
        return that;
    };
      
    that.schema = walk(that.schema);

    return that;

  };

  DataSet.prototype.fromJSON = function() {
    
    'use strict';
      
    var context = this, 
        stack = [], id = this.id, 
        filename = this._filename || null;

    function walk(that) {
        
        'use strict';
        
        var prev, depth = stack.push(null), type, path;
        
        for(var key in that) {
            
              stack[depth - 1] = key;
            
              if(Array.isArray(that[key]))
                  that[key].forEach(function(d, i) {
                    stack[depth - 1] = key+"["+i+"]";
                    walk(d);
                  });
              else if(typeof that[key] === 'object')
                walk(that[key]);
              else if(typeof that[key] === 'string' && that[key].length) {
                  path = '"'+stack.join('"."')+'"';
                try {
                    if(that[key].match(/^(function(.*)\((.*)\))/gi) && (prev = that[key]))        
                        that[key] = (new Function('return ' + that[key]))();
                    else
                        that[key] = eval.call(that, (prev = that[key])); 
                    if(typeof that[key] === 'undefined')
                        throw new Error(["DataSet#fromJSON()", id, filename, path, "#eval() returned undefined", "[",prev,"]"].join(' '));
                    else if(depth <= 2 && ( (type = typeof that[key]) === 'object' || (type = typeof that[key]) === 'function') )
                        vrt.log.error(["DataSet#fromJSON()", id, filename, path, "[type of", (that[key] = prev), "cannot be", type, "]", depth].join(' '));
                    else
                        vrt.log.warn(["DataSet#fromJSON()", id, filename, path, "was evaluated [Result:", prev, "=>", that[key], "]", depth].join(' '));
                }
                catch(e) {
                    if(typeof that[key] === 'undefined')
                        throw e;
                    vrt.log.debug(["DataSet#fromJSON()", id, filename, path, "evaluation error while running #eval()", "[",prev,"]", e, depth].join(' '));
                }
    
              }
            
        }
        
        stack.pop();
        
        return that;
    };

    return walk(this);

  };
                                      
  DataSet.prototype.delete = function() {
                                      
    var args   = Array.prototype.slice.call(arguments),
        index, filter, path, callback = args.pop();
                                      
    if(typeof callback !== 'function') 
        args.push(callback) && (callback = undefined);
                                      
    switch(args.length) {
            
        case 2: 
            
            path = args.pop();
            index = filter = args.pop();
                                      
            if(!Number.isFinite(index) && !(typeof filter === 'object'))
                throw new Error("TypeError: Expected argument 0 number or object");
            
            break;
                                      
        case 1:
            
            index = path = filter = args.pop();
                                      
            break;
            
    }
                                      
    if(!Number.isFinite(index) || !this.bufferSize) index = undefined;                                  
    if(typeof filter !== 'object' || Array.isArray(filter) || !this.bufferSize) filter = undefined;
    if(typeof path !== 'string') path = undefined;
                                      
    return vrt.store.delete.apply(vrt.store, [this.id, (filter||index), path, callback]);

  };
    
  DataSet.destroy = function() {
                                      
      var stack;
                                      
      if(typeof this.schema === 'object')
        vrt.Api.Route.remove(this.schema);
                                      
      if(stack = vrt.Api.Stack.findParent(this))
          return stack.destroy(this);
  };

  DataSet.required = {
    
    sortKey : Number,
    group : String,
    onCreate : Function,
    onReceive : Function,
    onError : Function,
    type : String,
    id : String,  
    height : String,
    width : String,
    title : String,
    description : String,
    bufferSize : Number,
    options: Object,
    write : Function,
    save : Function,
    format : Object,
    step : Number

  };

  DataSet.collection = {};

  if(module.exports)
    module.exports = DataSet;
  else 
    module.vrt.Api.DataSet = DataSet;

})(typeof module === 'undefined' ? window : module, typeof Guid === 'undefined' ? undefined : Guid);