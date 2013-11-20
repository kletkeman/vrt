;!(function(module, require, undefined) {

	/**
	 * Store constructor.
	 *
	 * @api public
	 */

	var Store = function() {

	};

	/**
	 * Publish data to client
	 *
	 * @param {String} id
	 * @param {String} eventHandlerName
	 * @param {Array} args
	 * @param {Function} callback
	 * @return undefined
	 * @api public
	 */

	Store.prototype.publish = function(id, eventHandlerName, args, callback) { };

	/**
	 * Receive data from server
	 *
	 * @param {String} id
	 * @param {String} eventHandlerName
	 * @param {Object} data
	 * @return undefined
	 * @api public
	 */

	Store.prototype.receive = function(id, eventHandlerName, data) { };

	/**
	 * Get object configuration
	 *
	 * @param {String} id
	 * @param {Function} callback
	 * @return undefined
	 * @api public
	 */

	Store.prototype.get = function(id, callback) {
		if(typeof callback === 'function')
			callback();
	};

	/**
	 * Get data
	 * 
	 * Subsequent calls to callback with arguments(err, data, eof);
	 *
	 * if callback is a Function data will contain an object with a key with format [x].[y] that describes position in array(s)
	 * when eof is true there is no more data
	 *
	 * callback can also be a writable stream, stream will receive same data as if it was a function
	 *
	 * @param {String} id
	 * @param {Function,[Stream]} callback
	 * @return undefined
	 * @api public
	 */

	Store.prototype.data = function(id, callback) { };

	/**
	 * Push object data
	 *
	 * @param {Number} x
	 * @param {Number} y
	 * @param {String} id
	 * @param {Object} data
	 * @param {Function} callback
	 * @return undefined
	 * @api public
	 */

	Store.prototype.push = function(x, y, id, data, callback) {
		if(typeof callback === 'function')
			callback();
	};

	/**
	 * Update object data
	 *
	 * @param {id} String
	 * @param {Object} selector
	 * @param {Object} data
	 * @param {Function} callback
	 *
	 * Updates only first match found
	 *
	 * @return undefined
	 * @api public
	 */

	Store.prototype.update = function(id, selector, data, callback) {

		var context = this;

		this.select(id, selector, function(err, found) {

			if (err) {
							
				if(typeof callback !== 'function') throw err;
				return callback(err)
			}	
			
			var args = [];
			
			for(var path in found) {
				args = path.split('.').map(function(n) { return Number(n); }); break;
			}

			while(args.length < 2) args.push(undefined);
					
			args.push(id);
			args.push(data);
			args.push(callback);

			context.push.apply(context, args);

		});

	};

	/**
	 * Store configuration if it does not exists in the store
	 * 
	 * This function should call instance.onCreate() if configuration does not exist in the store
	 * 
	 * DataSet.collection contains a hashset of all instances with instance.id as the key
	 * All processes should have an instance of the type in memory, eventually
	 *
	 * @param {Object} instance
	 * @param {Function} callback
	 * @return undefined
	 * @api public
	 */

	Store.prototype.create = function(instance, callback) {
		if(typeof callback === 'function')
			callback();
	};

	/**
	 * Save configuration
	 *
	 * @param {Object} dataset
	 * @param {Function} callback
	 * @return undefined
	 * @api public
	 */

	Store.prototype.save = function(dataset, callback) { 
		if(typeof callback === 'function')
			callback();
	};

	/**
	 * List objects
	 * Optional first parameter with properties to match with object and filter results.
	 *
	 * @param {Object} properties
	 * @param {Function} callback
	 * @return {Array}
	 * @api public
	 */

	Store.prototype.list = function() {

		var args = Array.prototype.slice.call(arguments),
			list = [],
			properties = args[0],
			callback = args[1] || args[0];

		for(var id in vrt.Api.DataSet.collection) {

			if(!(typeof properties === 'object') || (function() {
		    	
		    	var obj = vrt.Api.DataSet.collection[id],
		        	match = true;

		        for(var name in properties)
		        	match &= (properties[name] === obj[name]);

		        return match;

		      })()) list.push(id);
		};

		if(typeof callback === 'function')
			callback(null, list);

		return list;
	};
	
    /**
     * Select data
     *
     * @param {String} id
     * @param {Object} selector
     * @param {Array} data
     * @param {Function} callback
	 *
     * (id, selector, [data, callback])
     *
     * @api public
     */

    Store.prototype.select = function (id, selector) {

    	var data     = Array.isArray(arguments[2]) ? arguments[2] : [],
    		callback = (typeof arguments[2] === 'function' ? arguments[2] : arguments[3]),
    		stack    = [], err;

    	if(typeof selector !== 'object')
    		throw new Error("TypeError: Missing required argument 'selector' [Object]");

    	function walk(d2, d1) {

			d1 = d1 || {length: 0};

			stack.push(null);

			for (var i = 0, len = d2.length, m; i < len; i++) {

				stack[stack.length - 1] = i;

				if(Array.isArray(d2[i])) {
					walk(d2[i], d1);
					continue;
				} 

				m = true;

				for (var name in selector)
					m &= (d2[i] && selector[name] === d2[i][name]);

					if (m) {
						(d1[stack.join('.')] = d2[i]);
						d1.length++;
					}
			
			}

			stack.pop();

			if(!stack.length && !d1.length)
				d1 = false;
			else
				delete d1.length;

			return d1;

		};


		if(typeof callback === 'function' && !data)
		    return this.get(id, function(err, obj) {
		
		  		if (err) {
						 
				 	if(typeof callback !== 'function') throw err;
					 return callback(err);
				}

				
				return callback(null, walk(obj.data));

		  	});
		else if(data) {
			if(typeof callback === 'function')	
				return callback(null, walk(data));
			return walk(data);
		}

    };

	/**
	 * Reload objects
	 *
	 * @param {Function} callback
	 * @return undefined
	 * @api public
	 */

	Store.prototype.reload = function(callback) {
		if(typeof callback === 'function')
			callback();
	};

		if(module.exports)
			module.exports = Store;
		else
			module.Store = Store;

})(typeof module === 'undefined' ? window : module, typeof require === 'undefined' ? undefined : require);