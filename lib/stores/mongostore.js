var Store         = require('../store'),
	MongoDB       = require('mongodb'),
	MongoClient   = MongoDB.MongoClient,
	Code          = MongoDB.Code,
	util          = require('util'),
	Stream        = require('stream').Stream,
	emptyFunction = function() {};

var MongoStore = function(options) {
	
	Store.apply(this, arguments);

	options = options || {};

	this.host    = options.host || "localhost";
	this.port    = options.port || 27017;
	this.user 	 = options.user;
	this.passord = options.password;

	this.registers = {
		0: null,
		1: null,
		2: null,
		buffer : {}
	};

	this.tree.connect = this.connect.bind(this);
};

MongoStore.prototype.__proto__ = Store.prototype;

MongoStore.prototype.Tree = function() {};

MongoStore.prototype.Tree.prototype.__proto__ = Store.prototype.Tree.prototype;

module.exports = MongoStore;

MongoStore.prototype._buffer = function() {
	
	var args = Array.prototype.slice.call(arguments);
	var name = args.shift();
	var fn = args.shift();
	var scope = args.shift();
	var callback = args.pop();
	var context = this;	

	if(this.registers.buffer[name])
		callback.apply(this, this.registers.buffer[name]);
	else {

		args.push(function(err) {

			if (err)
				return callback(err);

			context.registers.buffer[name] = arguments;

			return callback.apply(context, arguments);

		});

		fn.apply(scope, args);
	}	

};

MongoStore.prototype._buffer_drop = function(name) {
	delete this.registers.buffer[name];
	return this;
};

MongoStore.prototype._construct_set_command = function(mongokey, data) {
	var r = {};
	for(var key in data) {
		r[mongokey+'.'+key] = data[key];
	};
	return {'$set' : r};
};

MongoStore.prototype._translate_arrays = function(data) {
	var r = $.extend({}, data);
	for(var key in r) {
		if(Array.isArray(r[key])) {
			$.extend(r, r[key].reduce(function(pv,c,i,arr) { if(c!==null&&c!==undefined) pv[key+'.'+i] = c; return pv;}, {}));
			delete r[key];
		}
	};
	return r;
};

MongoStore.prototype.connect = function() {
	
	var cf         = (typeof arguments[0] === 'function' && typeof arguments[1] === 'function'),
		collection = (typeof arguments[0] === 'string' || cf ? arguments[0] : null ),
		callback   = (typeof collection === 'string' || cf ? arguments[1] : arguments[0]),
		context = this;
		
	return this._buffer('connect', MongoClient.connect, MongoClient, util.format('mongodb://%s:%d/vrt', this.host, this.port), {server: {poolSize: 50}},
		function(err, db) {

			db.close = emptyFunction;
			
			if (err)
				return callback(err);
				
			context._buffer('collectionNames', db.collectionNames, db, function(err, names) {

				if (err) {
					db.close();
					return callback(err);
				}

				names = $.map(names, function(d) { return d.name.substr(4, d.length);});

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

MongoStore.prototype.Tree.prototype.get = function(path, callback) {

	if(typeof callback === 'function')
		return this.connect('tree', function(err, collection, db) {

			if(err)
				return callback(err);

			var stream = collection.find(!path || path === '*' ? {} : {path: {$regex : '^'+path}}, {_id: false}).stream(),
				tree   = {};

			stream.on('data', function(data) {
				Store.prototype.Tree.prototype.write.call(tree, data.path, data.value);
			});

			stream.on('close', function() {
				db.close();
				return Store.prototype.Tree.prototype.get.call(tree, path, callback);
			});

			stream.on('error', function(err) {
				db.close();
				callback(err);
			});

		});
};

MongoStore.prototype.Tree.prototype.delete = function(path, callback) {
	
	return this.connect('tree', function(err, collection, db) {
		
		if(err) {
			
			if(typeof callback === 'function')
				return callback(err);
			throw err;
		}
		
		collection.remove({path: {$regex : '^'+path}}, function(err) {
			
			db.close();
			
			if(typeof callback === 'function')
				return callback(err);
			throw err;
		});
	});
	
};

MongoStore.prototype.Tree.prototype.write = function(path, data, callback) {

	var TreeValue = this.Value, p;		

	return this.connect('tree', function(err, collection, db) {
		
		if(err) {
			
			if(typeof callback === 'function')
				return callback(err);
			throw err;
		}
        else if(typeof data !== 'object') {
            data = Store.prototype.Tree.prototype.write.call({}, (p = path.split('.')).pop(), data); path = p.join('.');
        }

		var out, completed = 0, length = Object.keys(data).length;

		for(var k in (data = Store.prototype.Tree.prototype.break.call(data))) {

			out = new TreeValue(path, k, data[k]);

			collection.findAndModify({path: out.path}, {}, out, {upsert: true}, function(err) {
				
				if(err) {
					
					db.close();
			
					if(typeof callback === 'function')
						return callback(err);
					throw err;
				}
				
				else if(++completed === length) {
					
					db.close();
					
					if(typeof callback === 'function')
						return callback();
					
				}
				
			});
		}
	});

};

MongoStore.prototype.Tree.prototype.Value = function () {
		
	var args = Array.prototype.slice.call(arguments);

	this.value = args.pop();
	this.path  = args.join('.');

};	

MongoStore.prototype.get = function(id, callback) {
	
	var context = this;
	
	if(typeof callback === 'function')
		return this.connect(function(err, collection, db) {

			if (err)
				return callback(err);

			collection.findOne({
				id: id
			}, {
				_id: false
			}, function(err, config) {
			
				db.close();

				if (err = !config && !err ? new Error('Object with `id` [' + id + '] does not exist.') : undefined) 
					return callback(err);
			
				return callback(null, config);
				
			});

		});

};

MongoStore.prototype.data = function(id, callback) {

	var context = this;

	vrt.get(id, function(err, exists) {

		if (err) {
					 
				if(typeof callback !== 'function') throw err;
				return callback(err);
		}
		else if (!exists && (err = new Error('Object with `id` [' + id + '] does not exist.'))) {
					 
				if(typeof callback !== 'function') throw err;
				return callback(err);
		};

		return context.connect(function(err, collection, db, collections) {

			if (err) {
					 
				if(typeof callback !== 'function') throw err;
				return callback(err);
			};

			if(!exists.bufferSize)
				return collection.findOne({id: id}, {data: true}, function(err, d) {
					if (err) {

							 db.close();
						 
							 if(typeof callback !== 'function') throw err;
							 return callback(err);
						};

					if(callback instanceof Stream)
						callback.end(d.data);
					else
					   callback(null, d.data, true);


				});
			
			var names  = collections.filter( function(d) { 
							return (new RegExp("^"+id)).test(d);
						}),
				start = names[0], completed = 0;

			while(names.length && names[0] !== (id+".data")) {

				names.push(names.shift())

				if(start === names[0])
					break;
			}

			if(callback instanceof Stream)
				callback.setMaxListeners(names.length + 2);

			if(names.length)
			   names.forEach(function(name) {

					db.collection(name, function(err, collection) {

						if (err) {

							 db.close();
						 
							 if(typeof callback !== 'function') throw err;
							 return callback(err);
						};

						var m, n = null, i = 0, o;

						if( m = (new RegExp("^("+id+".data)(\.)(\\d+)$")).exec(name) )
								n = Number(m[3]); // The index

						var	cursor = collection.find({}, {_id: false})
												.sort({_id : -1})
												.limit(exists.bufferSize === Number.MAX_VALUE ? 0 : exists.bufferSize);

						cursor.count(true, function(err, count) {

							if (err) {

								 db.close();
							 
								 if(typeof callback !== 'function') throw err;
								 return callback(err);
							};

							var stream = cursor.stream(
								{
									transform: function(d) {
										(o = {})[(n !== null ? (n + '.' + (--count)) : --count)] = d; return o;
									}
								});

							if(typeof callback === 'function')
								stream.on('data', callback.bind(context, null));

							stream.on('close', function() {

								if( ++completed === names.length ) {

									db.close();

									if(callback instanceof Stream)
										callback.end();
									else
										callback(null, null, true);

								}
							});

							if(callback instanceof Stream)
								stream.pipe(callback, {end: false});

						});

					});

				});
			else {

				db.close();

				if(callback instanceof Stream)
					callback.end();
				else
					callback(null, null, true);
			}

			

		});

	});
};

MongoStore.prototype.select = function(id, selector, callback) {

	var context = this;
	
	if(typeof callback === 'function')
		vrt.get(id, function(err, exists) {

			if (err)
				return callback(err);
			else if (!exists && (err = new Error('Object with `id` [' + id + '] does not exist.')))
				return callback(err);

			return context.connect(function(err, collection, db, collections) {

				if (err)
					return callback(err);
			
				var names  = collections.filter( function(d) { return (new RegExp("^"+id)).test(d);}),
					start = names[0], completed = 0;

				while(names.length && names[0] !== (id+".data")) {

					names.push(names.shift())

					if(start === names[0])
						break;
				}

				var dummy_array = [];

				function nextCollection() {

					if(!names.length) { 
						db.close();
						return callback(null, {});
					}

					var name 	   = names.shift();
				
					db.collection(name, function(err, collection) {

						if (err)
							return callback(err);

						collection.findOne(selector, function(err, row) {

							if (err)
								return callback(err);

							if(!row && names.length)
								setImmediate(nextCollection);
							else if(!row) {
								db.close();
								return callback(null, {});
							}
							else
								collection.find({_id : {$gt : row._id}}, {_id: true})
										  .sort({_id : -1})
										  .limit(exists.bufferSize)
										  .count(function(err, index) {

											  	if (err)
													return callback(err);
												else if(index > exists.bufferSize)
													return callback(null, {});

											  	collection.stats(function(err, stats) {

											  		index = (stats.count < exists.bufferSize ? stats.count : exists.bufferSize) - index - 1;

												  	if (err)
														return callback(err);

													var m, n;

													if( m = (new RegExp("^("+id+".data)(\.)(\\d+)$")).exec(name) )
														n = Number(m[3]); // The index

													delete row._id; 

												  	dummy_array[typeof n === 'number' ? n : index] = typeof n === 'number' ? [] : row;

												  	if(typeof n === 'number')
												  		dummy_array[n][index] = row;

												  	db.close();

												  	return callback(null, Store.prototype.select(null, selector, dummy_array));

											  	});								 

										  });

						});

					});

				};

				return nextCollection();

			});		

		});		 	
	
};

MongoStore.prototype.push = function(x, y, id, data, callback) {
	
	var collection = 'widget.config',
		context = this,
		index;

	vrt.get(id, function(err, exists) {

		if (err) {
						 
			if(typeof callback !== 'function') throw err;
			return callback(err);
		}
		else if(!exists) return false;
		else 	
			return context.connect(function(collections) {
				
				if(exists.bufferSize)
					collection = id + '.data';
				
				if(typeof x === 'number' && collections.indexOf(collection) === -1) {
					collection += '.' + x;
				}
				else if(typeof x === 'number' && typeof y !== 'number')
					index = x;
				
				if(typeof y === 'number')
					index = y;

				if(collections.indexOf(collection) === -1)
					context._buffer_drop('collectionNames');
					
				return collection;
					
			}, function(err, collection, db) {

				if (err) {
					 
					 if(typeof callback !== 'function') throw err;
					 return callback(err)
				};
				
				function mongo_callback(err) {

					if (err) {
							 
						 if(typeof callback !== 'function') throw err;
						 return callback(err)
					}
					else if(collection.collectionName !== 'widget.config')
						collection.stats(function(err, stats) {

							if (err)
								console.error(err);

							else if(stats.count >= (exists.bufferSize * 1.25)) {

								collection.find({}, {_id: true})
										  .sort({_id: -1})
										  .skip(exists.bufferSize - 1)
								          .limit(1)
								          .nextObject(function(err, d) {

								          	if (err)
												console.error(err);
											else if(d)
												collection.remove({_id: {$lt : d._id}}, 
													function(err) {

														db.close();

														if (err)
															console.error(err);
												});

										  });
							}							
							else
								db.close();
							
						});
					else
						db.close();
					
					delete data._id;

					vrt.Api[exists.type.capitalize()].prototype.onReceive.call(exists, data, x, y);

					if(typeof callback === 'function') callback();
													
				};
						
				if(exists.bufferSize) {

					if(typeof index === 'number') {

						collection.stats(function(err, stats) {

							if (err) {
							
								db.close();
							 
								 if(typeof callback !== 'function') throw err;
								 return callback(err)
							};

							var cursor = collection.find({}, {_id : true})
											   .sort({_id : -1})
											   .limit(1)
											   .skip((stats.count < exists.bufferSize ? stats.count : exists.bufferSize) - index - 1);
					
							cursor.nextObject(function(err, d) {
							
								if (err) {
								
									db.close();
								 
									 if(typeof callback !== 'function') throw err;
									 return callback(err)
								};
							
								if(!d)
									collection.insert(data, mongo_callback);
								else
									collection.update({_id: d._id}, {$set : context._translate_arrays(data)}, mongo_callback);
							
							});



						});
					
					}
					else
						collection.insert(data, mongo_callback);
					
				}
				else
					collection.update({'id': id}, context._construct_set_command('data', data), mongo_callback);

			});

		});
			
};



MongoStore.prototype.create = function(dataset, callback) {

	var context = this;

	delete dataset.data;

	dataset = vrt.Api[dataset.type.capitalize()].prototype.toJSON.call(dataset);

	return this.connect(function(err, collection, db) {

		if (err) {
			 
			 if(typeof callback !== 'function') throw err;
			 return callback(err)
		};

		collection.findOne({
			id: dataset.id
		}, {
			data: false,
			_id: false
		}, function(err, exists) {

			if (err && typeof callback !== 'function') throw err;
			else if (err) return callback(err);

			if (!exists) {

				dataset.data = dataset.data || (dataset.bufferSize ? [] : {});

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
	
	if(typeof callback === 'function')
		return this.connect(function(err, collection, db) {

			if (err)
				return callback(err);

			collection.find((typeof properties === 'object' ? properties : {}), {
				'id': true
			})
				.toArray(function(err, list) {
				
					db.close();
				
					if (err)
						return callback(err)

					return callback(err, $.map(list, function(d) {
								return d.id;
							}));

				});

		});

};

MongoStore.prototype.reload = function(callback) {
	return this.connect(function(err, collection, db) {

		if (err) {
		 
			 if(typeof callback !== 'function') throw err;
			 return callback(err);
		}
		
		function finish(err) {

			db.close();

			if(typeof callback === 'function')
				callback(err);

		};

		collection.find({}, {_id: false}).stream()
		.on('data', function(config) {
			vrt.create(config, false);
		})
		.on('error', finish)
		.on('close', finish);
	});
};

MongoStore.prototype.save = function(dataset, callback) {

	delete dataset.data;

	dataset = vrt.Api[dataset.type.capitalize()].prototype.toJSON.call(dataset);
	
	return this.connect(function(err, collection, db) {

		if (err) {
		 
			 if(typeof callback !== 'function') throw err;
			 return callback(err);
		}

		collection.update({
			id: dataset.id
		}, {
			$set: dataset
		}, function(err) {
			
			db.close();
			
			if(typeof callback === 'function') callback(err);
			else if (err) 
				throw err;
		});

	});

};
