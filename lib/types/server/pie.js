var Pie = require('../base/pie');

Pie.prototype.write = function(data, callback) {
	vrt.Api.DataSet.prototype.write.call(this, data, callback);
	this.onReceive(data);
};

module.exports = Pie;