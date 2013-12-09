var EventEmitter = require("events").EventEmitter,
    cluster      = require("cluster"),
    Guid         = require("guid");

function Message(event, body) {
    
    if(cluster.isWorker)
        this.workerId = cluster.worker.id;
    
    this.id       = Guid.create();
    this.event  = event;
    this.body     = body;
};

function Broadcast() {
    Message.apply(this, arguments);
    this.broadcast = true;
};

Broadcast.prototype.__proto__ = Message.prototype;

function IPC() {
    
    var wrk, context = this;
    
    this._handlebound = context.handle.bind(context);
    
    if(cluster.isMaster) {
        for(var id in (wrk = cluster.workers) ) {
            wrk[id].on("message", this._handlebound);
        }
        
        cluster.on('fork', function(worker) {
            worker.on("message", context._handlebound);
        });

    }
    else if(cluster.isWorker)
        process.on("message", this._handlebound);
    
    this.instanceId = Guid.create();
};

IPC.prototype.__proto__ = EventEmitter.prototype;

IPC.prototype.destroy = function() {
    if(cluster.isMaster)
        for(var id in (wrk = cluster.workers) )
            wrk[id].removeListener("message", this._handlebound);
    process.removeListener("message", this._handlebound);
    this.removeAllListeners();
    
     vrt.log.debug("IPC#destroy()", this.instanceId);
};

IPC.prototype.send = function() {
    
    var args = Array.prototype.slice.call(arguments), msg;
    
    if(cluster.isMaster) {
        
        if(args.length < 2)
            throw new Error("Wrong number of arguments");
        
        cluster.workers[Number(args.shift())].send(msg = new Message(args.shift(), args.shift()));
    }
    else if(cluster.isWorker) {
        
        if(args.length < 1)
            throw new Error("Wrong number of arguments");
        
        process.send(msg = new Message(args.shift(), args.shift()));
    }
    
     vrt.log.debug("IPC#send()", msg);
    
    return msg;
};

IPC.prototype.broadcast = function(event, body) {
    
    var bcast = new Broadcast(event, body);
    
    if(cluster.isMaster) {
        var wrk;
        for(var id in (wrk = cluster.workers) )
            wrk[id].send(bcast);
    }
    else if(cluster.isWorker)
        process.send(bcast);
    
    vrt.log.debug("IPC#broadcast()", bcast);
    
    return bcast;
};


IPC.prototype.handle = function(msg) {
    
    if(msg.broadcast && cluster.isMaster && msg.workerId) {
        var wrk;
        for(var id in (wrk = cluster.workers) ) {
            if(msg.workerId == id)
                continue;
            wrk[id].send(msg);
        }
        
    }
    
    this.emit(msg.event, msg.body, msg);  
    
    vrt.log.debug("IPC#handle()", msg);
        
};

IPC.convert = function() {
    
    var args = Array.prototype.slice.call(arguments), item,
        constructor = this.constructor.name;
    
    while(args.length && (item = args.shift()) ) {
        
        (function(context, item) {
            
            var sync, name;
            
            if(typeof item === 'object') {
                name = item.name,
                sync = !!item.sync;
            }
            else 
                name = item;
            
            var fn = context[name],
                identifier = IPC.define((constructor+'$IPC$Store$__'+name).toUpperCase());
            
            context['__'+name] = function() {
                
                 var args = Array.prototype.slice.call(arguments[0]),
                    packet = arguments[1], context = this;
                 
                if(packet && packet.workerId) {
                    if(!sync) {     
                        args.push(function() {
                             context.send(packet.workerId, packet.id, arguments);
                        }); 
                        fn.apply(this, args);
                    }
                    else 
                        this.send(packet.workerId, packet.id, fn.apply(this, args));
                 }
                else  
                    return fn.apply(this, arguments);
            };
            
            context[name] = function () {
            
                var args = Array.prototype.slice.call(arguments),
                    callback = args.pop();
            
                if(typeof callback !== 'function')
                    if(!sync)
                        throw new Error("No callback provided");
                    else
                        callback = function() {};
                
                if(cluster.isWorker) {
                    context.once(this.send(identifier, args).id, function() {
                        if(!sync) { 
                            var args = []; for(var k in arguments[0]) args[k] = arguments[0][k];
                            callback.apply(context, args);
                        }
                        else 
                            callback.call(context, arguments[0]); 
                    });
                }
                else return this['__'+name].apply(this, arguments);
            };
            
            if(cluster.isMaster)
                context.on(identifier, context['__'+name].bind(context));
        
        
        })(this, item);
        
        
    }
        
};

IPC.define = function(name, number) {
    
    const code = typeof number === 'number' ? number : IPC.ceil++;
    
    if(number > IPC.ceil) 
        IPC.ceil = number;
    
    return (global[name] = IPC.events[name] = code);
};
IPC.events = {};
IPC.ceil = 0x0;

module.exports = function(Api) { Api.IPC = IPC; Api.prototype && (Api.prototype.ipc = new IPC());};