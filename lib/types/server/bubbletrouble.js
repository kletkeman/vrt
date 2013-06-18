var Bubbletrouble = require('../base/bubbletrouble');

Bubbletrouble.prototype.write = function(data, callback) {
	
	var context = this;
	
	data.warning = typeof data.warning === 'undefined' ? '' : data.warning;
	
	this.verify(data);
	this.select({name: data.name}, function(err, found) {
		
		var index = -1;
		
		for(var i in found) 
			index = Number(i);
		
		if(index > -1) {
			data.__cursor__ = index;
			vrt.Api.DataSet.prototype.write.call(context, index)(data, callback);
		}
		else
			vrt.Api.DataSet.prototype.write.call(context, data, callback);
		
		context.onReceive(data);
	});
	
};

module.exports = Bubbletrouble;