define(['jquery', 'guid', 'loglevel', 'socket.io', 'lib/trigger'], 
function($, Guid, log, io, trigger) {
  
      String.prototype.capitalize = function() {
            return this.substr(0,1).toUpperCase()+this.substr(1);
      };

      /**
       * Registers object for send/receive
       *
       * @param {String} id
       * @param {String} eventHandlerName
       * @param {Array} args
       * @return  {undefined}
       *
       * @api private
       */

      function receive (id, eventHandlerName, args) {
        
            var obj;

            switch(eventHandlerName) {
                case 'onCreate':
                    return this.create.apply(this, ((args[1] = false), args));
                case 'onDestroy':
                    return this.destroy(id, false);
                default:
                    return (obj = this.collection[id]) && obj[eventHandlerName].apply(obj, args);
            }
      };

      /**
       * Api constructor.
       *
       * @api public
       */

      var ready = [];

      function Api(options) {

          var context = this;

          this.configure(options);
          
          this.namespace  = '/api/v1';

          this.ready(function () {
            return context.register('create');
          });
          
          Object.defineProperties(this, {
              log : {
                configurable: false,
                value : log
              },
              collection : {
                configurable: false,
                value :  {}
              },
              groups : {
                configurable: false,
                value : {}
              },              
              trigger : {
                configurable: false,
                value : trigger.call(this)
              }
              
          });          
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
       * Registers object for send/receive
       *
       * @param {Object} obj
       * @return  {undefined}
       *
       * @api public
       */
    
      Api.prototype.register = function register (obj, ns) {
          
        var id = "", context = this;
        
        if(typeof obj === 'string')
          ns = obj, obj = undefined;

        ns = ns || "";

        if(obj instanceof this.type("dataset"))
          id = '/' + obj.id;
              
        ns = this.namespace + id + (ns ? '/' + ns : '');

        if(this.browser) {
          id = id.slice(1);
          io(ns).off().on('event', function(args) {
            return args.unshift(id), receive.apply(context, args);
          }).once("connect", function () { return context.ready(); }).connect();
        }
        else if(this.io)
          this.io.nsps[ns] || this.io.of(ns);
          
        return this;

      };
    
      /**
       * Un-registers object for send/receive
       *
       * @param {Object} obj
       * @return  {undefined}
       *
       * @api public
       */
    
      Api.prototype.unregister = function (obj, ns) {

        var id = "", context = this, nsps = [];
        
        function flt (nsp) { return nsp.indexOf(id) > -1; };
        
        if(typeof obj === 'string')
          ns = obj, obj = undefined;

        ns = ns || "";

        if(obj instanceof this.type("dataset")) {
          id = '/' + obj.id;
          nsps.push(this.namespace + id + '/' + ns);
        }
        
        if (!ns && id) {
          
          if(this.browser) {
              for(var k in io.managers) {
                nsps = Object.keys(io.managers[k].nsps).filter(flt); break;
              }
          }
          else if(this.io) {
            nsps = Object.keys(this.io.nsps).filter(flt);
          }

        }
        else if (ns && !id)
          nsps.push(this.namespace + '/' + ns);

        (function (ns) {
            
          var args = Array.prototype.slice.call(arguments);
            
          while(ns = args.pop())
            if(this.browser) {
              
                io(ns).off().disconnect();
                
                for(var k in io.managers) {
                    delete io.managers[k].nsps[ns];
                }
              
            }
            else if(this.io) {
                
              (ns = this.io.nsps[ns]);
              (ns && ns.sockets.forEach(function (socket) { return socket.disconnect(); }));
            
              delete this.io.nsps[ns.name];
                
            }

          }).apply(this, nsps);
       
        return this;

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
                  if(typeof fields !== 'object')
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

                if (obj = context.collection[fields.id])
                    err = new Error('id : "' + fields.id + '" is not unique within the current context');
                else {
                    
                    (obj = (new constructor(fields))) && (context.collection[obj.id] = obj);

                    (function (name) {
                        (context.groups[name] = context.groups[name]) || ((context.groups[name] = []).destroy = destroy_group.bind(context, name));
                        (context.groups[name].indexOf(obj) > -1) || context.groups[name].push(obj);
                    })(obj.group);

                    (!context.browser && obj.onCreate()), context.register(obj);
                    
                }
        
                return (typeof callback === 'function' && callback(err, obj)), obj;

          };
          
          if(callback === false)
            return create(undefined, fields);

          return this.ready(function() {
            context.store.create(fields, create);
          }).type(fields.type);
          
      };
    
      function destroy_group (name) {
          var context = this;
          $.each(this.collection, function (id, obj) {
            if(obj.group === name)
                context.destroy(id);
          });
          delete this.groups[name];
      };

       /**
         * Unregisters and deletes the object
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
                   if(typeof callback === 'function') return callback(err);
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

               return (callback === false || context.store.destroy(id, callback)), (obj && obj.onDestroy()), context.unregister(obj);
           
           });


       };

        /**
         * Deletes data from the object
         *
         * @param {String} id
         * @param {Number,Object} filter_index
         * @param {String} path
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
                      
          var ns = this.namespace, io, nsp, _args;
          
          switch(eventHandlerName) {
            case 'onReceive':
              ns += '/' + id + '/data';
              break;
            case 'onCreate':
              ns += '/create';
              break;
            default:
              ns += '/' + id; 
          }

          io    = this.io, 
          nsp   = io ? io.nsps[ns] : null,
          _args = Array.prototype.slice.call(arguments, 1, 3);
            
          return (typeof callback === 'function' && callback()), (nsp && nsp.emit('event', _args));   
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
       * Get tree
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

        if(!Guid.isGuid(id)) {

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

                    return trigger.data(tree).dispatch(id, data);

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
    
      Api.prototype.toJSON = Api.prototype.toBSON = function () {
          return {trigger: this.trigger.toJSON()};
      };
    
      return new Api();
    
});
