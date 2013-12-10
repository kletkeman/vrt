var producers = [],
    config    = require('../package.json').configure,
    msgpack   = require("msgpack"),
    net       = require("net"),
    assert    = require("assert"),
    Template  = require("./base").Template;

function Produce(fn, interval, producer) {
    this.fn = fn;
    this.producer = producer;
    this.interval = setInterval(fn.bind(producer), interval);
};

Produce.prototype.destroy = function() {
    clearInterval(this.interval);
};

function Producer(options) {
    options = options || {};
    this.port = options.port;
    this.host = options.host;
    this.stopped = true;
};

function Dashboard(title) {
    
    Template.apply(this);
    
    this.title = title;
    this.sortKey = 0;
};

Dashboard.prototype.__proto__ = Template.prototype;

Dashboard.prototype.add = function(fields) {
    
    var result;
    
    if(result = vrt.create($.extend({}, fields, {sortKey: this.sortKey, group: this.title}), false))
        result.destroy();
    
    this.datasets[this.sortKey++] = result||fields;
    
    return this;
};

Dashboard.prototype.toString = function() {
    return JSON.stringify(this);
};

Dashboard.prototype.submit = function() {
    for(var k in this.datasets)
        if(!(this.datasets[k] instanceof vrt.Api.DataSet))
            vrt.create(this.datasets[k]);
    return this;
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
    
    return this;
};

Producer.prototype.stop = function() {
    this.stopped = true;
    return this;
};

Producer.prototype.write = function(idpath, data) {
    if(this.stopped) return;
    vrt.log.debug("Producer#write()", arguments);
    this.socket.write(msgpack.pack([idpath, data]));
    return this;
};

Producer.prototype.produce = function(fn, interval) {
    
   assert.equal(true, typeof fn === 'function');
   assert.equal(true, typeof interval === 'number');

   producers.push(new Produce(fn, interval, this));
   
    return this;    
};

Producer.prototype.dashboard = function(title) {
    return new Dashboard(title);
};

module.exports = function(Api) {
    Api.prototype.producer = new Producer(config.consumer);
};