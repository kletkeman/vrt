define(['jquery', 'guid', 'loglevel', 'lib/route'], 
function($, Guid, log, Route) {
  
      String.prototype.capitalize = function() {
            return this.substr(0,1).toUpperCase()+this.substr(1);
      };

      /**
       * Api constructor.
       *
       * @api public
       */

      var ready = [];

      function Api(options) {

          this.configure(options);
          
          this.log        = log;
          this.collection = {};
          this.groups     = {};

      };

      Api.prototype.ready = function(callback) {
        
        if(typeof callback === 'function')
          ready.push(callback);
        else if(!arguments.length) {
          while(ready.length)
            ready.shift().call(this);
        }

        return this;
      };

      /**
       * Route the widget schema
       *
       * @param {Object} widget
       * @return  {Array}
       *
       * @api public
       */

      Api.prototype.route = function(widget) {

        var schema = widget.schema, routes = [], context = this;

        if(this.browser)
            return routes;
        else if(!(widget instanceof this.type('dataset')))
            throw new Error("TypeError: Widget required");
        else if(typeof widget.schema !== "object")
            throw new Error("TypeError: Missing schema");

        for(var path in schema) {

            var config = schema[path];

            if(typeof config.bind !== 'object')
                throw new Error("TypeError: Missing property \"bind\"");

            routes.push(new Route( path, config.bind, $.extend({}, widget.format, config.defaults), widget ));

        }

        return routes;

      };

      /**
       * Get type
       *
       * @api public
       */

      Api.prototype.type = function type (name) {
        
        var context = this, 
            constructor = ((name = String(name).toLowerCase()), type[name]);

        if(!constructor)
            require(this.store.typeNames().map(function(typename) {
              return 'types/'+typename;
            }), 
            function() {
                  
              var types = Array.prototype.slice.call(arguments), constructor;
                  
              while(types.length && (constructor = types.pop()))
                (type[constructor.name.toLowerCase()] = constructor);

              context.ready();

            });

         return (constructor && context.ready()), (type[name] || type);
      };

       /**
       * Configure the vrt
       *
       * @param {Object} options
       *
       * @api public
       */

      Api.prototype.configure = function(options) {
        return $.extend(this, options), (this.store && this.type()), this;
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
                
                var constructor = context.type(fields.type);
                
                if(!err) {
                  if(!(fields instanceof Object))
                    err = new Error('TypeError: Missing argument');
                  else if( typeof fields.type !== 'string' )
                    err = new Error('TypeError: Missing property ´type´ [String]');
                }

                if(err) {
                  if(typeof callback === 'function') return callback(err);
                  throw err;
                }


                if( typeof constructor === 'undefined' )
                  throw new Error('TypeError: Invalid type `'+fields.type+'`');

                (obj = context.collection[fields.id]) ||  (obj = context.collection[fields.id] = (new constructor(fields))); 

                context.groups[obj.group] = context.groups[obj.group] || [];
                context.groups[obj.group].__vrt_hide_group__ |= obj.stacked;
                context.groups[obj.group].push(obj);

                return (!context.browser && obj.onCreate()), (typeof callback === 'function' && callback(obj)),  obj;

          };

          if(callback === false)
            return create(undefined, fields);

          return this.ready(function() {
            context.store.create(fields, create);
          }).type(fields.type);
           

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

               return context.store.destroy(id, callback), (context.browser || (obj && obj.onDestroy()) );
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

                     return (typeof callback === 'function' ? callback(undefined, info) : undefined), ( context.browser || (obj.onDelete(info), context.store.save(obj, context.log.error) ) );

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
            return context.collection[id] ?
                        callback(null, context.collection[id]) : 
                            this.store.get(id, function(err, fields) {
                                if(err) return callback(err);
                                return context.ready(function() {
                                  callback(null, context.create(fields, false));
                                }).type(fields.type);
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
                    context.log.error(e);
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

                    Route.router( id, data, tree );

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
    
      return new Api();
    
});
