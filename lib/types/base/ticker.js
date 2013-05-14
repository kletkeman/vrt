;!(function(module) {

	function Ticker(fields) {
		
	  fields.bufferSize = 0;
	  vrt.Api.DataSet.call(this, fields);
	};

	Ticker.required = {
		fontSize : String,
		fontWeight : String,
		fontColor : String
	};

	Ticker.prototype.__proto__ =  vrt.Api.DataSet.prototype;

	if(module.exports)
		module.exports = Ticker;
	else
		module.vrt.Api.Ticker = Ticker;

})(typeof module === 'undefined' ? window : module);