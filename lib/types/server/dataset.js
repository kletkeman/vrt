/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

define([
      'lib/api'
    , 'lib/types/base/dataset'
    , 'guid'
    , 'debug'
],
function(
       
      vrt
    , DataSet
    , debug
    
) { debug = debug("widget:dataset");
    
    DataSet.prototype.onCreate = function(constructor) {

        var context = this;

        if (constructor === DataSet) {

            return vrt.ipc.on(this.id+'$onSave', function(data, packet) {
                context.save(data, false);
                debug("onCreate() Received IPC event", packet, data);
            }),
            vrt.ipc.on(this.id+'$onDelete', function(data, packet) {
                context.save(data, false);
                debug("onDelete() Received IPC event", packet, data);
            }),
            vrt.ipc.on(this.id+'$onDestroy', this.onDestroy.bind(this));
            
            
        }
        else
            return vrt.publish(this.id, 'onCreate', [this], this.onError);
    };

    DataSet.prototype.onError = function(error) {
        if(error instanceof Error) {
            return vrt.publish(this.id, 'onError', [error], function(e) {
                e && debug("publish error failed with error :", e);
            }),
            debug("error", error);
        }
    };

    DataSet.prototype.onReceive = function() {
        return vrt.publish(this.id, 'onReceive', Array.prototype.slice.call(arguments), this.onError);	
    };

    DataSet.prototype.onSave = function () {

        var data = {}, 
            args = Array.prototype.slice.call(arguments);

        if(!args.length)
            data = this;
        else {
            for(var i = 0, len = args.length; i < len; i++)
                if(typeof args[i] !== 'string')
                    throw new Error('Invalid argument');
                else
                    data[args[i]] = this[args[i]];

            data = this.toJSON.call(data);

        }

        vrt.publish(this.id, 'onSave', [data], this.onError);
        vrt.ipc.broadcast(this.id+'$onSave', data);

    };

    DataSet.prototype.onDelete = function(info) {    
        vrt.publish(this.id, 'onDelete', [info, this], this.onError);
        vrt.ipc.broadcast(this.id+'$onDelete', this);
    };

    DataSet.prototype.onDestroy = function(data, packet) {

        this.destroy();
        
        vrt.ipc.removeAllListeners(this.id+'$onSave');
        vrt.ipc.removeAllListeners(this.id+'$onDestroy');
        vrt.ipc.removeAllListeners(this.id+'$onDelete');

        debug.enabled && debug("onDestroy", packet&&packet.event ? "Received IPC event" : '', packet||'', "Destroyed object", JSON.stringify(this));

        if(!packet) {
            vrt.ipc.broadcast(this.id+'$onDestroy', null);
            vrt.publish(this.id, 'onDestroy', [], this.onError);
        }

    };
    
    return DataSet;

});
