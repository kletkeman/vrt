var Hprogress = require('../base/hprogress');

Hprogress.prototype.write = function(data, callback) {
	vrt.Api.DataSet.prototype.write.call(this, data, callback);
	this.onReceive(data);
};

module.exports = {'Hprogress' : Hprogress};