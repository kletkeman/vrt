var Store = require('../store');

var MemoryStore = function() {
	Store.apply(this, arguments);
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

MemoryStore.prototype.push = function(x, y, id, data, callback) {

	var bucket, err;

	if(bucket = this.get(id)) {

		if(bucket.bufferSize) {
			
			if(typeof x === 'number') {

				bucket.data[x] = Array.isArray(bucket.data[x]) ? bucket.data[x] : (typeof y !== 'number' ? data : []);

				if(typeof y === 'number')
					bucket.data[x][y] = data;
					
				else if ( Array.isArray(bucket.data[x]) ) {

					bucket.data[x].push(data);

					while(bucket.bufferSize < bucket.data[x].length)
						bucket.data[x].shift();
				}
			}
			else {

				bucket.data.push(data);

				while(bucket.bufferSize < bucket.data.length)
					bucket.data.shift();
			}
		}
		else if(typeof data === 'object') {

			for(var key in data)
				bucket.data[key] = data[key];

		}
		else 
			err = new Error('Invalid data format ['+(typeof data).capitalize()+']');

		
	}
	else
		err = new Error('Object with id `'+id+'` does not exist');

	if(typeof callback === 'function')
		callback(err, bucket);

	return bucket;
};

MemoryStore.prototype.create = function(bucket, callback) {

	bucket.data = bucket.data || (bucket.bufferSize ? [] : {});
	bucket.onCreate();

	if(typeof callback === 'function')
		callback(null, bucket);

	return bucket;
};

module.exports = MemoryStore;