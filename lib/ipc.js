var EventEmitter = require("events").EventEmitter,
    cluster      = require("cluster"),
    Guid         = require("guid"),
    crypto       = require("crypto");

function Message(cmd, body) {
    
    if(cluster.isWorker)
        this.workerId = cluster.worker.id;
    
    this.id       = Guid.create();
    this.command  = cmd;
    this.body     = body;
};

function Broadcast() {
    Message.apply(this, arguments);
    this.broadcast = true;
};

Broadcast.prototype.__proto__ = Message.prototype;

function IPC() {
    
    var wrk, context = this, 
        handle = context.handle.bind(context);
    
    if(cluster.isMaster) {
        for(var id in (wrk = cluster.workers) ) {
            wrk[id].on("message", handle);
        }
        
        cluster.on('fork', function(worker) {
            worker.on("message", handle);
        });

    }
    else if(cluster.isWorker)
        process.on("message", handle);
    
    
};

IPC.prototype.__proto__ = EventEmitter.prototype;

IPC.prototype.send = function() {
    
    var args = Array.prototype.slice.call(arguments), msg;
    
    if(cluster.isMaster) {
        
        if(args.length < 2)
            throw new Error("Wrong number of arguments");
        
        cluster.workers[Number(args.shift())].send(msg = new Message(String(args.shift()), args.shift()));
    }
    else if(cluster.isWorker) {
        
        if(args.length < 1)
            throw new Error("Wrong number of arguments");
        
        process.send(msg = new Message(String(args.shift()), args.shift()));
    }
    
    return msg;
};

IPC.prototype.broadcast = function(cmd, body) {
    
    var bcast = new Broadcast(String(cmd), body);
    
    if(cluster.isMaster) {
        var wrk;
        for(var id in (wrk = cluster.workers) )
            wrk[id].send(bcast);
    }
    else if(cluster.isWorker)
        process.send(bcast);
    
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
    else
        this.emit(msg.command, msg.body, msg);
        
};

IPC.convert = function() {
    
    var args = Array.prototype.slice.call(arguments), item, name, sync,
        guid = '';
    
    while(args.length && (item = args.shift()) ) {
        
        if(typeof item === 'object') {
            name = item.name,
            sync = !!item.sync;
        }
        else 
            name = item;
        
        var fn = this[name].toString();
        
            eval('this.' + '__'+name+' = function() {                                     \n' +
            '                                                                             \n' +
            '    var fn = ' + fn + ';                                                     \n' +
            '                                                                             \n' +
            '    var args = Array.prototype.slice.call(arguments[0]),                     \n' +
            '        packet = arguments[1], context = this;                               \n' +
            '                                                                             \n' +
            '    if(packet && packet.workerId) {                                          \n' +
            (!sync ?      
            '       args.push(function() {                                                \n' +
            '                context.send(packet.workerId, packet.id, arguments);         \n' +
            '            });                                                              \n' +
            '       fn.apply(this, args);                                                 \n' :
             
            '       context.send(packet.workerId, packet.id, fn.apply(this, args));      \n') +
                 
            '                                                                             \n' +
            '    }                                                                        \n' +
            '    else                                                                     \n' +    
            '        return fn.apply(this, arguments);                                    \n' +
            '                                                                             \n' +
            '};                                                                           \n' +
            '                                                                             \n' +
            'this.'+name+' = function '+guid+'$IPC$Store$__'+name+'() {                            \n' +
            '                                                                             \n' +
            '    var args = Array.prototype.slice.call(arguments),                        \n' +
            '    callback = args.pop();                                                   \n' +
            '                                                                             \n' +
            '   if(typeof callback !== \'function\')                                         \n' +
            (!sync ? 
            '       throw new Error("No callback provided");                            \n' :
            '       callback = function() {};                                            \n') +
            '                                                                             \n' +
            '   if(cluster.isWorker) {                                                       \n' +
            '      this.once(this.send(arguments.callee.name, args).id, function() {   \n' +
            (!sync ? 
            '           var args = []; for(var k in arguments[0]) args[k] = arguments[0][k];        \n' +
            '           callback.apply(this, args);                                              \n' :
            '           callback.call(this, arguments[0]);                                  \n') + 
            '       });                                                                      \n' +
            '   }                                                                            \n' +
            '   else return this.__'+name+'.apply(this, arguments);                        \n' +
            '};                                                                           \n' + 
            'this.on(\''+guid+'$IPC$Store$__'+name+'\', this.' + '__'+name+');                     \n');
        
        
        }
        
};

module.exports = IPC;