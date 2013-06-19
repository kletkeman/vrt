;!(function(module) {

	function Curve(fields) {
	 	fields.labels = fields.labels || [];
		vrt.Api.DataSet.call(this, fields);
	};

	Curve.required = {
		labels : Array
	};
	
	Curve.prototype.format = {
		timestamp : Number,
		value : Number,
		label : String
	};

	Curve.prototype.__proto__ =  vrt.Api.DataSet.prototype;

	if(module.exports)
		module.exports = Curve;
	else
		module.vrt.Api.Curve = Curve;

})(typeof module === 'undefined' ? window : module);