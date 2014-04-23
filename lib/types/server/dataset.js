global.Guid = require('guid');

var DataSet  = require('../base/dataset');

DataSet.prototype.onCreate = function(constructor) {
    var context = this;
	if (constructor === DataSet) {
		DataSet.collection[this.id] = this;
        vrt.ipc.on(this.id+'$onSave', function(data, packet) {
            context.save(data, false);
            vrt.log.debug("DataSet#onCreate() Received IPC event", packet, data);
        });
        vrt.ipc.on(this.id+'$onDestroy', this.destroy.bind(this));
    }
    else
        vrt.publish(this.id, 'onCreate', this, this.onError);
};

DataSet.prototype.onError = function(error) {
	if(error instanceof Error) {
		vrt.publish(this.id, 'onError', [error], function(e) {
			vrt.log.error(e);
		});
		vrt.log.error(error);
	}
};

DataSet.prototype.onReceive = function() {
	vrt.publish(this.id, 'onReceive', Array.prototype.slice.call(arguments), this.onError);	
};

DataSet.prototype.onSave = function() {
	
	var data = {}, 
		args = Array.prototype.slice.call(arguments);
	
	if(!args.length)
		return;
	else {
		for(var i = 0, len = args.length; i < len; i++)
			if(typeof args[i] !== 'string')
				throw new Error('Invalid argument');
			else if(typeof this[args[i]] === 'function')
				throw new Error(args[i] + ' is  a function and cannot be overwritten.')
			else
				data[args[i]] = this[args[i]];
        
        data = this.toJSON.call(data);
        
		vrt.publish(this.id, 'onSave', [data], this.onError);
        vrt.ipc.broadcast(this.id+'$onSave', data);
	}

};

DataSet.prototype.destroy = function(data, packet) {
    
    if(DataSet.destroy.apply(this, arguments)) return;
    
    vrt.ipc.removeAllListeners(this.id+'$onSave');
    vrt.ipc.removeAllListeners(this.id+'$onDestroy');
    
    delete vrt.Api.DataSet.collection[this.id];
    
    vrt.log.debug("DataSet#destroy()", packet&&packet.event ? "Received IPC event" : '', packet||'', "Destroyed object", JSON.stringify(this));
    
    if(!packet) {
        vrt.ipc.broadcast(this.id+'$onDestroy', null);
        vrt.publish(this.id, 'onDestroy', {}, this.onError);
    }
    
};

module.exports = {'DataSet' : DataSet};