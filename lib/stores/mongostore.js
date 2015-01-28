/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/


var Store         = require('../store'),
	MongoDB       = require('mongodb'),
    ObjectID      = MongoDB.ObjectID,
	MongoClient   = MongoDB.MongoClient,
	Code          = MongoDB.Code,
	util          = require('util'),
	Stream        = require('stream').Stream,
	emptyFunction = function() {},
    EventEmitter  = require('events').EventEmitter,
    argv          = require('optimist').argv,
    assert        = require('assert');

function MongoStore (options) {
	
	Store.apply(this, arguments);
    EventEmitter.apply(this, arguments);

	options = options || {};

	this.host    = options.host || "localhost";
	this.port    = options.port || 27017;
	this.user 	 = options.user;
	this.passord = options.password;
    this.poolSize = typeof argv.poolSize === 'number' ? argv.poolSize : options.poolSize || 100;
    
}


Store.prototype.__proto__ = EventEmitter.prototype;

MongoStore.prototype.__proto__ = Store.prototype;

module.exports = {'MongoStore' : MongoStore};

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
    
    assert.equal(typeof name, 'string');
    
	delete this.cache[name];
	return this;
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

MongoStore.prototype.get = function(id, callback) {
    
    assert.equal(typeof id, 'string');
	
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


MongoStore.prototype.create = function(dataset, callback) {
    
    assert.equal(dataset instanceof vrt.Api.DataSet, true);
    
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
    
    assert.equal(dataset instanceof vrt.Api.DataSet, true);
    
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
