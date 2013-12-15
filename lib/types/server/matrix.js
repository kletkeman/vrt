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
    
    var x = 0, xlen = this.size[0];
    var y = 0, ylen = this.size[1];
    var tmax = 10;
    var t = 0;
    
    if(constructor !== vrt.Api.DataSet)
        (function preFill() {    
            
            for(y=y>=ylen?0:y;x<xlen;x++,y=y>=ylen?0:y)
                for(;y<ylen;y++,t++) {
                    vrt.Api.DataSet.prototype.write.call(context, x)(y)({R: 255, G: 255, B: 255}, 
                    (t >= tmax ? function(err) {
                        
                        if(err)
                            throw err;
                        
                        return setImmediate(preFill);
                        
                    } : undefined));
                    if(t >= tmax && (t = 0))
                        break;
                }
        })();
};

module.exports = {'Matrix' : Matrix};