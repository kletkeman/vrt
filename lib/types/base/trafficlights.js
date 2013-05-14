;!(function(module) {

	function Trafficlights(fields) {
		
	  fields.bufferSize = 0;

	  vrt.Api.DataSet.call(this, fields);
	};

	Trafficlights.required = {};

	Trafficlights.prototype.__proto__ =  vrt.Api.DataSet.prototype;

	if(module.exports)
		module.exports = Trafficlights;
	else
		module.vrt.Api.Trafficlights = Trafficlights;

})(typeof module === 'undefined' ? window : module);