var Store         = require('../store'),
	MongoDB       = require('mongodb'),
    ObjectID      = MongoDB.ObjectID,
	MongoClient   = MongoDB.MongoClient,
	Code          = MongoDB.Code,
	util          = require('util'),
	Stream        = require('stream').Stream,
	emptyFunction = function() {},
    EventEmitter  = require('events').EventEmitter,
    argv          = require('optimist').argv;

var MongoStore = function(options) {
	
	Store.apply(this, arguments);
    EventEmitter.apply(this, arguments);

	options = options || {};

	this.host    = options.host || "localhost";
	this.port    = options.port || 27017;
	this.user 	 = options.user;
	this.passord = options.password;
    this.poolSize = typeof argv.poolSize === 'number' ? argv.poolSize : options.poolSize || 100;

	this.registers = {
		0: 0,
		1: null,
		2: null
	};
    
    this.cache = {};
    this.locks = {};
    
    vrt.Api.IPC.define('MONGOSTORE_INSERT_EVENT');
    vrt.Api.IPC.define('MONGOSTORE_UPDATE_EVENT');
    vrt.Api.IPC.define('MONGOSTORE_LOCK_PUSH_EVENT');
    vrt.Api.IPC.define('MONGOSTORE_LOCK_SHIFT_EVENT');
    
    var context = this;

	this.tree.connect = this.connect.bind(this);
    
    this.on('insert', function(collectionName, data, ipc) {
       
        var n, c = context.cache[n = collectionName + '.stats'];
        
        if(c)
        {

            context._cache_drop(n);

        }
    });
    
    function handle_ipc_event(target, args, packet) {
        
        var args_ = []; for(var i in args) args_[i] = args[i];
        
        if( target === MONGOSTORE_INSERT_EVENT)
            args_.unshift('insert');
        else if( target === MONGOSTORE_UPDATE_EVENT)
            args_.unshift('update');
        else if ( target === MONGOSTORE_LOCK_PUSH_EVENT)
            return context._lock.apply(context, args_);
        else if ( target === MONGOSTORE_LOCK_SHIFT_EVENT)
            return context._unlock.apply(context, args_);
        
        args_.push(packet);
        return context.emit.apply(context, args_);
    }
    
    vrt.ipc.on(MONGOSTORE_INSERT_EVENT, handle_ipc_event.bind(context, MONGOSTORE_INSERT_EVENT));
    vrt.ipc.on(MONGOSTORE_UPDATE_EVENT, handle_ipc_event.bind(context, MONGOSTORE_UPDATE_EVENT));
    vrt.ipc.on(MONGOSTORE_LOCK_PUSH_EVENT, handle_ipc_event.bind(context, MONGOSTORE_LOCK_PUSH_EVENT));
    vrt.ipc.on(MONGOSTORE_LOCK_SHIFT_EVENT, handle_ipc_event.bind(context, MONGOSTORE_LOCK_SHIFT_EVENT));
    
};

Store.prototype.__proto__ = EventEmitter.prototype;

MongoStore.prototype.__proto__ = Store.prototype;

MongoStore.prototype.Tree = function() {};

MongoStore.prototype.Tree.prototype.__proto__ = Store.prototype.Tree.prototype;

module.exports = {'MongoStore' : MongoStore};

MongoStore.prototype._lock = function(name, args) {
    
    var lock = this.locks[name] || {length: 0};
    
    if(this.registers[0])
        return (this.registers[0] = false);
    else if(Array.isArray(lock))
        lock.push(args);
    else
        this.locks[name] = lock = [args];    
    
    if(args !== MONGOSTORE_LOCK_PUSH_EVENT)
        vrt.ipc.broadcast(MONGOSTORE_LOCK_PUSH_EVENT, [name, MONGOSTORE_LOCK_PUSH_EVENT]);
    
    vrt.log.debug("MongoStore#_lock()", name, lock.length);
    
    return lock.length - 1;
    
};

MongoStore.prototype._unlock = function(name, args1) {
    
    var lock = this.locks[name] || {length: 0}, args2;
    
    if(lock.length) {
            
        while((args2 = lock.shift()))
        {
            if(args2 === MONGOSTORE_LOCK_PUSH_EVENT)
                break;
            
            vrt.ipc.broadcast(MONGOSTORE_LOCK_SHIFT_EVENT, [name]);
            
            if(args2 !== args1) {
                
                this.registers[0] = true;
                
                if(this[args2.callee.name])
                    this[args2.callee.name].apply(this, args2);
                else
                    args2.callee.apply(this, args2);
                
                break;
            }            
            
        }  
        
    }
    
    vrt.log.debug("MongoStore#_unlock()", name, lock.length);
    
    return lock.length;
    
};

MongoStore.prototype._cache = function() {
	
	var args = Array.prototype.slice.call(arguments);
	var name = args.shift();
	var fn = args.shift();
	var scope = args.shift();
	var callback = args.pop();
	var context = this;	

	if(this.cache[name])
		callback.apply(this, this.cache[name]);
	else {

		args.push(function(err) {

			if (err)
				return callback(err);

			context.cache[name] = arguments;

			return callback.apply(context, arguments);

		});

		fn.apply(scope, args);
	}	

};

MongoStore.prototype._cache_drop = function(name) {
	delete this.cache[name];
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
		
	return this._cache('connect', MongoClient.connect, MongoClient, util.format('mongodb://%s:%d/vrt', this.host, this.port), {server: {poolSize: this.poolSize}},
		function(err, db) {

			if (err)
				return callback(err);
            
            db.close = emptyFunction;
				
			context._cache('collectionNames', db.collectionNames, db, function(err, names) {

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

				if (err || (err = !config ? new Error('Object with `id` [' + id + '] does not exist.') : undefined) )
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
                            return callback(err, {});

						collection.findOne(selector, function(err, row) {

							if (err)
                                return callback(err, {});
                            
                            var args = arguments;

							if(!row && names.length) {
								return setImmediate(nextCollection);
                            }
							else if(!row) {
								db.close();
								return callback(null, {});
							}
							else {
                                
                                if(context._lock(name, args))
                                    return;
                                
								collection.find({_id : {$gt : row._id}}, {_id: true})
										  .sort({_id : -1})
										  .limit(exists.bufferSize)
										  .count(function(err, index) {

											  	if (err || index > exists.bufferSize) {
                                                    
													context._unlock(name, args);
													return callback(err, {});
                                                
                                                }
                                                
											  	context._count(collection, function(err, count) {
                                                    
											  		index = Math.max((count < exists.bufferSize ? count : exists.bufferSize) - index - 1, 0);
                                                    
												  	if (err) {
                                                        context._unlock(name, args);
														return callback(err);
                                                        
                                                    }
                                                    
													var m, n;

													if( m = (new RegExp("^("+id+".data)(\.)(\\d+)$")).exec(name) )
														n = Number(m[3]); // The index

													delete row._id; 

												  	dummy_array[typeof n === 'number' ? n : index] = typeof n === 'number' ? [] : row;

												  	if(typeof n === 'number')
												  		dummy_array[n][index] = row;

												  	db.close();
                                                    
                                                    context._unlock(name, args);

												  	return callback(null, Store.prototype.select(null, selector, dummy_array));

											  	});								 

										  });
                            }

						});

					});

				};

				return nextCollection();

			});		

		});		 	
	
};

MongoStore.prototype._count = function(collection, callback) {
    if(typeof callback === 'function')
        return this._cache(collection.collectionName + '.stats', collection.stats, collection, function(err, stats) {
            var count = err ? 0 : stats.count;
            return callback(err && err.message.indexOf('ns not found') > -1 ? (count = 0) || undefined : err , count);
        });
};

MongoStore.prototype._insert = function _insert(collection, data) {
    
    var lockname = collection.collectionName, args_ = arguments;
    
    if( this._lock(lockname, args_) )
        return;
    
    var args = Array.prototype.slice.call(arguments, 1),
        callback = args.pop(), context = this;
    
    if(typeof callback !== 'function')
        throw new Error("Expected function");
    
     args.push(function(err) {        
        callback.apply(collection, arguments);         
        context._unlock(lockname, args_);
    });
    
    this.emit('insert', collection.collectionName, data);
    vrt.ipc.broadcast(MONGOSTORE_INSERT_EVENT, [collection.collectionName, data]);
    
    collection.insert.apply(collection, args);
};

MongoStore.prototype._update = function _update(collection, data) {
    
    var args = Array.prototype.slice.call(arguments, 2);
    
    this.emit('update', collection.collectionName, data);
    vrt.ipc.broadcast(MONGOSTORE_UPDATE_EVENT, [collection.collectionName, data]);
    
    collection.update.apply(collection, args);
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
					context._cache_drop('collectionNames');
					
				return collection;
					
			}, function(err, collection, db) {

				if (err) {
					 
					 if(typeof callback !== 'function') throw err;
					 return callback(err)
				};
				
				function mongo_callback(err) {
                    
                    var info;
                    
					if (err) {
							 
						 if(typeof callback !== 'function') throw err;
						 return callback(err)
					}                    
                    
                    if(collection.collectionName !== 'widget.config')
						context._count(collection, function(err, count) {

							if (err)
								console.error(err);

							else if(count >= (exists.bufferSize * 1.25)) {

								collection.find({}, {_id: true})
										  .sort({_id: -1})
										  .skip(exists.bufferSize - 1)
								          .limit(1)
								          .nextObject(function(err, d) {

								          	if (err)
												console.error(err);
											else if(d)
												collection.remove({_id: {'$lt' : d._id}}, 
													function(err) {
                                                        
														db.close();

														if (err)
															vrt.log.error(err);
												});

										  });
							}							
							else
								db.close();
							
						});
					else
						db.close();
					
					delete data._id;

					vrt.type(exists.type).prototype.onReceive.call(exists, data, x, y);

					if(typeof callback === 'function') callback();
													
				};
						
				if(exists.bufferSize) {

					if(typeof index === 'number') {

						context._count(collection, function(err, count) {

							if (err) {
							
								db.close();
							 
								if(typeof callback !== 'function') throw err;
								return callback(err)
							}

							var cursor = collection.find({}, {_id : true})
											   .sort({_id : -1})
											   .limit(1)
											   .skip(Math.max((count < exists.bufferSize ? count : exists.bufferSize) - index - 1, 0));
					
							cursor.nextObject(function(err, d) {
							
								if (err) {
								
									db.close();
								 
                                    if(typeof callback !== 'function') throw err;
                                    return callback(err);
                                    
								}
							
								if(!d) 
                                {
                                    
									return context._insert(collection, data, mongo_callback);
                                }
								else 
                                {
                                   
									return context._update(collection, data, {_id: d._id}, {$set : context._translate_arrays(data)}, mongo_callback);
                                }
							
							});



						});
					
					}
					else 
                    {
                        
                       return context._insert(collection, data, mongo_callback);
                    }
					
				}
				else {
                    
					return context._update(collection, data, {'id': id}, context._construct_set_command('data', data), mongo_callback);
                }

			});

		});
			
};



MongoStore.prototype.create = function(dataset, callback) {

	var context = this;

	delete dataset.data;

	dataset = vrt.type(dataset.type).prototype.toJSON.call(dataset);

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

				context._insert(collection, dataset, function(err) {
					
					db.close();
					
					if(typeof callback === 'function') callback(err, dataset);
					else if (err) throw err;
					
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
    
    var context = this;
    
	delete dataset.data;

	dataset = vrt.type(dataset.type).prototype.toJSON.call(dataset);
	
	return this.connect(function(err, collection, db) {

		if (err) {
		 
			 if(typeof callback !== 'function') throw err;
			 return callback(err);
		}

		context._update(collection, dataset, {
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
