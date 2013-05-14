var Vprogress = require('../base/vprogress');

Vprogress.prototype.write = function(data, callback) {
	this.onReceive(data);
	vrt.Api.DataSet.prototype.write.call(this, data, callback);
};

module.exports = Vprogress;