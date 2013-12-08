var config    = require('../package.json').configure,
    msgpack   = require("msgpack"),
    net       = require("net"),
    cluster   = require("cluster"),
    fs        = require("fs"),
    argv      = require("optimist").argv,
    child_process = require("child_process");


function Consumer(options) {
    
    var context= this;
    
    options = options || {};
    
    this.port = options.port;
    this.workers = [];
    
};

Consumer.prototype.start = function() {
    
    var context = this, dir;
    
    if(this.socket) return;
    
    if(cluster.isWorker || !argv.cluster)
        net.createServer(function (socket) {
            if(context.socket) context.stop();
            context.socket = socket;
            socket.on("data", function(d) {
                d = msgpack.unpack(d);
                vrt.write.apply(vrt, d.concat([function(err) {
                    if(err)
                        socket.write(msgpack.pack(arguments));
                }]));
            });
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
    
    if(this.socket) {
        this.socket.removeAllListeners();
        this.socket.end();
        this.socket.destroy();
    }
    
    while(this.workers.length)
        this.workers.shift().kill();
    
    delete this.socket;
};

module.exports = function(Api) {
    Api.prototype.consumer = new Consumer(config.consumer);
}