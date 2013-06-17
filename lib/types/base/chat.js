;!(function(module) {

	function Chat(fields) {
	  vrt.Api.DataSet.call(this, fields);
	};

	Chat.required = {};
	
	Chat.prototype.format = {
		nickname : String,
		message : String,
		timestamp : Number
	};

	Chat.prototype.__proto__ =  vrt.Api.DataSet.prototype;

	if(module.exports)
		module.exports = Chat;
	else
		module.vrt.Api.Chat = Chat;

})(typeof module === 'undefined' ? window : module);