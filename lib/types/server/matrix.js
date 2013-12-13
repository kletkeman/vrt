var Matrix = require('../base/matrix');

Matrix.prototype.write = function(data, callback) {
    
    this.verify(data);
    
    var x = data.x,
        y = data.y;
    
    delete data.x;
    delete data.y;
    
    vrt.Api.DataSet.prototype.write.call(this, x)(y)(data, callback);
};

Matrix.prototype.onCreate = function(constructor) {
    
    var context = this;
    
    function handle_error(err) {
        if(err) {
            vrt.log.trace();
            throw err;
        }
        
    }
    
    if(constructor !== vrt.Api.DataSet)
        for(var x = 0, xlen = this.size[0]; x < xlen; x++)
            for(var y = 0, ylen = this.size[1]; y < ylen; y++)
                vrt.store.push(x, undefined, this.id, {R: 255, G: 255, B: 255}, handle_error);
    
    vrt.Api.DataSet.prototype.onCreate.apply(this, arguments);
};

module.exports = {'Matrix' : Matrix};