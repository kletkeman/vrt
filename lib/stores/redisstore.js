var asyncblock = require('asyncblock'),
	Store = require('../store');

var RedisStore = function(options) {
	Store.apply(this, arguments);
	options = options || {};
	this.client = options.client;

	if(this.client !== 'object')
		throw new Error('RedisStore.client is not set.\n Pass a Redis instance to the constructor like this:  new RedisStore({ client : <client> }); ');
};

//Module is incomplete
//module.exports = RedisStore;

/**
* Inherits from Store.
*/

RedisStore.prototype.__proto__ = Store.prototype;

RedisStore.prototype.uri = function() {
	var args = Array.prototype.slice.call(arguments);
	return 'vrt::' + args.join('.');
};

RedisStore.prototype.save = function(id, data, callback) { 
	this.client.set(this.uri('config', id), JSON.stringify(data), callback);
};

RedisStore.prototype.get = function(id, callback) {

	var context = this;

	asyncblock(function(flow) {
		
		flow.errorCallback = callback;

		var instance = vrt.Api.DataSet.collection[id], 
			config   = flow.sync(context.client.get(context.uri('config', id), flow.callback()));

		if(instance instanceof vrt.Api.DataSet) {

			var data_in,
				data_out,
				length = flow.sync(context.client.get(context.uri('data', id, length), flow.callback())),
				data;

			if(config.bufferSize) {
				data_out = [];

				if(length)
					for(var x = 0; x < length; x++) {
						data = flow.sync(context.client.hgetall(context.uri('data', id, x), flow.callback()));
						if(data) {
							data_out[x] = [];
							for(var y in data)
								data_out[x][y] = data[y];
						}
					}
				else {
					data = flow.sync(context.client.hgetall(context.uri('data', id), flow.callback()));
					if(data)
						for(var x in data)
							data_out[x] = data[x];
				}
			}
			else {
				data = flow.sync(context.client.hgetall(context.uri('data', id), flow.callback()));
				data_out = data;
			}

		}
		else if(config) {

			config = JSON.parse(config);

			// What to do if object not in memory
			
		}
		else
			throw new Error(new Error('Object with `id` ['+id+'] does not exist.'));

	});
};

RedisStore.prototype.push = function(x, y, id, data, callback) {

	var context = this;

	asyncblock(function(flow) {

		flow.errorCallback = callback;

		var instance;

		if(instance = flow.sync(context.get(id, flow.callback()))) {

			if(instance.bufferSize) {

				if(typeof x === 'number') {

					var length = parseInt(flow.sync(context.client.get(
						context.uri('data', id, 'length',
						flow.callback()
					))));

					if(typeof y === 'number') {
						
						
					}
					else {

											
					}

				}
				else {

								
				}

			}
			else if(typeof data === 'object') {
				
				var current = flow.sync(context.client.get(context.uri('data', id), flow.callback()));
				
				if(current)
					current = JSON.parse(current);
				else 
					current = {};

				flow.sync(context.client.set(context.uri('data', id), Object.create(current, data), flow.callback()));
			}
			else 
				throw new Error('Invalid data format ['+(typeof data).capitalize()+']');

		}
		else
			throw new Error('Object with id `'+id+'` does not exist');

		callback();

	});
};

RedisStore.prototype.create = function(instance, callback) {

	var context = this;

	asyncblock(function(flow) {

		flow.errorCallback = callback;

		if( !flow.sync(context.get(instance.id, flow.callback()) ) )  {

			 instance.data = instance.bufferSize ? [] : {};
			 instance.onCreate();

			 flow.sync(context.save (instance, flow.callback()));
		}

		if(typeof callback === 'function')
			callback(null, instance);
	});

};

RedisStore.prototype.list = function(callback) {

	var list = [];

	for(var id in internalObjectBuffer)
		list.push(id);

	if(typeof callback === 'function')
		callback(null, list);

	return list;
	
};

