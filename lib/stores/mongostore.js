var Store = require('../store'),
	mongodb = require('mongodb');

var MongoStore = function(options) {

};

MongoStore.prototype.__proto__ = Store.prototype;

module.exports = MongoStore;

MongoStore.prototype.get = function(id, callback) {

	var error, obj = vrt.Api.DataSet.collection[id];

	if(typeof obj === 'undefined')
		error = new Error('Object with `id` ['+id+'] does not exist.');

	if(typeof callback === 'function')
		callback(error, obj);
	else if(error)
		throw error;

	return obj;
};