define(['types/dataset', 'lib/types/base/grid'], function (DataSet, Grid) {

    Grid.prototype.write = function(data, callback) {

        var context = this;

        //this.verify(data);

        this.select({label: data.label}, function(err, found) {

            var index = -1;

            for(var i in found)
                index = Number(i);

            if(index > -1)
                DataSet.prototype.write.call(context, index)(data, callback);
            else
                DataSet.prototype.write.call(context, data, callback);

        });	

    };
    
    return Grid;

});
