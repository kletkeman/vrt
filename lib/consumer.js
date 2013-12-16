var config    = require('../package.json').configure,
    msgpack   = require("msgpack"),
    net       = require("net"),
    cluster   = require("cluster"),
    fs        = require("fs"),
    argv      = require("optimist").argv,
    child_process = require("child_process");


function Consumer(options) {
        
    options = options || {};
    
    this.port = options.port;
    this.workers = [];
    this.sockets = [];
    
    process.on('exit', function() {
        while(this.workers.length)
            this.workers.shift().kill();
    }.bind(this));
    
};

Consumer.prototype.start = function() {
    
    var context = this, dir;
    
    if(this.server) return;
    
    if(cluster.isWorker || !argv.cluster)
        this.server = net.createServer(function (socket) {
            
            socket.ms = new msgpack.Stream(socket);
            socket.ms.on('msg', function(d) {
                vrt.write.apply(vrt, d.concat([function(err) {
                    if(err)
                        socket.write(msgpack.pack({0: err.message}));
                }]));
            });
            
            socket.once("close", function socketCloseEvent() {
                socket.ms.removeAllListeners();
                socket.removeAllListeners();
                var sockets = [], s;
                while(context.sockets.length) {        
                    if((s = context.sockets.shift()) !== socket)
                        sockets.push(s);
                }
                context.sockets = sockets;
                vrt.log.debug("Consumer#start()#socketCloseEvent()");
            });
            
            context.sockets.push(socket);
            
        }).listen(config.consumer.port);
    
    function producers() {
        fs.readdirSync(dir = __dirname + '/../producers/').sort().forEach(function(p) {
            var child;
            context.workers.push(child = child_process.fork(dir + p));
            vrt.log.info('producer[', child.pid, '] is now online');
        });
    };
    
    if(cluster.isMaster && !argv.cluster)
        return producers();
    else if (cluster.isWorker)
        cluster.once("listening", producers);
};

Consumer.prototype.stop = function() {
    
    if(this.server)
        this.server.close(function serverCloseEvent() {
            vrt.log.debug("Consumer#start()#serverCloseEvent()");
        });
    
    while(this.workers.length)
        this.workers.shift().kill();

    var socket;
    while(this.sockets.length && (socket = this.sockets.shift())) {
        socket.removeAllListeners();
        socket.ms.removeAllListeners();
        socket.end();
        socket.destroy();
        delete socket.ms;
    }
    
    this.server.removeAllListeners();
    
    delete this.server;
};

module.exports = function(Api) {
    Api.prototype.consumer = new Consumer(config.consumer);
}