var Graph = require('../base/graph');

Graph.prototype.write = function(data, callback) {
	
	var context = this;
	
	this.verify(data);
	
	while(data.values.length > this.labels.length)
		data.values.pop();
		
	this.select({name: data.name}, function(err, found) {
		
		var index = -1;
		
		for(var i in found)
			index = Number(i);

		if(index > -1) {
			
			for(var i = 0, len = data.values.length; i < len; i++)
				if(data.values[i] === null) continue;
				else found[index].values[i] = data.values[i];
				
			data.values = found[index].values;
			
			vrt.Api.DataSet.prototype.write.call(context, index)(data, callback);

		}
		else
			vrt.Api.DataSet.prototype.write.call(context, data, callback);

		
	});
	

};

module.exports = {'Graph' : Graph};