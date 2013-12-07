var Cubism = require('../base/cubism'),
	Curve  = require('../base/curve');

Cubism.prototype.write = function() {
    Curve.prototype.write.apply(this, arguments);
};

module.exports = {'Cubism' : Cubism};