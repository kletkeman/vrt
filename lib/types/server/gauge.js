var Gauge = require('../base/gauge');

Gauge.prototype.write = function(data, callback) {

	if(typeof data.value === 'undefined')
		throw new Error('Required property "value" is missing');
	else if(typeof data.value !== 'number')
		throw new Error('Property "value" is not a number');
	
	vrt.Api.DataSet.prototype.write.call(this, data, callback);
	this.onReceive(data);
};

module.exports = Gauge;