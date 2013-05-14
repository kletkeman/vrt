var Trafficlights = require('../base/trafficlights');

Trafficlights.prototype.write = function(data, callback) {
	vrt.Api.DataSet.prototype.write.call(this, data, callback);
	this.onReceive(data);
};

module.exports = Trafficlights;