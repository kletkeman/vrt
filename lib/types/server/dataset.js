global.Guid = require('guid');

var DataSet  = require('../base/dataset');

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

DataSet.prototype.onReceive = function() {
	vrt.publish(this.id, 'onReceive', Array.prototype.slice.call(arguments), this.onError);	
};

DataSet.prototype.onSave = function() {
	
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

		vrt.publish(this.id, 'onSave', [data], this.onError);
	}

};

module.exports = DataSet;