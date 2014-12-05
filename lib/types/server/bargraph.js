/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

define([
      'types/dataset'
    , 'lib/types/base/bargraph'
],
function (
       
      DataSet
    , BarGraph

) {

    BarGraph.prototype.write = function(data, callback) {

        var context = this;

        //this.verify(data);

        this.select({label: data.label}, function(err, found) {

            var index = -1;

            for(var i in found)
                index = Number(i);

            if(index > -1) {
                
                data.peak = BarGraph.Peak.prototype.set.call(found[index].peak || new BarGraph.Peak(), data.value, data.value);
                
                DataSet.prototype.write.call(context, index)(data, callback);
            }
            else
                DataSet.prototype.write.call(context, data, callback);

        });	

    };
    
    return BarGraph;

});
