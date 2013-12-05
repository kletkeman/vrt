var Ticker = require('../base/ticker');

Ticker.prototype.write = function(data, callback) {
	this.onReceive(data);
	vrt.Api.DataSet.prototype.write.call(this, data, callback);
};

module.exports = {'Ticker' : Ticker};