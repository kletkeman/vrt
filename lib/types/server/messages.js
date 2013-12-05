var Messages = require('../base/messages');
	Guid = require('guid');

Messages.prototype.write = function(data, callback) {
	
	var context = this;
	
	data.timestamp = typeof data.timestamp !== 'undefined' ? data.timestamp : +new Date();
	data.seen = typeof data.seen !== 'undefined' ? !!data.seen :  false;
	
	if(Guid.isGuid(data.id)) {
			
		this.verify(data);
		this.update({id: data.id}, data, callback);
	}
	else {
		
		data.id = Guid.create().toString();
	
		this.verify(data);
	
		vrt.Api.DataSet.prototype.write.apply(this, arguments);
	}
};

module.exports = {'Messages' : Messages};