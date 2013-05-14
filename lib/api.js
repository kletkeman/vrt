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

        Object.extend(required, types.DataSet.required);
        Object.extend(required, types[typename].required);
        
        console.log(types);
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
    Object.extend(this, options);
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
    return this.store.publish.apply(this, arguments);
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
    return this.store.receive.apply(this, arguments);
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
    return this.store.list.apply(this, arguments);
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
    return this.store.get.apply(this, arguments);
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
   * @param {} data
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
   * @param {} data
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
   * Save object parameters 
   *
   * @param {String} id
   * @param {Object} instance
   * @param {Function} callback
   *
   * @api public
   */

  Api.prototype.save = function (id, instance, callback) {
    return this.store.save.apply(this, arguments);
  };

  /**
   * Reload all saved objects
   *
   * @param {Function} callback
   *
   * @api public
   */

  Api.prototype.reload = function (callback) {
    return this.store.reload.apply(this, arguments);
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

    var dataset = types.DataSet.collection[id],
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

  Object.extend(Api, stores);
  Object.extend(Api, types);

  if(module.exports) {
    module.exports = new Api();
    module.exports.Api = Api;
  }
  else {
    module.vrt = new Api({store: new Api.ClientStore()});
    module.vrt.Api = Api;
  }

})(typeof module === 'undefined' ? window : module, typeof require === 'undefined' ? undefined : require);