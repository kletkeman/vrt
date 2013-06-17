var Stack = require('../base/stack');

Stack.prototype.write = function(data, callback) {
	
	for(var i in this.datasets)
		vrt.write(this.datasets[i].id, data);
		
	
};

module.exports = Stack;