var Donut = require('../base/donut');

Donut.prototype.write = function(data, callback) {
	
	var context = this;
	
	this.verify(data);		
	this.update({label: data.label}, data, callback);		
};

module.exports = {'Donut' : Donut};