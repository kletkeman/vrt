/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

var requirejs = require('requirejs'),
    path      = require('path'),
    argv      = require('optimist').argv;

requirejs.config({
    'baseUrl': path.resolve(__dirname, '../'),
    'shims' : {
      'jquery' : {
        'exports' : '$'
      }
    },
    'paths' : {
        'types'   : 'lib/types/server',
        'jquery'  : 'deps/jquery'
    },
    'nodeRequire': require
});

requirejs(argv.filename);
