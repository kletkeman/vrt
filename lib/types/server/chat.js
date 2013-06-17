var Chat = require('../base/chat');

Chat.prototype.write = function(data, callback) {
	
	if(typeof data.timestamp !== 'number')
		data.timestamp = +new Date();
	
	this.verify(data);
	vrt.Api.DataSet.prototype.write.call(this, data, callback);
	this.onReceive(data);
	
};

module.exports = Chat;