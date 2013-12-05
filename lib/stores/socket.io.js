var crypto = require('crypto')
  , Store = require('../../node_modules/socket.io/lib/store')
  , IPC = require('../ipc');

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
};

/**
 * Inherits from Store.
 */

Cluster.prototype.__proto__ = Store.prototype;

/**
 * Publishes a message.
 *
 * @api private
 */

Cluster.prototype.publish = function () { };

/**
 * Subscribes to a channel
 *
 * @api private
 */

Cluster.prototype.subscribe = function () { };

/**
 * Unsubscribes
 *
 * @api private
 */

Cluster.prototype.unsubscribe = function () { };

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
Client.prototype.__proto__ = IPC.prototype;

/**
 * Gets a key
 *
 * @api public
 */

Client.prototype.get = function (key, fn) {
  fn(null, this.data[key] === undefined ? null : this.data[key]);
  return this;
};

/**
 * Sets a key
 *
 * @api public
 */

Client.prototype.set = function (key, value, fn) {
  this.data[key] = value;
  fn && fn(null);
  return this;
};

/**
 * Has a key
 *
 * @api public
 */

Client.prototype.has = function (key, fn) {
  fn(null, key in this.data);
};

/**
 * Deletes a key
 *
 * @api public
 */

Client.prototype.del = function (key, fn) {
  delete this.data[key];
  fn && fn(null);
  return this;
};

/**
 * Destroys the client.
 *
 * @param {Number} number of seconds to expire data
 * @api private
 */

Client.prototype.destroy = function (expiration) {
  if ('number' != typeof expiration) {
    this.data = {};
  } else {
    var self = this;

    setTimeout(function () {
      self.data = {};
    }, expiration * 1000);
  }

  return this;
};

IPC.convert.apply(Client.prototype, Object.keys(Client.prototype).filter(function(k) {
        return typeof Client.prototype[k] === 'function';
    }).map(function(k) {
        if(k === 'destroy') return {name: k, sync: true};
        return k;        
    }));

module.exports = {'SocketIO': Cluster};
