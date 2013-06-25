;!(function(module) {

	function Cubism(fields) {
	  fields.labels = fields.labels || [];
	  vrt.Api.DataSet.call(this, fields);
	};
	
	Cubism.required = {
		labels : Array
	};
	
	Cubism.prototype.format = {
		timestamp : Number,
		value : Number,
		label : String
	};

	Cubism.prototype.__proto__ =  vrt.Api.DataSet.prototype;

	if(module.exports)
		module.exports = Cubism;
	else
		module.vrt.Api.Cubism = Cubism;

})(typeof module === 'undefined' ? window : module);