global.vrt = {};
global.vrt.Api = {};

var fs = require("fs"), dir, r;

$.extend(vrt.Api, require('./server/dataset'));

fs.readdirSync(dir = __dirname + '/server/')
    .filter(function(path) {
        return path.indexOf('dataset.js') === -1;
    }).sort()
    .forEach(function(f) {
        $.extend(vrt.Api, require(dir + f));
    });

module.exports = vrt.Api;