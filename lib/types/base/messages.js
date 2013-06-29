;!(function(module) {

	function Messages(fields) {
	  fields.step = 0;
	  vrt.Api.DataSet.call(this, fields);
	};

	Messages.required = {
		fontFamily : String,
		fontSize : String,
		fontColor : String
	};

	Messages.prototype.format = {
		id : String,
		title : String,
		text : String,
		timestamp : Number,
		seen : Boolean
	};

	Messages.prototype.__proto__ =  vrt.Api.DataSet.prototype;

	if(module.exports)
		module.exports = Messages;
	else
		module.vrt.Api.Messages = Messages;

})(typeof module === 'undefined' ? window : module);