;!(function(module, require, undefined) {

  var types = {}, stores = {};

  if(require) {

    types = require('./types');

    stores.MemoryStore = require('./stores/memorystore');
    stores.RedisStore = require('./stores/redisstore');

  }
  else {

    stores.ClientStore = ClientStore;
    
  }

  
	function pathRegexp(path, keys, sensitive, strict) {
		
	  if ({}.toString.call(path) == '[object RegExp]') return path;
	  if (Array.isArray(path)) path = '(' + path.join('|') + ')';
	
	  path = path
	    .concat(strict ? '' : '/?')
	    .replace(/\/\(/g, '(?:/')
	    .replace(/(\/)?(\.)?\[(\w+)\](?:(\(.*?\)))?(\?)?(\*)?/g, 
			
			function(_, dot, format, key, capture, optional, star) {
				
	      		keys.push({ name: key, optional: !! optional });
			    dot = dot || '';
			    
				return ''
			        + (optional ? '' : dot)
			        + '(?:'
			        + (optional ? dot : '')
			        + (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')'
			        + (optional || '')
			        + (star ? '(/*)?' : '');
			
	    })
	    .replace(/([\/.])/g, '\\$1')
	    .replace(/\*/g, '(.*)');
	
	  return new RegExp('^' + path + '$', sensitive ? '' : 'i');
	
	};

	function Route(path, bind, format, write, options) {
		
	 	 options = options || {};
		  this.path = path;
		  this.bind = bind;
		  this.format = format;
		  this.regexp = pathRegexp(path
		    , this.keys = []
		    , options.sensitive
		    , options.strict);
		  this.write = write;
	 
		Route.routes.push(this);
	};
	
	Route.routes = [];
	Route.tree = {};
	
	Route.route = function(path_, data) {
		
		for(var metric in data) {
			
			var path = path_ + "." + metric;
			
			for(var i = 0, len = Route.routes.length, route, m = 0; i < len; i++) {
			
				route = Route.routes[i];
				
				if(route.match(path))
					++m && route.write(route.payload(path, data[metric]));
			}
		
			path = path.split(".");
	
			for(var i = 0, len = path.length, tree = Route.tree, name; i < len; i++) {
			
				name = path[i];
				tree[name] = tree[name] || {};
			
				if(i === len - 1)
					tree[name] = data[metric];
				
				tree = tree[name];
			}
			
		}
		
		return m;
	};

	Route.prototype.match = function(path) {
		
	  var keys = this.keys
	    , params = this.params = []
	    , m = this.regexp.exec(path);

	  if (!m) return false;

	  for (var i = 1, len = m.length; i < len; ++i) {
		
	    var key = keys[i - 1];
	    var val = 'string' == typeof m[i]
	      ? decodeURIComponent(m[i])
	      : m[i];

	    if (key) {
	      params[key.name] = val;
	    } else {
	      params.push(val);
	    }
	  }

	  return true;
	};
	
	Route.prototype.payload = function(path, value) {
		
		var keys = this.keys.map(function(k){return k.name;}),
			payload = $.extend({}, this.format), bind = this.bind, context = this,
			plkey_regex = /^(\w+)\[(\w+)\]$/gi, m;
		
		for(var key in payload) {
			if(typeof payload[key] === 'function')
				payload[key] = payload[key]();
		};
			
		for(var component in bind) {
				
			if(keys.indexOf(component) === keys.length - 1) {
					
				if(typeof bind[component] === 'object') {
						
					for(var metric in bind[component]) {
								
						if(metric === component && typeof bind[component][metric] === 'string') {
							payload[bind[component][metric]] = this.format[bind[component][metric]](this.params[metric]);
							continue;
						}
						else if( this.params[component] !== metric )
							continue;
									
						if(m = plkey_regex.exec(bind[component][metric]))
							payload[ m[1] ][ m[2] ] = value;
						else if (typeof bind[component][metric] === 'string')
							payload[bind[component][metric]] = this.format[bind[component][metric]](value);
					}
					
				}
				else if(typeof bind[component] === 'string')
					payload[bind[component]] = this.format[bind[component]](value);
				
			}
			else if(typeof bind[component] === 'string')
				payload[bind[component]] = this.format[bind[component]](
					component.replace(new RegExp(keys.join("|"), "gi"), function(part) {
						return context.params[part] || part;
				}));
				
		}
			
		return payload;
		
};
  
  /**
   * Api constructor.
   *
   * @api public
   */

  function Api(options) {
      this.configure(options);
  };

  Api.prototype.route = function(widget) {
	
	if(!(widget instanceof Api.DataSet))
		throw new Error("TypeError: Widget required");
	else if(typeof widget.schema !== "object")
		throw new Error("TypeError: Missing schema");
	
	var schema = widget.schema;
		
	for(var path in schema) {
		
		var config = schema[path];
		
		if(typeof config.bind !== 'object')
			throw new Error("TypeError: Missing property \"bind\"");
			
		new Route( path, config.bind, $.extend($.extend({}, widget.format), config.defaults), widget.write.bind(widget) );
		
	}
	
	return Route.routes.length;
	
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
   * Configure the vrt
   *
   * @param {Object} options
   *
   * @api public
   */

  Api.prototype.configure = function(options) {
    $.extend(this, options);
  };

  /**
   * Create object
   *
   * @param {Object} fields
   * @param {Function} callback
   *
   * @api public
   */

  Api.prototype.create = function (fields, callback) {

    if(!(fields instanceof Object))
      throw new Error('TypeError: Missing argument');
    else if( typeof fields.type !== 'string' )
      throw new Error('TypeError: Missing property ´type´ [String]');
    
    fields.type = fields.type.capitalize();

    if( typeof types[fields.type] === 'undefined' )
      throw new Error('TypeError: Invalid type `'+fields.type+'`');
    
	var obj = new types[fields.type](fields);
	
	if(obj.schema) this.route(obj);
	
    return this.store.create(obj, callback);

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
   *
   * @api public
   */

  Api.prototype.tree = function (path) {
	
	if(!path) return Route.tree;
	
	path = path.split(".");
	
	for(var i = 0, len = path.length, tree = Route.tree, name; i < len; i++) {
		
		name = path[i];
		
		if(i === len - 1)
			return tree;
		
		tree = tree[name];
	}
	
    return {};
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
    return this.store.get.apply(this.store, arguments);
  };

  /**
   * Select data
   *
   * @param {String} id
   * @param {Object} selector
   * @param {Function} callback
   *
   * @api public
   */

  Api.prototype.select = function (id, selector, callback) {
    return this.store.get(id, function(err, obj) {
	
		if(typeof callback === 'function' && err)
			callback(err);
		else if(obj.bufferSize) {
			
			var data = {};
				
			for(var i=0, len=obj.data.length;i<len;i++) {
				
				var m = true;
				
				for(var name in selector)
					m &= (selector[name] === obj.data[i][name]);
					
				if(m)
					data[i] = obj.data[i];
			}
			
			if(typeof callback === 'function')
				callback(undefined, data);
				
			return data;
		}
		else if(typeof callback === 'function')
			callback(undefined, obj.data);
			
		return obj.data;
	});
  };

  /**
   * Set an objects properties
   *
   * @param {String} id
   * @param {String} name
   * @param {} value
   * @param {Function} callback
   *
   * @api public
   */

  Api.prototype.set = function (id, name, value, callback) {
    var data = {};
    data[name] = value;
    this.save(id, data, callback);
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
            return context.store.push.apply(context, [x, y, id, data, callback]);
          };

        return context.store.push.apply(context, [x, undefined, id, data, callback]);

      };
    

    return this.store.push.apply(this, [undefined, undefined, id, data, callback]);

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

      if(err && typeof callback === 'function')
        return callback(err);
      else if(err) throw err;
      else if(typeof parameters === 'object') {
        for(var name in parameters)
          obj.set(name, parameters[name]);
        obj.onSave.apply(obj, Object.keys(parameters));
      }

      return context.store.save(id, callback);

    });
    
  };

  /**
   * Reload all saved objects
   *
   * @param {Function} callback
   *
   * @api public
   */

  Api.prototype.reload = function (callback) {
    return this.store.reload.apply(this.store, arguments);
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

    var dataset = vrt.Api.DataSet.collection[id],
        err, routed;

        eNotify = function() {
          var args = Array.prototype.slice.call(arguments);
          if(args.length && args[0] instanceof Error) {
            console.error(arguments);
            console.error(args[0]);
            console.trace();
          }
          if(typeof callback === 'function')
            callback.apply(this, args);
        };

    if(typeof dataset === 'undefined') {
	
      err = new Error('Object with id `'+id+'` does not exist in memory.');
	  
	  try {
		if(routed = Route.route(id, data))
			err = null;
	  }
	  catch(e) {
		err = e;
	  }
	}
    
    if(typeof callback === 'function' && err)
      eNotify(err);
    else if(err)
      throw err;
    else if(dataset)
      dataset.write.call(dataset, data, eNotify);
	else if(routed && typeof callback === 'function')
		callback();
		
    
  };


  $.extend(Api, stores);
  $.extend(Api, types);

  if(module.exports) {
    module.exports = new Api();
    module.exports.Api = Api;
  }
  else {
    module.vrt = new Api({store: new Api.ClientStore()});
    module.vrt.Api = Api;
  }

})(typeof module === 'undefined' ? window : module, typeof require === 'undefined' ? undefined : require);