var Graph = require('../base/graph');

Graph.prototype.write = function(data, callback) {

	for(var key in data)
		if(this.multiple && !(data[key] instanceof Array))
			throw new Error('Value `'+key+'` is not [Array]');
		else if(!this.multiple && typeof data[key] !== 'number')
			throw new Error('Value `'+key+'` is not [Number]');

	vrt.Api.DataSet.prototype.write.call(this, data, callback);
	this.onReceive(data);

};

module.exports = Graph;