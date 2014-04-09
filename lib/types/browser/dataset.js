vrt.Api.DataSet.prototype.async = function(fn, time_delay_ms, callback, timed_out) {
		
        if(typeof fn !== 'function')
            throw new Error("Expected function");
        
        fn.__asyncId = fn.__asyncId || Math.round(Math.random() * Number.MAX_VALUE);
    
		var context = this,
			delays = (this.__async_delays__[fn.__asyncId] = this.__async_delays__[fn.__asyncId] || {}),
            run = function() {
                
                var args = Array.prototype.slice.call(arguments), fn;
                
                delays.events = delays.events || [];
                delays.events.push(context.event ? $.extend(new Event(context.event.type), context.event) : null);
                
                while(fn = args.shift())
			         context.__queue_runner__.call(context, fn);
            };        
		
		if(delays.__last_execution_timeout_id) {
				
			if (timed_out) {
                clearTimeout(delays.__last_execution_timeout_id);
				delays.__last_execution_timeout_id = null;
                delays.needs_update = null;
            }
			else {
				return (delays.needs_update = true);
            }
		}
		else if (typeof time_delay_ms === 'number' && !delays.__last_execution_timeout_id) {	
            
			!time_delay_ms || (delays.__last_execution_timeout_id = setTimeout(function() {
                
                    if(delays.needs_update)
                        context.async(fn, undefined, callback, true);
                    else {
                        delays.__last_execution_timeout_id = null;
                        delays.__callback = null;
                    }
                }, time_delay_ms));            
            
			delays.__callback = callback;
		}	
		
		run(fn);

	};

vrt.Api.DataSet.prototype.show = function (container) {
		
		container = container || document.body;
    
		if(this.visible())
			return;
    
        this.event = $.extend(new Event('show'), {container: container});
			
		var context = this,
			group   = vrt.Api.DataSet.groups[context.group]
						 .sort(function(a, b) { return d3.ascending(a.sortKey, b.sortKey); });
		
		for(var i=0,len=group.length;i<len;i++)
			if(group[i].visible() && group[i].sortKey > this.sortKey) {
				container.insertBefore(this.element, group[i].element);
				break;
			}
		
		if(!this.visible())
			container.insertBefore(this.element);
			
		this.positionTitle();
		this.draw();

		if(!this.reload(3))
			this.reload();
        
        
        
	};

vrt.Api.DataSet.prototype.reload = function(check) {

		var context = this, event = new Event("reload"), previous;

		if(check === 1)
			return !!this.__fetched__;
		else if(check === 2)
			return !!this.__reloading__;
		else if(check === 3)
			return !!this.__fetched__ || !!this.__reloading__;
		else if(this.__reloading__)
			return;

		this.__reloading__ = true;

		d3.select(this.element).classed("loading", true);
    
        function push() {
            
            if(!previous)
                return (previous = arguments);
            
            context.onReceive.apply(context, previous);
            
            previous = arguments;
        };

		vrt.data(this.id, function (err, data, eof) {
				
			if(err)
				return console.error(err);
            
            context.event =  eof ? new Event("reload:eof") : event;
           
			for(var k in data) {
                
				if(context.bufferSize)
					push.apply(null, [data[k]].concat(k.split('.').map(function(n) { return Number(n); })));
				else
					push(data);
			}

			if(eof) {
                
                context.__fetched__ = eof;
				context.__reloading__ = !eof;

				while(context._queue && context._queue.length)
					push.apply(null, context._queue.shift());				

				d3.select(context.element).classed("loading", false);
                
                push();
                			
			}        

		});	

	};

vrt.Api.DataSet.prototype.positionTitle = function() {
		
		var context = this;
		
		d3.select(this.element).select(".widget.title").style({
			left : function() { return Math.ceil( context.element.offsetLeft - (this.clientWidth / 2) + ( (context.dimensions.margin.left / 2) - (this.clientHeight / 2) ) ) + "px"; },
			top : function() { return Math.ceil(this.clientWidth / 2) - (this.clientHeight / 2) + context.dimensions.margin.top + context.element.offsetTop + "px"; }
		});
	};

vrt.Api.DataSet.prototype.hide = function() {
    
    this.event = new Event('hide');
    
		if(this.visible())
			d3.select(this.element).remove();
        
	};

vrt.Api.DataSet.prototype.visible = function() {
		return !!this.element.parentNode;
	};

vrt.Api.DataSet.prototype.getDimensions = function() {
		
		if(!arguments.length)
			return this.dimensions;
			
		var expression = /\d+%/gi,
			width      = this.width, 
			height     = this.height,
			ref_width  = arguments[0], 
			ref_height = arguments[1],
			dimensions = this.dimensions;

		if( height && height.match(expression) )
			dimensions.height = (ref_height / 100) * parseInt(height, 10);
		else if (typeof height === 'string')
			dimensions.height = parseInt(this.height, 10);

		if( width && width.match(expression) )
			dimensions.width  = (ref_width / 100) * parseInt(width, 10);
		else if (typeof width === 'string')
			dimensions.width = parseInt(this.width, 10);

		dimensions.height = Math.floor(dimensions.height);
		dimensions.width = Math.floor(dimensions.width);
		
		return this.dimensions;

	};

vrt.Api.DataSet.prototype.onCreate = function() {
        		
		var width = this.width, height = this.height, data = this.data, 
			dimensions = {
				width: null,
				height: null,
				margin : {}
			},
			margin = (this.dimensions||{}).margin || {
				top: 20,
				right: 20,
				bottom: 30, 
				left: 40
			},
			context = this, event, event_t;
		
		Object.defineProperties(this, {
			
			__async_queue__ : {
				enumerable : false,
				value : []
			},
			
			__async_delays__ : {
				enumerable : false,
				value : {}
			},
			
			__queue_running__ : {
				enumerable : false,
				value : false
			},
			
			__queue_runner__ : {
				enumerable : false,
				value : function(fn_) {
                    
                    if(typeof fn_ === 'function')
                            this.__async_queue__.push(fn_);
                    
                    var fn      = this.__async_queue__.shift(),
						delays  = this.__async_delays__[!fn||fn.__asyncId],
						context = this;
                    
                    if(this.__queue_running__)
                        return;
					else if(fn)  {
                        
						this.__queue_running__ = true;
                        
						setTimeout(function() {
                            
                            var event = delays.events ? delays.events.shift() : null;
                            
                            context.event = event;
                            
							fn.call(context); 

							if(typeof delays.__callback === 'function')
								delays.__callback();

							context.__queue_runner__.call(context); 
                        
                        }, 0);
					}
					else 
						this.__queue_running__ = false;
				}
			},
			
			width : {
				enumerable : true,
				get : function() {
					return width;
				},
				set : function(value) {
					width = value;
				}
			},
			
			height : {
				enumerable : true,
				get : function() {
					return height;
				},
				set : function(value) {
					height = value;
				}
			},
			
			data : {
				enumerable : false
			},
			
			dimensions : {
				enumerable : true,
				get : function() {
					return dimensions;
				}
			},
			
			element : {
				enumerable : false,
				value : document.createElement('div')
				
			},
			
			group : {
				enumerable : false
			},
			sortKey : {
				enumerable : false
			},
			stacked : {
				enumerable : false
			},
			error : {
				enumerable : false
			}
			
		});
		
		Object.defineProperties(dimensions.margin, {
			
			top : {
				get : function() {
					return margin.top;
				},
				set : function(value) {
					margin.top = value;
				}
			},
			bottom : {
				get : function() {
					return margin.bottom;
				},
				set : function(value) {
					margin.bottom = value;
				}
			},
			left : {
				get : function() {
					return margin.left;
				},
				set : function(value) {
					margin.left = value;
				}
			},
			right : {
				get : function() {
					return margin.right;
				},
				set : function(value) {
					margin.right = value;
				}
			}
		
		});
		
		d3.select(this.element)
		.style({
			'display' : 'inline-block',
			'vertical-align': 'top'
		})
		.classed("widget container", true)
		.classed(this.type.toLowerCase(), true)
		.attr("id", this.id)
		.append("div")
		.attr("class", "widget title")
		.text(this.title);

		vrt.Api.DataSet.collection[this.id] = this;
		vrt.Api.DataSet.groups[this.group] = vrt.Api.DataSet.groups[this.group] || [];
		vrt.Api.DataSet.groups[this.group].__vrt_hide_group__ |= this.stacked;
		vrt.Api.DataSet.groups[this.group].push(this);
		
		this.create();		
		this.onResize();
    
        this.__clear_event = setInterval(function() {
            context.event = event_t = null;
        }, 0);

	};

vrt.Api.DataSet.prototype.onResize = function(event, w, h) {
        
        this.event = $.extend(new Event('resize'), {w: w, h: h});
        
		if(this.stacked && event)
			return;

		this.getDimensions(w||$(window).width(), h||$(window).height());
		this.positionTitle();
		this.resize();    
        
	};

vrt.Api.DataSet.prototype.onReceive = function(data, x, y) {
		
		var context = this;

		this._queue = this._queue || [];
		
		if(!this.event || this.event.type !== 'reload') {
			if(this.reload(2))
				return this._queue.push(arguments);
			else if(!this.reload(1))
				return;
        }
		
		if(this.bufferSize) {

			if(typeof x === 'number') {

				this.data[x] = Array.isArray(this.data[x]) ? 
					this.data[x] : (typeof y !== 'number' ? 
						(typeof data  ===  'object' && typeof this.data[x] === 'object' ? 
							$.extend( true, this.data[x], data ) : data) : []);

				if(typeof y === 'number')
					this.data[x][y] = (typeof data  ===  'object' && typeof this.data[x][y] === 'object' ?
						$.extend( true, this.data[x][y], data ) : data);
						
				else if ( Array.isArray(this.data[x]) )
					this.data[x].push(data);
			}
			else
				this.data.push(data);
		}
		else if(typeof data === 'object')
			$.extend( true, this.data, data );
		
    
        if(this.event && this.event.type === 'reload')
            return;
        
        this.event = $.extend(this.event || new Event('receive'), {x: x, y: y, data: data});
		
		this.async(this.update, this.step, function() {
           
            if(Array.isArray(context.data))
				while(context.bufferSize < context.data.length)
					context.data.shift();

			for(var x = 0, len = context.data.length; x < len; x++)
				while(context.bufferSize < context.data[x].length)
					context.data[x].shift();         
					
		});
		
	};

vrt.Api.DataSet.prototype.onError = function(err) {
        this.event = $.extend(new Event('error'), {error: err});
        vrt.log.error(err);
  	};

vrt.Api.DataSet.prototype.onSave = function(data) {
    
        var context = this;

        this.event = $.extend(new Event('save'), {data: data});
    
        $.extend(this, this.fromJSON.call(data));
    
		return this.update();
  	};

vrt.Api.DataSet.prototype.onDestroy = function() {
        return this.destroy.apply(this, arguments);
    };

vrt.Api.DataSet.prototype.update = function() {
    
    if(this.event && 
       (this.event.type === 'save' || 
        this.event.type === 'reload:eof') )
            return this.async(this.resize);
    
    return this.async(this.draw);
};

vrt.Api.DataSet.prototype.resize = function() {
		
		
		d3.select(this.element)
		  .style({
			width: this.dimensions.width + "px",
			height: this.dimensions.height + "px"
		  });
        
       return this.async(this.draw);
       
	};

vrt.Api.DataSet.prototype.destroy = function() {
        
        if(vrt.Api.DataSet.destroy.apply(this, arguments)) return;
        
        var ref, g = vrt.Api.DataSet.groups[this.group], first = g[0];
        
        this.hide();
        
		while(true) {
            
            if((ref = g.shift()) !== this)
                g.push(ref);
            
            if(first === this || first === g[0] || !g.length) {
                
                delete vrt.Api.DataSet.collection[this.id];
                
                if(!g.length)
                    delete vrt.Api.DataSet.groups[this.group];
                
                break;
            }
            
        }
    
        clearInterval(this.__clear_event);
        
        
    };


$.extend(vrt.Api.DataSet.required, {

  create : Function,
  element : HTMLDivElement,
  data : Object,
  draw : Function,
  update : Function,
  show : Function,
  hide : Function,
  resize : Function,
  height : String,
  width : String,
  onResize : Function,
  onDestroy : Function,
  dimensions : Object

});

vrt.Api.DataSet.groups = {};