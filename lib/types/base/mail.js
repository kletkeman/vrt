define(['types/dataset'], function(DataSet) {

	function Mail(fields) {
        
        fields.bufferSize = fields.bufferSize || Infinity;

        DataSet.call(this, fields);
	
    };
  
    Mail.prototype.delete = function() {

        var context = this, args = Array.prototype.slice.call(arguments), callback = args.pop();

        if(typeof callback !== 'function') 
            args.push(callback);

        return DataSet.prototype.delete.apply(this, args.concat([
          function(err, info) {
                if(typeof callback === 'function')
                    return callback.apply(context, arguments);
          }
        ]));


    };

    Mail.required = {};

    Mail.prototype.format = {
        from        : String,
        subject     : String,
        timestamp   : Number,
        body        : String,
        attachments : Array
    };

    Mail.prototype.__proto__ =  DataSet.prototype;

    return Mail;

});
