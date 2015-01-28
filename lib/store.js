/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

define([
      'jquery'
    , 'lib/api'
],
function (
       
      $
    , vrt
    
) {

	/**
	 * Store constructor.
	 *
	 * @api public
	 */

	function Store () {};

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
			callback(null, instance);
	};
    
    /**
     * Deletes the object configuration and data
     *
     * @param {String} id
     * @param {Function} callback
     * @return undefined
     * @api public
     *    
     */
    
    Store.prototype.destroy = function(id, callback) {
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

	Store.prototype.list = function () {};

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


	/**
	 * Get available types
	 *
	 * @return Array
	 * @api public
	 */

	Store.prototype.typeNames = function() { return []; };
    
  return Store;
    
});
