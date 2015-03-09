/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

define([
    'jquery'
    , 'guid'
    , 'loglevel'
    , 'socket.io'
    , 'debug'
], 
function(
       $
    , Guid
    , log
    , io
    , debug
    
) { debug = debug("api");
   
      var url          = "http://localhost:23485";
      const namespace  = '/api/v1';
  
      String.prototype.capitalize = function() {
            return this.substr(0,1).toUpperCase()+this.substr(1);
      };
   
      Number.isFinite = Number.isFinite || function (n) {
            return typeof n === 'number' && n !== NaN;
      };

      /**
       * Publish changes
       *
       * @param {String} id
       * @param {String} name
       * @param {Array} args
       * @param {Function} callback
       *
       * @api private
       */

      function publish (id, name, args) {
          
          args = args || [];
          
          if(this.browser) {
              
              this.get(id, function (err, obj) {
                  if(err) throw err;
                  obj.constructor.events[name].apply(obj, args);
              })
              
          }
          else if(this.io)
              this.io.nsps[namespace].emit("event", Array.prototype.slice.call(arguments));
      }
   
     /**
       * Connect the websocket(s)
       * @api private
       */
   
      function connect () {
          
          var context = this;
          
          if(this.browser) {
              
              this.ready(1);

              io(this.url(namespace)).off().on('event', function(args) {
                return publish.apply(context, args);
              }).once("connect", function () { 
                  return context.ready(-1); 
              }).on("connect_timeout", function () {
                  return context.ready(-1); 
              }).connect();
          }
          else if(this.io)
              return this.io.of(namespace);

      }

      /**
       * Api constructor.
       *
       * @api public
       */

      function Api (options) {

          var context = this;

          Object.defineProperties(this, {
              log : {
                configurable : false,
                value : log
              },
              collection : {
                configurable : false,
                value :  {}
              },
              groups : {
                configurable : false,
                value : {}
              },
              __readyQueue: {
                  value: []
              },
              __readyState: {
                  writable: true,
                  value: 0
              }
          
          });
          
          this.configure(options);
          
      };
   
      Api.prototype.toJSON = 
      Api.prototype.toBSON =
      function () {
          return this;
      }
          
    
      Api.prototype.dump = function () {}

      Api.prototype.ready = function (callback) {
        
          var queue = this.__readyQueue, state = this.__readyState;
          
          if(queue.indexOf(callback) >= 0)
              return this;
          
          if(typeof callback === 'function') 
              queue.push(callback);
          else if(typeof callback === 'number') 
              this.__readyState = state += callback;
          else
              return !state;
        
          if(state < 0) throw "readyState less than 0";
              
          debug(state ? "waiting, counting down" : "ready now, will fire callbacks now", 
                state ? state : queue.length);
          
          while(!state && queue.length) {
              queue.shift().call(this);
          }
          
          return this;
      }
    
      /**
       * Get type
       *
       * @api public
       */

      Api.prototype.type = function type (name) {
        
        var context = this, 
            constructor = ((name = String(name).toLowerCase()), type[name]);
          
        if( ! (name in type) ) {
                        
            context.ready(1);
            
            this.store.typeNames(function (err, types) {
            
                require(types.map(function(typename) {
                    type[typename] = type[typename] || undefined;
                    return 'types/'+typename;
                }), 
                function () {

                  var types = Array.prototype.slice.call(arguments);

                  while(types.length && (constructor = types.pop()))
                    (type[constructor.name.toLowerCase()] = constructor);

                  context.ready(-1);

                });
                
            });
            
        }

        return constructor;
          
      }

       /**
       * Configure the vrt
       *
       * @param {Object} options
       *
       * @api public
       */

      Api.prototype.configure = function(options) {
          
          var context = this;
          
          return $.extend(this, options),
              
            (this.store && this.type()), this.ready(function () {
            
                if( ! (typeof chrome === "object" && chrome.storage) )
                    return connect();

                chrome.storage.local.get("url", function (items) {
                    
                    if(items.url) {
                        url = items.url;
                        connect();
                    }

                });
            
        }), this;
      }

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

          function create (err, fields, callback) {

                var constructor = context.type(fields.type);
                
                if(!err) {
                  if(typeof fields !== 'object')
                    err = new Error('TypeError: Missing argument');
                  else if( typeof fields.type !== 'string' )
                    err = new Error('TypeError: Missing property ´type´ [String]');
                }

                if(err) {
                  if(typeof callback === 'function') return callback(err);
                  throw err;
                }


                if( constructor === undefined )
                  throw new Error('TypeError: Invalid type `'+fields.type+'`');

                if (obj = context.collection[fields.id])
                    err = new Error('id : "' + fields.id + '" is not unique within the current context');
                else {
                    
                    (obj = (new constructor(fields))) && (context.collection[obj.id] = obj);

                    (function (name) {
                        (context.groups[name] = context.groups[name]) || ((context.groups[name] = []).destroy = destroy_group.bind(context, name));
                        (context.groups[name].indexOf(obj) > -1) || context.groups[name].push(obj);
                    })(obj.group);

                    publish.call(this, null, "create", [obj]);
                    
                }
        
                return (typeof callback === 'function' && callback.call(context, err, obj)), obj;

          };
          
          if(callback === false)
            return create(undefined, fields);

          return this.type(fields.type), this.ready(function () {
              return create(undefined, fields, function (err, obj) {
                  if(err) {
                      if(typeof callback === 'function') return callback.call(context, err);
                      throw err;
                  }
                  return context.store.create(fields, function (err) {
                      return callback(err, obj);
                  });
              });            
          });
          
      }
    
      function destroy_group (name) {
          
          var context = this;
          
          $.each(this.collection, function (id, obj) {
            if(obj.group === name)
                context.destroy(id);
          });
          
          delete this.groups[name];
      }

       /**
         * Deletes the object
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
               
               var last, group, temp;
               
               if(err) {
                   if(typeof callback === 'function') return callback.call(context, err);
                   throw err;
               }
               
               delete context.collection[id];
               
               group = context.groups[obj.group];
               
               last = group[group.length - 1];
               
               while(temp = group.shift()) {                   
                   if(temp !== obj) group.push(temp);
                   if(temp === last) break;
               }
               
               if(!group.length) group.destroy();

               return (callback === false || context.store.destroy(id, callback)), publish.call(this, obj.id, "destroy");
           
           });


       }

       /**
       *
       * Get url prefix for HTTP API calls
       * 
       * @param {String} url
       *
       * @api public
       */

      Api.prototype.url = function (path) {
        return url + path;
      }

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
      }

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
                        callback.call(context, null, context.collection[id]) : 
                            this.store.get(id, function(err, fields) {
                                if(err) return callback.call(context, err);
                                return context.type(fields.type), context.ready(function () {
                                  callback.call(context, null, context.create(fields, false));
                                });
                            });
      }

      /*
       * Data Adapter plugs in here 
       */

      Api.prototype.data = null;

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
                return callback.call(context, err);
            throw err;
          }
          else if(typeof parameters === 'object') {
            for(var name in parameters) {
                try {
                  obj.set(name, parameters[name]);
                }
                catch(e) {
                    context.log.error(e);
                }
            }
            if(callback!==false && !context.browser)
               publish.call(context, obj.id, "save", [parameters]);
          }
          else if (callback!==false && !context.browser)
            publish.call(context, obj.id, "save", [obj]);

          return callback!==false?context.store.save(obj, callback):obj;

        });

      }

      return new Api();
    
});
