var Messages = require('../base/messages');
	Guid = require('guid');

Messages.prototype.write = function(data, callback) {
	
	var context = this;
	
	data.timestamp = typeof data.timestamp !== 'undefined' ? data.timestamp : +new Date();
	data.seen = typeof data.seen !== 'undefined' ? !!data.seen :  false;
	
	if(Guid.isGuid(data.id)) {
			
		this.verify(data);
		this.select({id: data.id}, function(err, found) {
			
			var index = -1;
			
			for(var i in found)
				index = Number(i);
				
			if(index > -1) {
				vrt.Api.DataSet.prototype.write.call(context, index)(data, callback);
				data.__cursor__ = index;
			}
			else
				vrt.Api.DataSet.prototype.write.call(context, data, callback);
				
			context.onReceive(data);
		});
	}
	else {
		
		data.id = Guid.create().toString();
	
		this.verify(data);
		this.onReceive(data);
	
		vrt.Api.DataSet.prototype.write.apply(this, arguments);
	}
};

module.exports = Messages;