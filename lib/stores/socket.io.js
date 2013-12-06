var crypto = require('crypto')
  , Store = require('../../node_modules/socket.io/lib/store')
  , IPC = require('../ipc')
  , prefix = 'SocketIO$Cluster$IPC$__'

/**
 * Exports the constructor.
 */

Cluster.Client = Client;

/**
 * Cluster store
 * Data is stored in master process
 *
 * @api public
 */

function Cluster (opts) {
    
      Store.call(this, opts);
      IPC.call(this);
        
      function debug(name) {
          var args = Array.prototype.slice.call(arguments, 1);
          vrt.log.debug('SocketIO#'+name+'()', args);
      }
        
      this.on('publish', debug.bind(this, 'publish'));
      this.on('subscribe', debug.bind(this, 'subscribe'));
      this.on('unsubscribe', debug.bind(this, 'unsubscribe'));
        
      this.setMaxListeners(0);
    
      this.data = {};
};

/**
 * Inherits from Store.
 */

Store.prototype.__proto__ = IPC.prototype;
Cluster.prototype.__proto__ = Store.prototype;

/**
 * Publishes a message.
 *
 * @api private
 */

Cluster.prototype.publish = function publish(name) { 
    var args = Array.prototype.slice.call(arguments, 1);
    this.broadcast(prefix+name, args);
    this.emit.apply(this, ['publish', name].concat(args));
};

/**
 * Subscribes to a channel
 *
 * @api private
 */

Cluster.prototype.subscribe = function subscribe(name, consumer, fn) {
    
    var context = this;
    
    function listener(args) {
        var args_ = []; for(var i in args) args_[i] = args[i];
        consumer.apply(null, args_);
        vrt.log.debug('SocketIO#subscribe()#listener()', args); 
    }
    
    this.on(prefix+name, listener);
    this.on('unsubscribe', function unsubscribe(name, fn) {
        context.removeListener(prefix+name, listener);
        context.removeListener('unsubscribe', unsubscribe);
        vrt.log.debug('SocketIO#listeners('+prefix+name+')', this.listeners(prefix+name));
    });
    
    fn && fn();
    this.emit('subscribe', name, consumer, fn);
    vrt.log.debug('SocketIO#listeners('+prefix+name+')', this.listeners(prefix+name));
    
};

/**
 * Unsubscribes
 *
 * @api private
 */

Cluster.prototype.unsubscribe = function unsubscribe(name, fn) {
    this.emit('unsubscribe', name, fn);
    vrt.log.debug('SocketIO#listeners(unsubscribe)', this.listeners('unsubscribe'));
};

Cluster.prototype.hget = function(id, key, fn) {
    fn && fn(null, this.data[id] ? this.data[id][key] : null);
};

Cluster.prototype.hset = function(id, key, value, fn) {
    this.data[id] = this.data[id] || {};
    this.data[id][key] = value;
    fn && fn();
};

Cluster.prototype.hdel = function(id, key, fn) {
    if(this.data[id])
        delete this.data[id][key];
    fn && fn();
};

Cluster.prototype.del = function(id) {
    delete this.data[id];
    fn && fn();
};

Cluster.prototype.hexists = function(id, key, fn) {
    fn && fn(null, this.data[id] && this.data[id][key] !== 'undefined');
};

Cluster.prototype.expire = function(id, expiration) {
    var context = this;
    if(typeof expiration === 'number' && this.data[id])
        setTimeout(function() {
            delete context.data[id];
        }, Math.round(expiration * 1000));
};

IPC.convert.apply(Cluster.prototype, ['hget','hset','hdel', {name: 'del', sync: true}, 'hexists', {name : 'expire', sync: true}]);

/**
 * Client constructor
 *
 * @api private
 */

function Client () {
  Store.Client.apply(this, arguments);
  this.data = {};
};

/**
 * Inherits from Store.Client
 */

Client.prototype.__proto__ = Store.Client;

/**
 * Gets a key
 *
 * @api public
 */

Client.prototype.get = function (key, fn) {
  this.store.hget(this.id, key, fn);
  return this;
};

/**
 * Redis hash set
 *
 * @api private
 */

Client.prototype.set = function (key, value, fn) {
  this.store.hset(this.id, key, value, fn);
  return this;
};

/**
 * Redis hash del
 *
 * @api private
 */

Client.prototype.del = function (key, fn) {
  this.store.hdel(this.id, key, fn);
  return this;
};

/**
 * Redis hash has
 *
 * @api private
 */

Client.prototype.has = function (key, fn) {
  this.store.hexists(this.id, key, function (err, has) {
    if (err) return fn(err);
    fn(null, !!has);
  });
  return this;
};

/**
 * Destroys client
 *
 * @param {Number} number of seconds to expire data
 * @api private
 */

Client.prototype.destroy = function (expiration) {
  if ('number' != typeof expiration) {
    this.store.del(this.id);
  } else {
    this.store.expire(this.id, expiration);
  }

  return this;
};

module.exports = {'SocketIO': Cluster};
