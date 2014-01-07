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
    
    vrt.Api.DataSet.prototype.onCreate.apply(this, arguments);
    
    var context = this;
    
    var xlen = this.size[0];
    var y = 0, ylen = this.size[1];
    var tmax = 10;
    var t = 0;
    var color = 16777215;
    
    if(constructor !== vrt.Api.DataSet)
        (function preFill() {
            
            var completed = 0;
            
            if( y > ylen ) return;
            
            for(var x=0; x<xlen; x++, color-=1)
                vrt.store.push(x, !y ? y : undefined, context.id, {R: (color & (255 << 16)) >> 16, G: (color & (255 << 8)) >> 8, B: color & 255}, function() {
                    if(completed++ === xlen-1)
                        ++y && setImmediate(preFill); 
                });
                    
        })();
};

module.exports = {'Matrix' : Matrix};