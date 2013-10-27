var Store = require('../store'),
	MongoClient = require('mongodb').MongoClient,
	util = require('util');

var MongoStore = function(options) {

	options = options || {};

	this.host = options.host || "localhost";
	this.port = options.port || 27017;
};

MongoStore.prototype.__proto__ = Store.prototype;

module.exports = MongoStore;

MongoStore.prototype.connect = function() {
	
	var cf         = (typeof arguments[0] === 'function' && typeof arguments[1] === 'function'),
		collection = (typeof arguments[0] === 'string' || cf ? arguments[0] : null ),
		callback   = (typeof collection === 'string' || cf ? arguments[1] : arguments[0]);
		
	return MongoClient.connect(util.format('mongodb://%s:%d/vrt', this.host, this.port),
		function(err, db) {
			
			if (err)
				return callback(err);
				
			db.collectionNames(function(err, names) {
				if (err) {
					db.close();
					return callback(err);
				}
				db.collection(( (cf ? collection(names) : collection) || 'widget.config'), function(err, collection) {
					if (err) {
						db.close();
						return callback(err);
					}
					return callback(err, collection, db, names);
				});
			});
			
		});
};

MongoStore.prototype.$set = function(mongokey, data) {
	var r = {};
	for(var key in data) {
		r[mongokey+'.'+key] = data[key];
	};
	return {'$set' : r};
};

MongoStore.prototype.get = function(id, callback) {
	
	var context = this;

	return this.connect(function(err, collection, db) {

		if (err && typeof callback !== 'function') throw err;
		else if (err) return callback(err);

		collection.findOne({
			'id': id
		}, {
			'_id': false
		}, function(err, config) {
			
			db.close();
			
			if (!config && !err)
				err = new Error('Object with `id` [' + id + '] does not exist.');

			if (err) {
				
				if(typeof callback !== 'function') throw err;
				return callback(err)
			};

			if (typeof config.schema === 'string')
				config.schema = JSON.parse(config.schema);
			
			if (typeof callback === 'function')
				return callback(null, $.extend(true, {}, vrt.Api.DataSet.collection[id], config));
			
				
		});

	});

};

MongoStore.prototype.select = function(id, selector, callback) {
	
	return callback(null, {});
	return this.get(id, function(err, obj) {

		if (typeof callback === 'function' && err)
			callback(err);
		else if (obj.bufferSize) {

			var data = {};

			for (var i = 0, len = obj.data.length; i < len; i++) {

				var m = true;

				for (var name in selector)
					m &= (selector[name] === obj.data[i][name]);

				if (m)
					data[i] = obj.data[i];
			}

			if (typeof callback === 'function')
				callback(undefined, data);

			return data;
		} else if (typeof callback === 'function')
			callback(undefined, obj.data);

		return obj.data;
	});
};

MongoStore.prototype.push = function(x, y, id, data, callback) {
	
	var exists     = vrt.Api.DataSet.collection[id],
		collection = 'widget.config',
		context = this,
		index;
	
	if(!exists) return false;
	else 	
		return this.connect(function(collections) {
			
			if(exists.bufferSize)
				collection = id + '.data';
			
			if(typeof x === 'number' && collections.indexOf(collection) === -1) {
				collection += '.' + x;
			}
			else if(typeof x === 'number' && typeof y !== 'number')
				index = x;
			
			if(typeof y === 'number')
				index = y;
				
			return collection;
				
		}, function(err, collection, db) {

			if (err) {
				 
				 if(typeof callback !== 'function') throw err;
				 return callback(err)
			};
			
			var cb = function(err) {
								
				db.close();
					
				if(typeof callback === 'function') callback(err);
				else if (err) throw err;
								
				vrt.Api[exists.type.capitalize()].prototype.onReceive.call(exists, data, x, y);
				
								
			};
					
			if(exists.bufferSize) {
		
				if(index) {
				
					var cursor = collection.find({}, {_id : true})
										   .sort({_id : 1})
										   .limit(exists.bufferSize)
										   .skip(index - 1);
				
					cursor.nextObject(function(err, d) {
					
						if (err) {
						
							db.close();
						 
							 if(typeof callback !== 'function') throw err;
							 return callback(err)
						};
					
						if(!d)
							collection.insert(data, cb);
						else
							collection.update({_id: d._id}, context.$set('data', data), cb);
					
					});
				
				
				}
				else
					collection.insert(data, cb);
				
			}
			else
				collection.update({'id': id}, context.$set('data', data), cb);

		});
			

};

MongoStore.prototype.create = function(dataset, callback) {

	var context = this;

	dataset = $.extend(true, {}, dataset);

	delete dataset.data;

	return this.connect(function(err, collection, db) {

		if (err) {
			 
			 if(typeof callback !== 'function') throw err;
			 return callback(err)
		};

		collection.findOne({
			'id': dataset.id
		}, {
			'data': false,
			'_id': false
		}, function(err, exists) {

			if (err && typeof callback !== 'function') throw err;
			else if (err) return callback(err);

			if (!exists) {
				
				dataset.data = dataset.data || (dataset.bufferSize ? [] : {});

				if (typeof dataset.schema === 'object')
					dataset.schema = JSON.stringify(dataset.schema);

				collection.insert(dataset, function(err) {
					
					db.close();
					
					if(typeof callback === 'function') callback(err, dataset);
					else if (err) throw err;

					vrt.Api[dataset.type.capitalize()].prototype.onCreate.call(dataset);
					
					
				});

			} else {
				
				db.close();
				
				context.save(dataset, typeof callback === 'function' ? callback.bind(this, null, dataset) : undefined);
			}
			

		});

	});

};

MongoStore.prototype.list = function() {

	var args = Array.prototype.slice.call(arguments),
		list = [],
		properties = args[0],
		callback = args[1] || args[0];

	return this.connect(function(err, collection, db) {

		if (err) {
		 
			 if(typeof callback !== 'function') throw err;
			 return callback(err)
		}

		collection.find((typeof properties === 'object' ? properties : {}), {
			'id': true
		})
			.toArray(function(err, list) {
				
				db.close();
				
				if (err) {
		 
					 if(typeof callback !== 'function') throw err;
					 return callback(err)
				}

				if (typeof callback === 'function')
					callback(err, $.map(list, function(d) {
						return d.id;
					}));

			});

	});

};


MongoStore.prototype.save = function(dataset, callback) {

	dataset = $.extend(true, {}, dataset);

	delete dataset.data;

	return this.connect(function(err, collection, db) {

		if (err) {
		 
			 if(typeof callback !== 'function') throw err;
			 return callback(err)
		}

		if (typeof dataset.schema === 'object')
			dataset.schema = JSON.stringify(dataset.schema);

		collection.update({
			'id': dataset.id
		}, {
			'$set': dataset
		}, function(err) {
			
			db.close();
			
			if(typeof callback === 'function') callback(err);
			else if (err) throw err;
		});

	});

};
