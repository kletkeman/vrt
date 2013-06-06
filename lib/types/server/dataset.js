global.Guid = require('guid');

var DataSet  = require('../base/dataset');

Object.extend(DataSet.required, {
	read : Function,
	write : Function,
	save : Function
});

DataSet.prototype.onCreate = function() {
	if(arguments.callee.caller !== DataSet)
		vrt.publish(this.id, 'onCreate', this, this.onError);
	else
		DataSet.collection[this.id] = this;
};

DataSet.prototype.onError = function(error) {
	if(error instanceof Error) {
		vrt.publish(this.id, 'onError', error, function(error) {
			console.error(error);
		});
		console.error(error);
	}
};

DataSet.prototype.onReceive = function(data) {
	vrt.publish(this.id, 'onReceive', data, this.onError);	
};

DataSet.prototype.onUpdate = function() {
	
	var data = {}, 
		args = Array.prototype.slice.call(arguments);
	
	if(!args.length)
		return;
	else {
		for(var i = 0, len = args.length; i < len; i++)
			if(typeof args[i] !== 'string')
				throw new Error('Invalid argument');
			else if(typeof this[args[i]] === 'function')
				throw new Error(args[i] + ' is  a function and cannot be overwritten.')
			else
				data[args[i]] = this[args[i]];

		vrt.publish(this.id, 'onUpdate', data, this.onError);
	}

};

DataSet.prototype.read = function(callback) {
	return vrt.get(this.id, function(err, obj) {
		callback(err, obj.data);
	});
};

DataSet.prototype.write = function() {

	var args = Array.prototype.slice.call(arguments),
		x        = args[0],
		data     = args[0],
		callback = args[1],
		context  = this;

	if(typeof x === 'number' && arguments.length === 1)
		return function() { 
			var args = Array.prototype.slice.call(arguments),
				y        = args[0],
				data     = args[0],
				callback = args[1];

			if(typeof y === 'number' && arguments.length === 1)
				return function(data, callback) {
					return vrt.push(x)(y)(context.id, data, callback);
				};

			return vrt.push(x)(context.id, data, callback);
		};

	return vrt.push(this.id, data, callback);
};

DataSet.prototype.save = function(callback) {
	return vrt.save(this.id, callback);
};

module.exports = DataSet;