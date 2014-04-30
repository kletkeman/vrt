;!(function(module, require, undefined) {
  
	String.prototype.capitalize = function() {
		return this.substr(0,1).toUpperCase()+this.substr(1);
  };
	
  var types = {}, stores = {}, Guid, dir;

  if(require)
  {
	
	Guid = require("guid");		
	log = require("loglevel");
      
    require("./producer")(Api);
    require("./consumer")(Api);
    require("./route")(Api);
    require("./ipc")(Api);
      
    types = require('./types');
	
    require("fs").readdirSync(dir = __dirname + '/stores/')
        .filter(function(path) {
			return path.indexOf('clientstore.js') === -1;
		})
        .forEach(function(f) {
            $.extend(stores, require(dir + f));
        });
   		
	$.extend(types, {
		Queue : require("./queue")
	});

  }
  else 
  {
	
	$.extend(stores, {
		ClientStore : ClientStore
	});
	
  }
  
  /**
   * Api constructor.
   *
   * @api public
   */

  function Api(options) {
      this.configure(options);
      if(!this.store) 
          this.store = new Api.MemoryStore();
  };

  Api.prototype.route = function(widget) {
	
	if(!(widget instanceof Api.DataSet))
		throw new Error("TypeError: Widget required");
	else if(typeof widget.schema !== "object")
		throw new Error("TypeError: Missing schema");
	
	var schema = widget.schema, routes = [], context = this;
		
	for(var path in schema) {
		
		var config = schema[path];
		
		if(typeof config.bind !== 'object')
			throw new Error("TypeError: Missing property \"bind\"");
			
		routes.push(new Api.Route( path, config.bind, $.extend({}, widget.format, config.defaults), widget ));
		
	}
	
	Object.defineProperty(widget, "schema", {
  		enumerable: true,
  		configurable: true,
  		get: function() {
  			return schema;
  		},
		set : function(value) {
			
			var old = schema;
			
			schema = value;
			
			try {
				context.route(widget);
			}
			catch(err) {
				schema = old;
				throw err;	
			}
			
			while(routes.length)
				routes.pop().remove();
		}
	});
	
	return Api.Route.routes.length;
	
  };

  /**
   * List available types
   *
   * @api public
   */

  Api.prototype.available = function () {

    var results = {};

    for(var typename in types) {

      if(typename !== 'DataSet') {

        var required = {};

        $.extend(required, types.DataSet.required);
        $.extend(required, types[typename].required);
        
        for( var propname in required ) {

          if( required[propname] !== Function )
            required[propname] = required[propname].name;

        }

        results[typename] = required;

      }

    }

    return results;

  };
    
   /**
   * Get type
   *
   * @api public
   */
    
    Api.prototype.type = function(name) {
        
        name = name.toLowerCase();
        
        for(var k in Api) {
            if(typeof Api[k] === 'function' && k.toLowerCase() === name && (Api[k].prototype instanceof Api.DataSet) )
                return Api[k];
        }
    };

   /**
   * Configure the vrt
   *
   * @param {Object} options
   *
   * @api public
   */

  Api.prototype.configure = function(options) {
    $.extend(this, options);
    return this;
  };

  /**
   * Create object
   *
   * @param {Object} fields
   * @param {Function,[Boolean]} callback
   *
   * If callback is set to false do not call store.create()
   *
   * @api public
   */

  Api.prototype.create = function (fields, callback) {
      
      var context = this, obj;
      
      function create (err, fields) {
          
            if(err) throw err;
            else if(!(fields instanceof Object))
              throw new Error('TypeError: Missing argument');
            else if( typeof fields.type !== 'string' )
              throw new Error('TypeError: Missing property ´type´ [String]');

            var constructor = vrt.type(fields.type);

            if( typeof constructor === 'undefined' )
              throw new Error('TypeError: Invalid type `'+fields.type+'`');
            
            obj = vrt.Api.DataSet.collection[fields.id] || (new constructor(fields));            
            
    };
      
    if(this.browser && callback !== false)
        return this.store.create(fields, create);
    else {
        
        create(undefined, fields);
        
        if(!this.browser && obj.schema) this.route(obj);
        
        if(callback === false)
            return obj;
        
        return this.store.create(obj, callback), obj.onCreate();
    }

  };
    
   /**
     * Deletes the object, data and routes
     *
     * @param {String} id
     * @param {Function} callback
     * @return undefined
     * @api public
     *    
     */
    
   Api.prototype.destroy = function (id, callback) {
       
       var context = this;
       
       return this.get(id, function(err, obj) {
           
           if(err) {
               if(typeof callback === 'function') return callback(err);
               throw err;
           }
           
           obj.destroy();
        
           return context.store.destroy(id, callback);
       });
       
       
   };
    
    /**
     * Deletes data from the object
     *
     * @param {String} id
     * @param {Function} callback
     * @return undefined
     * @api public
     *    
     */
    
   Api.prototype.delete = function (id, filter_index, path, callback) {
       
       var context = this;
       
       return this.get(id, function(err, obj) {
         
         if(err) {
            if(typeof callback === 'function') return callback(err);
            throw err;
         }
           
         return obj.delete.apply(obj, (filter_index !== undefined ? [filter_index] : []).concat(path ? [path] : []).concat([
             function(err, info) {
                 
                 if(err) {
                    if(typeof callback === 'function') return callback(err);
                    throw err;
                 }
                  
                 return (typeof callback === 'function' ? callback(undefined, info) : undefined), ( context.browser || (obj.onDelete(info), context.store.save(obj, vrt.log.error) ) );
                 
         }]) );
         
     });
   };

   /**
   * Publish data to client
   * Implement on the server, not used in the browser.
   *
   * @param {String} id
   * @param {String} eventHandlerName
   * @param {Array} args 
   * @param {Function} callback
   *
   * @api public
   */

  Api.prototype.publish  = function (id, eventHandlerName, args, callback) {
    return this.store.publish.apply(this.store, arguments);
  };

  /**
   * Receive data from server
   * Implement in browser, not used on the server.
   *
   * @param {String} id
   * @param {String} eventHandlerName
   * @param {Object} data
   *
   * @api public
   */

  Api.prototype.receive  = function (id, eventHandlerName, data) {
    return this.store.receive.apply(this.store, arguments);
  };

   /**
   * List object ids
   * Optional first parameter with properties to match with object and filter results.
   *
   * @param {Object} properties
   * @param {Function} callback
   *
   * @api public
   */

  Api.prototype.list = function () {
    return this.store.list.apply(this.store, arguments);
  };

  /**
   * Get route tree
   *
   * @param {String} path
   * @param {Function} callback
   *
   * @api public
   */

  Api.prototype.tree = function (path, callback) {
	return this.store.tree.get.apply(this.store.tree, arguments);
  };

  /**
   * Get an object
   *
   * @param {String} id
   * @param {Function} callback
   *
   * @api public
   */

  Api.prototype.get = function (id, callback) {
  	
  	var context = this;

  	if(typeof callback === 'function')
	    return vrt.Api.DataSet.collection[id] ?
	    			callback(null, vrt.Api.DataSet.collection[id]) : 
	    				this.store.get(id, function(err, fields) {
	    					if(err) return callback(err);
						    return callback(null, context.create(fields, false));
	    				});
  };

    /**
   * Get object data
   *
   * @param {String} id
   * @param {Function, [Stream]} callback
   *
   * @api public
   */

  Api.prototype.data = function (id, callback) {
    return this.store.data.apply(this.store, arguments);
  };

  /**
   * Adds data to the datastore
   */

  /**
   * Push multidimensional data on Y axis at position x on X axis
   *
   * @usage: push(x)(id, data, callback)
   *
   * @param {Number} x
   * @param {String} id
   * @param {ObjectObject} data
   * @param {Function} callback
   *
   * @api public
   */

  /**
   * Write multidimensional data at position x,y
   *
   * @usage: push(x)(y)(id, data, callback)
   *
   * @param {Number} x
   * @param {Number} y
   * @param {String} id
   * @param {Object} data
   * @param {Function} callback
   *
   * @api public
   */

  Api.prototype.push = function () {

    var args     = Array.prototype.slice.call(arguments),
        x        = args[0], 
        id       = args[0], 
        data     = args[1], 
        callback = args[2],
        context  = this;

    if(typeof x === 'number' && args.length === 1)
      return function()  {

        var args     = Array.prototype.slice.call(arguments),
            y        = args[0],
            id       = args[0], 
            data     = args[1], 
            callback = args[2];

        if(typeof y === 'number' && args.length === 1)
          return function(id, data, callback) {
            return context.store.push.apply(context.store, [x, y, id, data, callback]);
          };

        return context.store.push.apply(context.store, [x, undefined, id, data, callback]);

      };
    

    return this.store.push.apply(this.store, [undefined, undefined, id, data, callback]);

  };

   /**
   *
   *
   * Save object
   *
   * @usage: save(id, callback)
   *
   * @param {String} id
   * @param {Function} callback
   *
   *
   * Update parameters and Save
   *
   *
   * @usage: save(id, parameters, callback)
   *
   * @param {String} id
   * @param {Object} parameters
   * @param {Function} callback
   *
   * if callback === false save will not be written to disk or forwarded to client and other processes etc
   *
   * @api public
   *
   *
   */

  Api.prototype.save = function () {

    var args = Array.prototype.slice.call(arguments),
        context = this,
        id = args[0],
        parameters = typeof args[1] === 'object' ? args[1] : undefined, 
        callback = typeof args[1] === 'function' ? args[1] : args[2];

    if(typeof id !== 'string')
      throw new Error('TypeError: Missing first parameter or it has wrong type');

    return context.get(id, function(err, obj) {

      if(err) {
        if(typeof callback === 'function')
            return callback(err);
        throw err;
      }
      else if(typeof parameters === 'object') {
        for(var name in obj.fromJSON.call(parameters)) {
            try {
              obj.set(name, parameters[name]);
            }
            catch(e) {
                vrt.log.error(e);
            }
        }
        if(callback!==false && !context.browser)
            obj.onSave.apply(obj, Object.keys(parameters));
      }
      else if (callback!==false && !context.browser)
        obj.onSave();

      return callback!==false?context.store.save(obj, callback):obj;

    });
    
  };

  /**
   * Write data to an object
   *
   * @param {String} id
   * @param {Object} data
   * @param {Function} callback
   *
   * @api public
   */

  Api.prototype.write = function(id, data, callback) {
      
    var context  = this;

  	if(Guid && !Guid.isGuid(id)) {
  		
        this.store.tree.write(id, data, function(err) {
            
            if(err) {
		      if(typeof callback === 'function')
		      	return callback(err);
		      throw err;
		    }
            
             context.store.tree.get(id, function(err, tree) {
                
                if(err) {
                  if(typeof callback === 'function')
                    return callback(err);
                  throw err;
                }
                 
                tree._timestamp = new Date();
                                           
                Api.Route.router( id, data, tree );
                 
                context.store.tree.write(id, tree, callback);
                
            });
            
        });
  	}
  	else
	    return this.get(id, function(err, dataset) {
		    
		    if(err) {
		      if(typeof callback === 'function')
		      	return callback(err);
		      throw err;
		    }

		    return dataset.write(data, callback);

		});
		
    
  };


  $.extend(Api, stores);
  $.extend(Api, types);

  if(module.exports) {
    module.exports = new Api({
        Api: Api,
        log: log
    });      
  }
  else {
    module.vrt = new Api({
    	store: new Api.ClientStore(), 
    	controls: new ViewController(),
        Api: Api,
        log: log,
        browser: true
    });

  }

})(typeof module === 'undefined' ? window : module, typeof require === 'undefined' ? undefined : require);