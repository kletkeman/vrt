define([], function () {
    
    function frequency (label) {

        var memory, date;

        function start () {
            return (date.getMinutes() % 2) * 60;
        };

        if(!Object.getOwnPropertyDescriptor(this, label)) {

            memory = new Array(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0), 
            date      = new Date();

            Object.defineProperty(this, label, {

                enumerable : false,
                configurable : false,
                value : {

                    average : function average (seconds) {

                        date.setTime(Date.now());

                        seconds = !seconds || seconds > 60 || seconds < 0 ? 60 : seconds;

                        for(var avg    = 0,
                                lower  = start(),
                                second = lower + date.getSeconds(), 
                                end    = second - seconds; second > end; second--)
                            (avg += memory[second < 0 ? 119+second:second]);

                        return avg / ( (seconds - 1) + (date.getMilliseconds() / 1000) );
                    },
                    tick : function tick () {

                        date.setTime(Date.now());

                        return (++this.memory()[start() + date.getSeconds()]);
                    },
                    memory : function () {

                        var next, lower, length;

                        date.setTime(Date.now());

                        lower = start(),
                        next = lower + date.getSeconds() + 1,
                        length = lower + 60;
                        
                        (memory[next >= length ? lower : next] = 0);

                        return memory;
                    }

                }});

        }

        return this[label];
    };
    
    return frequency;
    
});
