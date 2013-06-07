var Stack = require('../base/stack');

Stack.prototype.write = function(data, callback) {
	throw new Error('Can not write data to a stack');
};

module.exports = Stack;