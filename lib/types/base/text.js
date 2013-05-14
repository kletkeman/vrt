;!(function(module) {

	function Text(fields) {
	  vrt.Api.DataSet.call(this, fields);
	};

	Text.required = {
		fontFamily : String,
		fontSize : String,
		fontColor : String
	};

	Text.prototype.__proto__ =  vrt.Api.DataSet.prototype;

	if(module.exports)
		module.exports = Text;
	else
		module.vrt.Api.Text = Text;

})(typeof module === 'undefined' ? window : module);