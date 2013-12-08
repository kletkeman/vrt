$.extend(vrt.Api.DataSet.prototype, {

	async : function(fn, time_delay_ms, callback, timed_out) {
		
		var context = this,
			delays = (this.__async_delays__[fn] = this.__async_delays__[fn] || {});
		
		if(delays.__last_execution_timeout_id) {
				
			if (timed_out)
				delays.__last_execution_timeout_id = null;
			else
				return;
		}
		else if (typeof time_delay_ms === 'number' && !delays.__last_execution_timeout_id) {	
			
			delays.__last_execution_timeout_id = setTimeout(this.async.bind(this, fn, undefined, callback, true), time_delay_ms);
			delays.__callback = callback;
			
			return;
		}
			
		if(typeof fn === 'function')
			if(this.__async_queue__.indexOf(fn) === -1)
				this.__async_queue__.push(fn);
		
		if(!this.__queue_running__)
			setTimeout(function() { context.__queue_runner__.call(context); }, 1);

	},

	show: function (container) {
		
		container = container || document.body;
		
		if(this.visible())
			return;
			
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
	},

	reload: function(check) {

		var context = this;

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

		vrt.data(this.id, function load_data_callback(err, data, eof) {
				
			if(err)
				return console.error(err);

			for(var k in data) {
				if(context.bufferSize)
					context.onReceive.apply(context, [data[k]].concat(k.split('.').map(function(n) { return Number(n); })));
				else
					context.onReceive.call(context, data);
			}

			if(eof) {

				while(context._queue && context._queue.length)
					context.onReceive.apply(context, context._queue.shift());

				context.__fetched__ = eof;
				context.__reloading__ = !eof;

				d3.select(context.element).classed("loading", false);

				if(context.update === vrt.Api.DataSet.prototype.update)
					context.resize();
				else 
					context.update();
		
			}

		});	

	},
	
	positionTitle : function() {
		
		var context = this;
		
		d3.select(this.element).select(".widget.title").style({
			left : function() { return Math.ceil( context.element.offsetLeft - (this.clientWidth / 2) + ( (context.dimensions.margin.left / 2) - (this.clientHeight / 2) ) ) + "px"; },
			top : function() { return Math.ceil(this.clientWidth / 2) - (this.clientHeight / 2) + context.dimensions.margin.top + context.element.offsetTop + "px"; }
		});
	},
	
	hide: function() {
		if(this.visible())
			d3.select(this.element).remove();
	},

	visible: function() {
		return !!this.element.parentNode;
	},

	getDimensions : function() {
		
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

	},

	onCreate : function() {
		
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
			context = this;
		
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
				value : function() {

					var fn      = this.__async_queue__.shift(),
						delays  = this.__async_delays__[fn],
						context = this;

					if(fn && !fn.running)  {
						this.__queue_running__ = true;
						setTimeout(function() {

							fn._running = true;
							fn.call(context); 

							if(typeof delays.__callback === 'function') { 
								delays.__callback(); 
								delete delays.__callback;
							}

							fn._running = false; 
							context.__queue_runner__.call(context); }, 1);
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
					this.stacked ? vrt.Api.Stack.findParent(this).onResize() : this.onResize();
				}
			},
			
			height : {
				enumerable : true,
				get : function() {
					return height;
				},
				set : function(value) {
					height = value;
					this.stacked ? vrt.Api.Stack.findParent(this).onResize() : this.onResize();
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
					context.resize();
				}
			},
			bottom : {
				get : function() {
					return margin.bottom;
				},
				set : function(value) {
					margin.bottom = value;
					context.resize();
				}
			},
			left : {
				get : function() {
					return margin.left;
				},
				set : function(value) {
					margin.left = value;
					context.resize();
				}
			},
			right : {
				get : function() {
					return margin.right;
				},
				set : function(value) {
					margin.right = value;
					context.resize();
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
		
		$(window).bind('resize', this._onResizeBound = this.onResize.bind(this));
				
		vrt.controls.loadMenu().groups();

	},

	onResize : function(event, w, h) {

		if(this.stacked && event)
			return;

		this.getDimensions(w||$(window).width(), h||$(window).height());
		this.positionTitle();
		this.resize();
	},

  	onReceive : function(data, x, y) {
		
		var context = this;

		this._queue = this._queue || [];

		if(arguments.callee.caller.name !== 'load_data_callback')
			if(this.reload(2))
				return this._queue.push(arguments);
			else if(!this.reload(1))
				return;
		
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
		
		
		this.async(this.update, this.step, function() {
			
			if(Array.isArray(context.data))
				while(context.bufferSize < context.data.length)
					context.data.shift();

			for(var x = 0, len = context.data.length; x < len; x++)
				while(context.bufferSize < context.data[x].length)
					context.data[x].shift();
					
		});
		
	},
  	
  	onError : function(err) {
  		console.error(err);
  	},
  	
  	onSave : function(data) {
		$.extend(this, data);
		this.async(this.resize);
  	},
    
    onDestroy: function() {
        return this.destroy.apply(this, arguments);
    },

  	update : function() {
		this.async(this.draw);
	},

	resize : function() {
		
		var context = this;
		
		d3.select(this.element)
		  .style({
			width: this.dimensions.width + "px",
			height: this.dimensions.height + "px"
		  });
		
		this.async(this.draw);
	},
    
    destroy: function() {
        
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
        
        $(window).unbind('resize', this._onResizeBound);
        
    }

});

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