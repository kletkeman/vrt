global.vrt = {};
global.vrt.Api = {};

vrt.Api.DataSet            = require('./server/dataset');
vrt.Api.Gauge              = require('./server/gauge');
vrt.Api.Graph              = require('./server/graph');
vrt.Api.Curve              = require('./server/curve');
vrt.Api.Pie                = require('./server/pie');
vrt.Api.Text               = require('./server/text');
vrt.Api.Ticker             = require('./server/ticker');
vrt.Api.Trafficlights      = require('./server/trafficlights');
vrt.Api.Hprogress		   = require('./server/hprogress');
vrt.Api.Vprogress          = require('./server/vprogress');

module.exports = vrt.Api;