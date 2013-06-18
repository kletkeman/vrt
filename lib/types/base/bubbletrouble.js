;!(function(module) {

	function Bubbletrouble(fields) {
		
	  fields.bufferSize = Number.MAX_VALUE;

	  vrt.Api.DataSet.call(this, fields);
	};

	Bubbletrouble.required = {};
	
	Bubbletrouble.prototype.format = {
		name : String,
		value : Number,
		unit : String,
		warning : String 
	};

	Bubbletrouble.prototype.__proto__ =  vrt.Api.DataSet.prototype;

	if(module.exports)
		module.exports = Bubbletrouble;
	else
		module.vrt.Api.Bubbletrouble = Bubbletrouble;

})(typeof module === 'undefined' ? window : module);