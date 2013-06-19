var Curve = require('../base/curve');

Curve.prototype.write = function(data, callback) {
	
	data.timestamp = typeof data.timestamp !== 'undefined' ? data.timestamp : +new Date();
	
	this.verify(data);
	
	var index = this.labels.indexOf(data.label),
		label = data.label;
	
	delete data.label;
	
	if( index   === -1) {
	
		this.labels.push(label);
		this.save({labels: this.labels});
		
		vrt.Api.DataSet.prototype.write.call(this, this.labels.length - 1)(0)(data, callback);
	}
	else
		vrt.Api.DataSet.prototype.write.call(this, index)(data, callback);
	
	data.__cursor__ = index === -1 ? 0 : index;
	this.onReceive(data);

};

module.exports = Curve;