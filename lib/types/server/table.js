var Table = require('../base/table');

Table.prototype.write = function(data, callback) {
	
	var context = this;
	
	this.verify(data);
		
	this.select({label: data.label}, function(err, found) {
		
		var index = -1;
		
		for(var i in found)
			index = Number(i);

		if(index > -1) {
			
			/*for(var key in data.values)
				if(data.values[key] === null) continue;
				else found[index].values[key] = data.values[key];
				
			data.values = found[index].values;*/
			
			vrt.Api.DataSet.prototype.write.call(context, index)(data, callback);

		}
		else
			vrt.Api.DataSet.prototype.write.call(context, data, callback);

		
	});	

};

module.exports = {'Table' : Table};