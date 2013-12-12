require('../vrt')

vrt.producer
.produce(function() {
    //this.write('214180a0-632a-11e3-a794-f30b4e0eede7', {value: new Date()})
}, 1000)
.produce(function() {
    //this.write('path.in.routing.tree', {value: new Date()})
}, 1000)//.start();