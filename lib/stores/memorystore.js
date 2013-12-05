var Store = require('../store'),
	Stream = require('stream').Stream;

var MemoryStore = function() {
	Store.apply(this, arguments);
	this._data = {};
};

/**
* Inherits from Store.
*/

MemoryStore.prototype.__proto__ = Store.prototype;

MemoryStore.prototype.get = function(id, callback) {

	var error, obj = vrt.Api.DataSet.collection[id];

	if(typeof obj === 'undefined')
		error = new Error('Object with `id` ['+id+'] does not exist.');

	if(typeof callback === 'function')
		return callback(error, obj);
	else if(error)
		throw error;

	return obj;
};

MemoryStore.prototype.data = function(id, callback) {

	var context = this, stack = [], exists = vrt.Api.DataSet.collection[id], err;

	if (!exists && (err = new Error('Object with `id` [' + id + '] does not exist.'))) {
				 
			if(typeof callback !== 'function') throw err;
			return callback(err);
	};

	function walk(d) {

		stack.push(null);

		if(Array.isArray(d)) {
			for(var i = 0, len = d.length; i < len; i++) {

				stack[stack.length - 1] = i;

				if(Array.isArray(d[i])) {
					walk(d[i]);
					continue;
				}

				var o = {};

				o[stack.join('.')] = d[i];

				if(callback instanceof Stream)
					callback.write(o);
				else if(typeof callback === 'function')
					callback(null, o);


			}

			d = null;
		}

		if(callback instanceof Stream)
			return callback.end(d);
		else if(typeof callback === 'function')
			return callback(null, d, true);
	}

	return walk(this._data[id]);
	
};

MemoryStore.prototype.push = function(x, y, id, data, callback) {

	var bucket, err;

	if(bucket = this.get(id)) {

		if(bucket.bufferSize) {
			
			if(typeof x === 'number') {

				this._data[id][x] = Array.isArray(this._data[id][x]) ? 
					this._data[id][x] : (typeof y !== 'number' ? 
						(typeof data  ===  'object' && typeof this._data[id][x] === 'object' ? 
							$.extend( true, this._data[id][x], data ) : data) : []);

				if(typeof y === 'number')
					this._data[id][x][y] = (typeof data  ===  'object' && typeof this._data[id][x][y] === 'object' ?
						$.extend( true, this._data[id][x][y], data ) : data);
					
				else if ( Array.isArray(this._data[id][x]) ) {

					this._data[id][x].push(data);

					while(bucket.bufferSize < this._data[id][x].length)
						this._data[id][x].shift();
				}
			}
			else {

				this._data[id].push(data);

				while(bucket.bufferSize < this._data[id].length)
					this._data[id].shift();
			}
		}
		else if(typeof data === 'object')
			$.extend( true, this._data[id], data );
		else 
			err = new Error('Invalid data format ['+(typeof data).capitalize()+']');
			
		bucket.onReceive(data, x, y)
		
	}
	else
		err = new Error('Object with id `'+id+'` does not exist');

	if(typeof callback === 'function')
		callback(err, bucket);

	return bucket;
};

MemoryStore.prototype.select = function(id, selector, callback) {
	return Store.prototype.select.call(this, id, selector, this._data[id], callback);
};

MemoryStore.prototype.create = function(bucket, callback) {

	bucket.data   = bucket.data   || (bucket.bufferSize ? [] : {});
	this._data[bucket.id] = this._data[bucket.id] || (bucket.bufferSize ? [] : {});

	bucket.onCreate();

	if(typeof callback === 'function')
		callback(null, bucket);

	return bucket;
};

module.exports = {'MemoryStore' : MemoryStore};