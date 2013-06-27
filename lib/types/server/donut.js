var Donut = require('../base/donut');

Donut.prototype.write = function(data, callback) {
	
	var context = this;
	
	this.verify(data);
		
	this.select({label: data.label}, function(err, found) {
		
		var index = -1;
		
		for(var i in found)
			index = Number(i);

		if(index > -1)
			vrt.Api.DataSet.prototype.write.call(context, index)(data, callback);
		else
			vrt.Api.DataSet.prototype.write.call(context, data, callback);

		
	});		
};

module.exports = Donut;