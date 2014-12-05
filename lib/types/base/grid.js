/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/


define([
    'types/dataset'
],
function(
    DataSet
) {

	function Grid (fields) {
        
        fields.bufferSize = Infinity;
        
        DataSet.call(this, fields);
    };
    
    Grid.prototype.delete = function() {
        
        var context = this, args = Array.prototype.slice.call(arguments), callback = args.pop();

        if(typeof callback !== 'function') 
          args.push(callback);

        return DataSet.prototype.delete.apply(this, args.concat([
            
            function(err, info) {

                  var columns = [];

                  if(!info.path) {

                      info.affected = info.affected.map(function(r) { return r.label; });                    
                      context.rows = context.rows.filter(function(r) { return info.affected.indexOf(r.text) === -1; });
                  }
                  else if(info.path) {

                      info.affected.forEach(function(c) {
                          for(var k in c.values) {
                              if(columns.indexOf(k) < 0)
                                  columns.push(k);
                          }
                      });

                      context.columns = context.columns.filter(function(c) { return columns.indexOf(c.text) > -1; });
                  }

                  if(typeof callback === 'function')
                      return callback.apply(context, arguments);
          }]));


      };
    
    Grid.required = {
      '(columns)' : Object,
      '(defaults)' : {
          '(row)'    : Object,
          '(column)' : Object
      }
    };

    Grid.prototype.format = {
      label : String,
      values : Object
    };

    Grid.prototype.__proto__ =  DataSet.prototype;

    return Grid;

});
