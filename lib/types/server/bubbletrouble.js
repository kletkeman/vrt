var Bubbletrouble = require('../base/bubbletrouble');

Bubbletrouble.prototype.write = function(data, callback) {
	
	var context = this;
	
	data.warning = typeof data.warning === 'undefined' ? '' : data.warning;
	
	this.verify(data);
	this.update({name: data.name}, data, callback);
	
};

module.exports = {'Bubbletrouble' : Bubbletrouble};