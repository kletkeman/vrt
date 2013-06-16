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
  
  /**
   * Api constructor.
   *
   * @api public
   */

  function Api(options) {
      this.configure(options);
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
    
    return this.store.create(new types[fields.type](fields), callback);

  };

   /**
   * Publish data to client
   * Implement on the server, not used in the browser.
   *
   * @param {String} id
   * @param {String} eventHandlerName
   * @param {Object} data
   * @param {Function} callback
   *
   * @api public
   */

  Api.prototype.publish  = function (id, eventHandlerName, data, callback) {
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
        err,

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

    if(typeof dataset === 'undefined')
      err = new Error('Object with id `'+id+'` does not exist in memory.');
    
    if(typeof callback === 'function' && err)
      eNotify(err);
    else if(err)
      throw err;
    else
      dataset.write.call(dataset, data, eNotify);
    
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