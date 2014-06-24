define(['types/dataset', 'lib/types/base/fastcurve'], function (DataSet, FastCurve) {

    FastCurve.prototype.write = function(data, callback) {

        data.timestamp = data.timestamp ? data.timestamp : +new Date();

        this.verify(data);

        var index = this.labels.indexOf(data.label),
            label = data.label,
            context = this;

        delete data.label;

        if( index   === -1) {

            this.labels.push(label);
            this.save();

            DataSet.prototype.write.call(context, context.labels.length - 1)(0)(data, callback);

        }
        else
            DataSet.prototype.write.call(this, index)(data, callback);

    };

    return FastCurve;
    
});
