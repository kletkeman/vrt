/*
    Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

define([
      'default-adapter'
    , 'jquery'
    , 'guid'
    , 'lib/api'
    , 'debug'
], 
function(
      Adapter
    , $
    , Guid
    , vrt
    , debug

) { debug = debug("widget:dataset");
    
  function verify (required) {
        
        var optional, propertyName, requiredProperty, thisProperty, context = this;
        
        for(propertyName in required) {

            optional = propertyName.match(/^(\()(\w+)(\))$/),
            requiredProperty = required[propertyName];

            if(optional) {

                propertyName = optional[2];

                if( typeof this[propertyName] === 'undefined' ) {
                    
                    if(typeof requiredProperty === 'function') {
                        (this[propertyName] = requiredProperty()); continue;
                    }
                    else if (typeof requiredProperty === 'object' && !Array.isArray(requiredProperty) )
                        (this[propertyName] = Object());         
                    
                }
                
            }
            
            if(Array.isArray(requiredProperty)) {
                
                var errors = [];
                
                requiredProperty.forEach(                    
                    
                    function multiple (requiredProperty) {
                        
                        var required = {}; (required[optional ? optional[0] : propertyName] = requiredProperty);
                        
                        try {
                            verify.call(context, required);
                        }
                        catch(err) {
                            errors.push(err);
                        }
                    
                    }
                );
                
                if(errors.length === requiredProperty.length)
                    throw errors;
                
                continue;
            }
                        
            thisProperty = this[propertyName];
            
            (function (requiredProperty) {

                if( ( (typeof thisProperty === 'undefined') || thisProperty.constructor.name !== requiredProperty.name) && !(thisProperty instanceof requiredProperty) )
                    throw new Error(typeof thisProperty !== 'undefined' ?
                        'Propery `' + propertyName + '` has wrong type. Type is [' + (typeof thisProperty).capitalize() + '], should be [' + requiredProperty.name + ']' :
                            'Missing property `' + propertyName + '` [' + requiredProperty.name + ']');
                
            }).call(this, typeof requiredProperty === 'object' ? Object : requiredProperty);
            
            if(typeof requiredProperty === 'object')
                verify.call(thisProperty, requiredProperty);

        }
  };

  function DataSet (fields) {
    
    if(Guid && typeof Guid.create === 'function') {
          this.id = Guid.create().toString();
          fields.id = fields.id || this.id;
	}
      
    this.toBSON = this.toJSON;
          
    if(typeof fields !== 'object')
      throw new Error('TypeError: Missing argument');    
    
    $.extend(this, fields);
      
    this.fromJSON();

    if(typeof this.onCreate === 'function')
        this.onCreate(DataSet);
    
    // Required properties for all Datasets
    var required = {};
    $.extend(required, arguments.callee.required, arguments.callee.caller.required);

    this.type = this.constructor.name.toLowerCase();
      
    this.data = new Adapter();
    
    // Check if required properties exists and has the correct type
    verify.call(this, required);

    if(!Guid.isGuid(this.id))
      throw new Error('Property `id` [String] is not a valid UUID');
            
  };

  DataSet.prototype.set = function(name, value) {
          
    if(typeof name !== 'string' || typeof value === 'undefined')
      throw new Error('Invalid argument(s): Must provide a name (string) and a value.');
    else if(typeof this[name] === 'undefined')
      throw new Error('Property "'+name+'" does not exist');
    else if(['id', 'group', 'sortkey'].indexOf(name) > -1)
      throw new Error('Cannot set property "'+name+'" ILLEGAL');
      
    if(typeof this[name] === 'function' && typeof value === 'object') {
        
        for(var k in this[name]) {
            delete this[name][k];
        }
        
        return $.extend(this[name], value);
    }

    return (this[name] = value);
    
  };

  DataSet.prototype.save = function() {
    return vrt.save.apply(vrt, [this.id].concat(Array.prototype.slice.call(arguments)));
  };

  DataSet.prototype.verify = function(data) {
    return verify.call(data, this.format);
  };

  DataSet.prototype.toJSON = function() {
      
	'use strict';
      
	var context = this, stack = [], that = $.extend(true, {}, this);
	
	delete that.toJSON;
    delete that.format;
    delete that.data;
      
    that.bufferSize = that.bufferSize === Infinity ? -1 : that.bufferSize;
    
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

    return that;

  };

  DataSet.prototype.fromJSON = function () {
    
    'use strict';
      
    var context = this, 
        stack = [], id = this.id, 
        filename = this._filename || null;
      
    this.bufferSize = this.bufferSize < 0 ? Infinity : this.bufferSize;

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
                    else if(!vrt.browser)
                        that[key] = eval.call(that, (prev = that[key]));
                    
                    if(typeof that[key] === 'undefined')
                        throw new Error(["json.walk", id, filename, path, "#eval() returned undefined", "[",prev,"]"].join(' '));
                    else if(depth <= 2 && ( (type = typeof that[key]) === 'object' || (type = typeof that[key]) === 'function') )
                        debug(["json.walk", id, filename, path, "[type of", (that[key] = prev), "cannot be", type, "]", depth].join(' '));
                    else
                        debug(["json.walk", id, filename, path, "was evaluated [Result:", prev, "=>", that[key], "]", depth].join(' '));
                }
                catch(e) {
                               
                    if(typeof that[key] === 'undefined')
                        throw e;
                               
                    debug(["json.walk", id, filename, path, "evaluation error while running #eval()", "[",prev,"]", e, depth].join(' '));
                }
    
              }
            
        }
        
        stack.pop();
        
        return that;
    };

    return walk(this);

  };
                               
  DataSet.prototype.onCreate = 
  DataSet.prototype.onError  =
  DataSet.prototype.onDestroy = 
  function () {};
    
                                      
  // Properties in parantheses are optional

  DataSet.required = {
    
    'sortKey'         : Number,
    'group'           : String,
    'onDestroy'       : Function,
    'onCreate'        : Function,
    'onError'         : Function,
    'type'            : String,
    'id'              : String,  
    'height'          : [String, Number],
    'width'           : [String, Number],
    'title'           : String,
    '(description)'   : String,
    '(options)'       : Object,
    '(background)'    : String,
    'save'            : Function,
    'format'          : Object,
    '(margin)'        : {
        '(top)'   : [String, Number],
        '(bottom)': [String, Number],
        '(left)'  : [String, Number],
        '(right)' : [String, Number]             
    }
  };

  return DataSet;

});
