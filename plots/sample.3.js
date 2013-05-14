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
      "width" : "15%",
      "height" : "50%",
      "title": "Memory (MB)",
      "topBoundary" : (function() { for(var mb = 0, len = Math.round(os.totalmem() / 1024 / 1024); mb < len; mb+=100); return mb; })(),
      "description": "Used Memory vs Total Memory",
      "showLabels" : false
    },

    5 : {

      "type": 'vprogress',
      "id" : '8c65c545-ed4c-45ba-a07e-a741882a1f6f',
      "width" : "15%",
      "height" : "50%",
      "title": "CPU load",
      "description": "1 minute CPU load average",
      "showLabels" : false,
      "topBoundary" : 100
    },

    6 : {

      "type": 'graph',
      "id" : '7a37a6b0-365a-4b2e-8ac3-3ffd90c7dc05',
      "width" : "30%",
      "height" : "50%",
      "multiple" : true,
      "labels" : ["1 Minute Average", "5", "15"],
      "title": "CPU load 2",
      "description": "1, 5 and 15 minute CPU load averages",
      "options" : {
        "rgraph" : {
          "chart.labels.above" : true,
          "chart.shadow" : true,
          "chart.key.interactive" : true
        }
      }
    }

});

try {

  var pcap = require('pcap'),
      pcap_session = pcap.createSession('eth0'),
      throughput = {},
      if_addresses = [];

  pcap_session.findalldevs().forEach(function (dev) {
    if (pcap_session.device_name === dev.name)
      dev.addresses.forEach(function (iface) {
        if_addresses.push(iface.addr);
      });
  });

  pcap_session.on('packet', function(raw) {

    var packet = pcap.decode.packet(raw),
        saddr,
        daddr,
        direction,
        len    = packet.pcap_header.len;
    
    if(packet.link.ip && packet.link.ip.tcp) {
      
      daddr  = packet.link.ip.daddr,
      saddr  = packet.link.ip.saddr;

      if(if_addresses && if_addresses.indexOf(daddr) > -1)
        direction = 'in';
      else if(if_addresses && if_addresses.indexOf(saddr) > -1)
        direction = 'out';

      if(direction) {
        throughput[direction] = throughput[direction] || 0;    
        throughput[direction] += len;
      }

    }

  });

  setInterval(function() {

    var total = 0;

    for(var direction in throughput) {

      total += throughput[direction];

      if(!throughput[direction])
        continue;

      if(direction === 'in') {

        vrt.write(Plot.datasets[0].id, {
          'In (kB/s)' : throughput[direction] / 1024 
        });

        vrt.write(Plot.datasets[3].id, {
          'In' : Math.round(throughput[direction] / 1024) + ' kB/s'
        });
      }
      else if(direction === 'out') {
         vrt.write(Plot.datasets[1].id, {
          'Out (kB/s)' : throughput[direction] / 1024
         });
         vrt.write(Plot.datasets[3].id, {
          'Out' : Math.round(throughput[direction] / 1024) + ' kB/s'
         });
      }
      
      throughput[direction] = 0;

    }
    
    vrt.write(Plot.datasets[2].id, {
      'Total (kB/s)' : total / 1024
    });

    vrt.write(Plot.datasets[3].id, {

      "Free  Memory" : Math.round(os.freemem() / 1024 / 1024) + 'MB',
      "CPU Usage" : Math.round(os.loadavg()[0] * 100) + '%',
      "Uptime" : Math.round(os.uptime() / 60 / 60 / 24) + ' days',
      'Total' : Math.round(total / 1024) + ' kB/s'

    });    

    vrt.write(Plot.datasets[4].id, {
      'Used Memory' : Math.round(os.totalmem() / 1024 / 1024) - Math.round(os.freemem() / 1024 / 1024),
      'Free Memory' : Math.round(os.freemem() / 1024 / 1024)
    });

    vrt.write(Plot.datasets[5].id, {
        'CPU Usage' : Math.round(os.loadavg()[0] * 100)
    });

    vrt.write(Plot.datasets[6].id, {
        'CPU Usage' : os.loadavg().map(function(v) { return Math.round(v * 100); })
    });

  }, 1000);

}
catch(err) {
  console.error(Plot.title + ' : ' + err.message);
}

module.exports = Plot;

