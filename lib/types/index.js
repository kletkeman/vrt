global.vrt = {};
global.vrt.Api = {};

vrt.Api.DataSet            = require('./server/dataset');
vrt.Api.Gauge              = require('./server/gauge');
vrt.Api.Graph              = require('./server/graph');
vrt.Api.Curve              = require('./server/curve');
vrt.Api.Pie                = require('./server/pie');
vrt.Api.Messages           = require('./server/messages');
vrt.Api.Ticker             = require('./server/ticker');
vrt.Api.Bubbletrouble      = require('./server/bubbletrouble');
vrt.Api.Hprogress		   = require('./server/hprogress');
vrt.Api.Vprogress          = require('./server/vprogress');
vrt.Api.Stack              = require('./server/stack');

module.exports = vrt.Api;