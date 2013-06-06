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
	 * @param {Object} data
	 * @param {Function} callback
	 * @return undefined
	 * @api public
	 */

	Store.prototype.publish = function(id, eventHandlerName, data, callback) { };

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
	 * @param {String} id
	 * @param {Function} callback
	 * @return undefined
	 * @api public
	 */

	Store.prototype.save = function(id, callback) { 
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