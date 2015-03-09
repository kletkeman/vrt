/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/

define([
    'lib/adapters/adapter'
    , 'lib/api'
], function (Adapter, vrt) {
    
    const instances = [];
    
    navigator.getUserMedia = (navigator.getUserMedia       || 
                              navigator.webkitGetUserMedia || 
                              navigator.mozGetUserMedia    || 
                              navigator.msGetUserMedia);
    
    navigator.getUserMedia({
            'video' : false,
            'audio' : true
         },        
         function(stream) { 
           
            var audio_context = new AudioContext,
                source        = audio_context.createMediaStreamSource(stream),
                analyser      = audio_context.createAnalyser(),
                adapter, update, i;
            
            analyser.fftSize = 1024;
            
            var bufferLength = analyser.frequencyBinCount,
                timeDomainData = new Uint8Array(bufferLength),
                frequencyData  = new Uint8Array(bufferLength);
        
            source.connect(analyser);
        
            (function run () {
                
                i = 0;
                
                requestAnimationFrame(run);
                
                if(!instances.length) return;
                
                analyser.getByteTimeDomainData(timeDomainData);
                analyser.getByteFrequencyData(frequencyData);
                
                while( (adapter = instances[i++]) ) {
                    
                    update = adapter.selection.getContext("update");
                    
                    for(var j = 0; j < bufferLength; j++) {

                        adapter.set(0, j, 0, timeDomainData[j] - 128);
                        adapter.set(1, j, 0, frequencyData[j]);
                        
                        update(j);

                    }
                }
                
                
            })();
            
         },
         function(error) {  }
       );
    
    function Audio () {
        
        Adapter.apply(this, arguments);
        
        this.name    = "audio";
        this.options = {};
        
        this.set(0, -1, 0, "timeDomainData");
        this.set(1, -1, 0, "frequencyData");
        
        instances.push(this);
    }
    
    Audio.prototype = Object.create(Adapter.prototype);
    
    Audio.prototype.read = function (callback) { 
        if(typeof callback === "function")
            callback();
    }
    
    Audio.prototype.destroy = function () {
        instances.splice(instances.indexOf(this), 1);
    }
    
    return Audio;
})