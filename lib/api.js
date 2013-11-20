;!(function(module, require, undefined) {
  
	String.prototype.capitalize = function() {
		return this.substr(0,1).toUpperCase()+this.substr(1);
  };
	
  var types = {}, stores = {}, Guid;

  if(require)
  {

    types = require('./types');
	
	$.extend(stores, {
		MemoryStore : require('./stores/memorystore'),
		MongoStore : require('./stores/mongostore')
	});
   		
	$.extend(types, {
		Queue : require("./queue")
	});
	
	Guid = require("guid");
	
  }
  else 
  {
	
	$.extend(stores, {
		ClientStore : ClientStore
	});
	
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
		this.write = write;
		
		this.pathregexp = pathRegexp(path
		    , this.keys = []
		    , options.sensitive
		    , options.strict);
		this.valuekey_ref_regexp = /^(\w+)\[(\w+)\]$/gi,
		this.data_ref_regexp = /^\{((\w+)|((\w+)\[(\w+)\]))\}$/gi;
	 
		Route.routes.push(this);
	};
	
	Route.routes = [];
	Route.tree = {
		delete : function(path) {
			
			path = path.split(".");
	
			for(var i = 0, len = path.length, tree = this, name; i < len; i++) {
			
				name = path[i];
			
				if(i === len - 1)
					delete tree[name];
				
				tree = tree[name];
			}
			
			
		}
	};
	
	Route.router = function(path_, data) {
		
		if(Guid && Guid.isGuid(path_))
			return 0;
			
		for(var metric in data) {
			
			var path = path_ + "." + metric;
			
			for(var i = 0, len = Route.routes.length, m = 0; i < len; i++) {
				m += Route.routes[i].dispatch(path, data[metric]);
			}
		
			path = path.split(".");
	
			for(var i = 0, len = path.length, tree = Route.tree, name; i < len; i++) {
			
				name = path[i];
				tree[name] = tree[name] || {};
			
				if(i === len - 1)
					$.extend(true, tree[name], data[metric]);
				
				tree = tree[name];
			}
			
		}
		
		return m;
	};
	
	Route.prototype.remove = function() {
		
		var routes = Route.routes, i = 0, len = routes.length, route;
		
		while(len && i++ < len) {
			
			route = routes.shift();
			
			if(route && route !== this)
				routes.push(route);
			else
				i--;
		}
	};
	
	Route.prototype.dispatch = function(path, data) {
		
		if(this.match(path)) {
			
			if(!this.pack(data))
				return 0;
				
			this.write(this.payload);
			
			return 1;
		}
			
		return 0;
	};

	Route.prototype.match = function(path) {
	
	  this.pathregexp.compile(this.pathregexp);
	
	  var keys = this.keys
	    , params = this.params = []
	    , m = this.pathregexp.exec(path);

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
	
	Route.prototype.replace = function (s) {
		
		var context = this;
		
		return s.replace(/(\[\w+\])/gi, function(part) {
			return context.params[part.substr(1, part.length - 2)] || part;
		});
	};
	
	Route.prototype.prepare = function(key, value) {
		
		key = this.replace(key);
		value = this.replace(value);
		
		this.data_ref_regexp.compile(this.data_ref_regexp); // Bug - RegEx returns false even if match after it has been used in the if statement above
		this.valuekey_ref_regexp.compile(this.valuekey_ref_regexp);
		
		var dr_key      = this.data_ref_regexp.exec(key),
			vk_value    = this.valuekey_ref_regexp.exec(value);
			
		this.valuekey_ref_regexp.compile(this.valuekey_ref_regexp);
		
		var vk_dr_key   = this.valuekey_ref_regexp.exec(dr_key = dr_key ? dr_key[1] : null),
			payload     = this.payload,
			data        = this.data, vindex, kindex, fallback = function(d){return d;};

			
		(vindex = vk_value ? vk_value[2] : null) && (vk_value = vk_value[1]);
		(kindex = vk_dr_key ? vk_dr_key[2] : null) && (vk_dr_key = vk_dr_key[1]);
		
		if( dr_key )
		{
			if( vk_dr_key ) 
			{
				if( vk_value)
				{
					payload[vk_value][vindex] = (this.format[vk_value] === Object || 
													this.format[vk_value] === Array ? 
														fallback : this.format[vk_value])(data[vk_dr_key][kindex]);
				}
				else
				{
					payload[value] = this.format[value](data[vk_dr_key][kindex]);
				}
			}
			else 
			{
				if( vk_value )
				{
					payload[vk_value][vindex] = (this.format[vk_value] === Object || 
													this.format[vk_value] === Array ? 
														fallback : this.format[vk_value])(data[dr_key]);
				}
				else
				{
					payload[value] = this.format[value](data[dr_key]);
				}
			}
			
		}
		else
		{	
			
			if( vk_value )
			{
				payload[vk_value][vindex] = (this.format[vk_value] === Object || 
												this.format[vk_value] === Array ? 
													fallback : this.format[vk_value])(key);
			}
			else 
			{
				payload[value] = this.format[value](key);
			}
		}
	};
	
	Route.prototype.pack = function(data) {
		
		this.payload = $.extend({}, this.format), this.data = data;
		
		for(var key in this.payload)
		{
			if(typeof this.payload[key] === 'function')
				this.payload[key] = this.payload[key]();
		};

		for(var name in this.bind) {
			
			if(typeof this.bind[name] === 'string')
			{
				this.prepare(name, this.bind[name]);
			}
			else if(typeof this.bind[name] === 'object')
			{
				
				if(!(function(context) {
					
					var match = 0;
					
					for(var filter in context.bind[name])
					{
						context.data_ref_regexp.compile(context.data_ref_regexp); // Bug - RegEx returns false even if match after it has been used in the if statement above
						
						if(typeof context.bind[name][filter] === 'object' && context.data_ref_regexp.test(filter))
						{
							for(var key in context.bind[name][filter])
							{
								if(context.replace(name) === key)
									(++match) && context.prepare(filter, context.bind[name][filter][key]);
							}

						}
						else if(typeof context.bind[name][filter] === 'string')
						{
							if(filter === name && typeof context.bind[name][filter] === 'string')
								context.prepare(filter, context.bind[name][filter]);
							else if(context.replace(name) === filter)
								(++match) && context.prepare(name, context.bind[name][filter]);
						}
					 
					}
					
					return match;
					
				})(this))
					return false;
			}
		}
		
		return true;
				
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
	
	var schema = widget.schema, routes = [], context = this;
		
	for(var path in schema) {
		
		var config = schema[path];
		
		if(typeof config.bind !== 'object')
			throw new Error("TypeError: Missing property \"bind\"");
			
		routes.push(new Route( path, config.bind, $.extend({}, widget.format, config.defaults), widget.write.bind(widget) ));
		
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
   * @param {Function,[Boolean]} callback
   *
   * If callback is set to false do not call store.create()
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
	
	if(typeof callback === 'boolean')
    	return obj;

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

	if(!path || path === '*') return Route.tree;

	path = path.split(".");

	for(var i = 0, len = path.length, tree = Route.tree, name; i < len; i++) {

		name = path[i];

		tree = tree[name];

		if(i === len - 1)
			return tree;
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

      return context.store.save(obj, callback);

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

    var dataset = vrt.Api.DataSet.collection[id],
        err, routed;

        eNotify = function(err) {
	
          var args = Array.prototype.slice.call(arguments);

          if(err instanceof Error) {
            console.error(arguments);
            console.error(err.stack);
          }

          if(typeof callback === 'function')
            callback.apply(this, args);
        };

    if(typeof dataset === 'undefined')
	{
	  
	  	try {
			routed = Route.router(id, data);
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
	else if(!routed)
		this.push(id, data, callback);
	else if(typeof callback === 'function')
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