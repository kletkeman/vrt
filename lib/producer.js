var producers = [],
    config    = require('../package.json').configure,
    msgpack   = require("msgpack"),
    net       = require("net"),
    assert    = require("assert")

function Produce(fn, interval, write) {
    this.fn = fn;
    this.interval = setInterval(function() {
        fn(this.write);
    }.bind(this), interval);
    this.write = write;
};

Produce.prototype.destroy = function() {
    clearInterval(this.interval);
};

function Producer(options) {
    options = options || {};
    this.port = options.port;
    this.host = options.host;
};

Producer.prototype.start = function() {
    
    var context = this;
    
    if(!this.socket) {
        this.socket = net.connect(this,
            function() {
                context.stopped = false;
            });
        this.socket.on('data', function(d) {
            d = msgpack.unpack(d);
            vrt.log.error(d);
        });
    }
    else
        this.stopped = false;
};

Producer.prototype.stop = function() {
    this.stopped = true;
};

Producer.prototype.write = function(idpath, data) {
    this.socket.write(msgpack.pack([idpath, data]));
};

Producer.prototype.produce = function(fn, interval) {
    
       assert.equal(true, typeof fn === 'function');
       assert.equal(true, typeof interval === 'number');
    
       producers.push(new Produce(fn, interval, this.write.bind(this)));
       
        return this;    
    };

module.exports = function(Api) {
    Api.prototype.producer = new Producer(config.consumer);
};