/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

define([], function () {
    
    function Data3 () {
        
        const data  = [],
              length = [0,0,0];
        
        this.clear = function () {
            data.splice(0, data.length);
            this.dimensions(0,0,0);
            return this;
        }
        
        this.dimensions = function (x, y, z) {
            
            if(arguments.length){
                if(typeof x === "number")
                    length[0] = Math.max(0, x);
                if(typeof y === "number")
                    length[1] = Math.max(0, y);
                if(typeof z === "number")
                    length[2] = Math.max(0, z);
            }
               
            return length;
        }
        
        this.get = function (x, y, z) {
         
            x = x || 0;
            y = y || 0;
            z = z || 0;
               
            if(data[z] === undefined)
                return null;
            
            return data[z].get(x,y);
            
        }
        
        this.set = function (x, y, z, value) {
            
            var d2, dimensions2, dxy_changed = 0;
            
            z = z || 0;
            
            d2 = data[z] = data[z] || new Data2();
            
            d2.set(x,y, value);
            
            dimensions2 = d2.dimensions();
            
            x = dimensions2[0];
            y = dimensions2[1];
            
            z = data.length;
            
            if( (dxy_changed |= x > length[0]) )
                length[0] = x;
            if( (dxy_changed |= y > length[1]) )
                length[1] = y;
            if(z > length[2]) length[2] = z;
            
            if(dxy_changed)
                this.forEachSlice(function reapply_dimensions (d2) {
                    d2 && d2.dimensions.apply(d2, length);
                });
            
            return this;
        }
        
        this.row = function (y, z) {
            
            y = y || 0;
            z = z || 0;
            
            if(data[z] === undefined)
                return [];
            
            return data[z].row(y);
           
        }
        
        this.column = function (x, z) {
            
            x = x || 0;
            z = z || 0;
            
            if(data[z] === undefined)
                return [];
            
            return data[z].column(x);
            
        }
        
        this.slice = function () {
            return data.slice.apply(data, arguments);
        }
        
        this.columns = function () {
            
             var z = 0;
            
            if(data[z] === undefined)
                return [];
            
            return data[z].columns();
        }
        
        this.keys = function (z) {
            
            z = z || 0;
            
            if(data[z] === undefined)
                return [];
            
            return data[z].keys();
             
        }
        
        this.forEachSlice = function (accessor) {
            
            var z,
                zlength = length[2];
            
            for(z = 0; z < zlength; z++) {
                if(accessor.call(this, data[z], z) === false) break;
            }
            
            return this;
            
        }
        
        this.forEach = function (accessor) {
            
            var x,y,z,
                xlength = length[0],
                ylength = length[1],
                zlength = length[2],
                keys    = this.keys(),
                columns = this.columns();
            
            for(z = 0; z < zlength; z++) {
                for(y = 0; y < ylength; y++) {
                    for(x = 0; x < xlength; x++) {
                        
                        if(data[z] === undefined)
                            continue;
                        
                        if(accessor.call(this, data[z].get(x,y), x, y, z, columns[x], keys[y], null) === false) return this;
                        
                    }
                }
            } 
            
            return this;
        }
        
        this.toString = function (z) {
            
            z = z || 0;
            
            if(data[z] === undefined)
                return "";
            
            return data[z].toString();
             
        }
        
        this.toDataURL = function (z) {
            
            z = z || 0;
            
            if(data[z] === undefined)
                return "";
            
            return data[z].toDataURL();
             
        }
        
    }
    
    function Data2 () {
        
        const data  = [],
              length = [0, 0];
        
        this.clear = function () {
            data.splice(0, data.length);
            this.dimensions(0,0);
            return this;
        }
        
        this.get = function (x, y) {
            
            var value;
            
            if(typeof x === "string") {
                if( (x = this.columns().indexOf(x)) === -1 )
                    return null;
            }
            
            if(typeof y === "string") {
                if( (y = this.keys().indexOf(y)) === -1 )
                    return null;
            }
            
            x = x || 0;
            y = y || 0;
            
            x += 1;
            y += 1;
            
            data[y] = data[y] || [];
            
            value = x>=data[y].length ? null : data[y][x];
            
            return typeof value === undefined ? null : value;
            
        }
        
        this.set = function (x, y, value) {
            
            var xlength = length[0] + 1;
            
            x = x || 0;
            y = y || 0;
            
            x += 1;
            y += 1;
            
            if(y >= data.length) {
                
                for(var i = data.length; i <= y; i++) {
                    
                    data[i] = new Array(x>xlength?x:xlength);
                    
                    for(var x1 = 0; x1 < xlength; x1++)
                        data[i][x1] = null;
                    
                }
            }
            
            if(x >= data[y].length) {
                
                for(var i = data[y].length; i <= x; i++)
                    data[y][i] = null;
            }
            
            if(typeof value === "object") {
                data[y].splice(x, data[y].length - x);
                data[y] = data[y].concat(Array.prototype.slice.call(value));
            }
            else
                data[y][x] = value;
            
            x = data[y].length - 1;
            y = data.length - 1;
            
            if(x > length[0]) length[0] = x;
            if(y > length[1]) length[1] = y;
            
            return this;
        }
        
        this.dimensions = function (x, y) {
            
            if(arguments.length){
                if(typeof x === "number")
                    length[0] = Math.max(0, x);
                if(typeof y === "number")
                    length[1] = Math.max(0, y);
            }
            
           return length;
        }
        
        this.row = function (y) {
            
            var xlength = length[0] + 1,
                x = 0;
            
            y = y || 0;
            
            y += 1;
            
            if(y>= data.length || data[y] === undefined)
                return null;
            
            return data[y];
        }
        
        this.column = function (x) {
            
            var rows     = [],
                 y       = 0,
                 value, row,
                 ylength = length[1] + 1;
            
            x = x || 0;
            
            x += 1;
            y += 1;
            
            for(; y < ylength; y++) {
                
                if(y>=data.length || (row = data[y]) === undefined) {
                    rows.push(null);
                    continue;
                }
                
                rows.push( x>= row.length || (value = row[x]) === undefined ? null : value);
            }
            
            return rows;
        }
        
        this.forEach = function (accessor) {
            
            var y       = 0,
                x       = 0,
                value, row,
                ylength = length[1] + 1,
                xlength = length[0] + 1,
                keys    = this.keys(),
                columns = this.columns();
            
            for(y = 1; y < ylength; y++) {
                
                xlength = data[y].length;
                
                for(x = 1; x < xlength; x++) {
                    
                    if( y>=data.length || (row = data[y]) === undefined) {
                        value = null;
                    }
                    else if(x < row.length)
                        value = row[x];
                    
                    if( accessor.call(this, (value === undefined ? null : value), columns[x - 1], keys[y - 1], x - 1, y - 1) === false)
                        return this;
                    
                }
            }
            
            return this;
             
        }
        
        this.forEachRow = function (accessor) {
            
            var y       = 0,
                ylength = length[1],
                keys    = this.keys();
            
            for(; y < ylength; y++) {
                if(accessor.call(this, this.row(y), keys[y], y) === false) break;
            }
            
            return this;
             
        }
        
        this.forEachColumn = function (accessor) {
            
            var x       = 0,
                xlength = length[0],
                columns = this.columns();
            
            for(; x < xlength; x++) {
                if(accessor.call(this, this.column(x), columns[x], x) === false) break;
            }
            
            return this;
             
        }
   
    }
    
    function replace_null_with_index (d, i) { return d === null ? i : d; }
    
    Data2.prototype.keys = function () {
        return this.column( -1 ).map(replace_null_with_index);
    }
        
    Data2.prototype.columns = function () {
         return this.row( -1 ).map(replace_null_with_index);
    }
    
    Data2.prototype.toString = function () {
        
        var x, y,
            keys    = this.keys(),
            rows    = [this.columns()],
            str     = "",
            row;
        
        rows[0].unshift(null);
        
        this.forEach(function (value, column, key, x, y) {
            
            row = rows[++y] = rows[y] || [];
            
            if(x === 0) {
                row.push(key);
            }
            
            row.push(value);
            
        });
        
        for(y = 0; y < rows.length; y++) {
            str += rows[y].map(function (d) { return typeof d === "string" ? d.replace(",", "") : d; }).join(",") + "\n";
        }
        
        return str;
            
    }
    
    Data2.prototype.toDataURL = function () {
        return "data:text/csv;base64," + btoa(this.toString())
    }
    
    Data3.Data2 = Data2;
    
    return Data3;
    
})