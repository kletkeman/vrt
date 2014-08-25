define(['types/dataset', 'lib/types/base/mail', 'guid'], function (DataSet, Mail, Guid) {

    Mail.prototype.write = function(data, callback) {
        
        data.timestamp = data.timestamp || (new Date()).getTime();
        data.attachments = Array.isArray( data.attachments ) &&  data.attachments ?  data.attachments : [];
        data.id = data.id || Guid.create().toString();
        
        this.verify(data);
        
        return DataSet.prototype.write.call(this, data, callback);
    };
    
    return Mail;

});
