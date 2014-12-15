/*
    Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

define([], function () {   
    
    return {
        
        Vec2 : function Vec2 (x, y) {
        
            if(Array.isArray(x)) {
                y = x[1];
                x = x[0];
            }

            this.x = this.width  = this[0] = x;
            this.y = this.height = this[1] = y;
        },
    
        Vec4 : function Vec4 (x, y, z, w) {
        
            if(Array.isArray(x)) {
                w = x[3];
                z = x[2];
                y = x[1];
                x = x[0];
            }

            this.x = this[0] = x;
            this.y = this[1] = y;
            this.z = this.width  = this[2] = z;
            this.w = this.height = this[3] = w;
        }
    }

});