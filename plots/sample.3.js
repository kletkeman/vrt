var Base = require('../lib/base'),
    Plot = new Base.Template,
    os   = require('os');

Object.extend(Plot, {

  title: 'Sample Plot 3',
  createdBy: 'Odd Marthon Lende',
  creationDate: '2012-10-10T12:10Z'

});

Object.extend(Plot.datasets, {

    0 : {

      "type": "curve",
      "id" : '8083a89e-c286-4b38-bfef-702f041253e3',
      "height": "25%",
      "width": "30%",
      "title": "Network Inbound (kB/s)",
      "description": "Inbound Network Traffic Speed",
      "unit" : "seconds",
      "resolution": 1 / 24 / 60 * 5,
      "options" : {
        "rgraph" : {
          "chart.filled" : true,
          "chart.colors" : ['#F3F781'],
          "chart.fillstyle" : ['#F2F5A9'],
          'chart.linewidth' : 1
        }
      }
    },

    1 : {

      "type": "curve",
      "id" : '58a9947d-0db1-4753-b5e3-87c190a5d385',
      "height": "25%",
      "width": "30%",
      "title": "Network Outbound (kB/s)",
      "description": "Outbound Network Traffic Speed",
      "unit" : "seconds",
      "resolution": 1 / 24 / 60 * 5,
      "options" : {
        "rgraph" : {
          "chart.filled" : true,
          "chart.colors" : ['#9FF781'],
          "chart.fillstyle" : ['#CEF6EC'],
          "chart.linewidth" : 1
        }
      }
    },

    2 : {

      "type": "curve",
      "id" : 'c85bd096-8903-4d02-88fc-0fbcfeda542d',
      "height": "25%",
      "width": "30%",
      "title": "Network Total (kB/s)",
      "description": "Total Network Traffic Speed",
      "unit" : "seconds",
      "resolution": 1 / 24 / 60 * 5,
      "options" : {
        "rgraph" : {
          "chart.filled" : true,
          "chart.colors" : ['#9FF781'],
          "chart.fillstyle" : ['#CEF6EC'],
          "chart.linewidth" : 1
        }
      }
    },

    3 : {
      "type": 'ticker',
      "id" : '38fecf7c-2956-4034-bc15-6d533a26ef26',
      "height" : "25%",
      "width" : "12%",
      "title": "Computer Information",
      "description": "Information returned by the operating system.",
      "fontSize": "10pt",
      "fontColor" : "#000000",
      "fontWeight" : "bold",
      "data" : {
        "Hostname" : os.hostname(),
        "Uptime" : null,
        "Total Memory" : Math.round(os.totalmem() / 1024 / 1024) + 'MB',
        "Free  Memory" : null,
        "CPU Usage" : null,
        "In" : null,
        "Out" : null,
        "Total" : null


      }
    },

    4 : {

      "type": 'vprogress',
      "id" : '91d7b990-25a8-4276-9364-5a8c7925b163',
      "width" : "20%",
      "height" : "50%",
      "title": "Memory (MB)",
      "topBoundary" : (function() { for(var mb = 0, len = Math.round(os.totalmem() / 1024 / 1024); mb < len; mb+=100); return mb; })(),
      "description": "Used Memory vs Total Memory",
      "showLabels" : true,
      "options" : {
        "rgraph" : {
          "chart.gutter.right" : 215,
          "chart.gutter.bottom" : 5,
          "chart.key.position.x" : 150
        }
      }
    },

    5 : {

      "type": 'vprogress',
      "id" : '8c65c545-ed4c-45ba-a07e-a741882a1f6f',
      "width" : "15%",
      "height" : "50%",
      "title": "CPU load",
      "description": "1 minute CPU load average",
      "showLabels" : false,
      "topBoundary" : 100,
      "options" : {
        "rgraph" : {
          "chart.gutter.bottom" : 5
        }
      }
    },

    6 : {

      "type": 'graph',
      "id" : '7a37a6b0-365a-4b2e-8ac3-3ffd90c7dc05',
      "width" : "65%",
      "height" : "50%",
      "multiple" : true,
      "labels" : ["1 Minute Average", "5", "15"],
      "title": "CPU load 2",
      "description": "1, 5 and 15 minute CPU load averages",
      "options" : {
        "rgraph" : {
          "chart.labels.above" : true,
          "chart.shadow" : true,
          "chart.key.interactive" : true,
          "chart.text.size" : 10,
          "chart.gutter.bottom" : 55
        }
      }
    },

    7 : {

      "type": 'gauge',
      "id" : 'd6f7007a-cdcd-11e2-9523-db65f68810d5',
      "width" : "25%",
      "height" : "20%",
      "min" : 0,
      "max" : 100,
      "title": "CPU load 3",
      "description": "CPU load",
      "options" : {
        "rgraph" : {
          "chart.text.size" : 8,
          "chart.title.top.pos": 0.15,
          "chart.title.size" : 8
        }
      }
    },

    8: {

      "type": 'gauge',
      "id" : '604df2d4-cdce-11e2-a715-83c718705c79',
      "width" : "25%",
      "height" : "20%",
      "min" : 0,
      "max" : 100,
      "title": "Net In Mbit\\s",
      "description": "Network Bandwidth Incoming",
      "options" : {
        "rgraph" : {
          "chart.text.size" : 8,
          "chart.title.top.pos": 0.15,
          "chart.title.size" : 8
        }
      }
    },

    9 : {

      "type": 'gauge',
      "id" : '6098647c-cdce-11e2-aeab-ef2b3978312c',
      "width" : "25%",
      "height" : "20%",
      "min" : 0,
      "max" : 100,
      "title": "Net Out kB\\s",
      "description": "Network Bandwidth Outgoing",
      "options" : {
        "rgraph" : {
          "chart.text.size" : 8,
          "chart.title.top.pos": 0.15,
          "chart.title.size" : 8
        }
      }
    },

    10 : {

      "type": 'gauge',
      "id" : '612d5014-cdce-11e2-ab74-435da7c8812a',
      "width" : "25%",
      "height" : "20%",
      "min" : 0,
      "max" : 100,
      "title": "Net Total Mbit\\s",
      "description": "Total Network Bandwidth",
      "options" : {
        "rgraph" : {
          "chart.text.size" : 8,
          "chart.title.top.pos": 0.15,
          "chart.title.size" : 8
        }
      }
    }

});

module.exports = Plot;

