window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            return window.setTimeout(callback, 1000 / 60);
          };
})();

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

vrt.Api.DataSet.prototype.render = function() {
    
    var context = this,
        callback, e, fname,
        event = $.extend({}, this.event), 
        events = (this.__render_event_queues = this.__render_event_queues || [[],[]])[(event && event.type !== 'receive' ) ? 0 : 1],
        args = Array.prototype.slice.call(arguments);
    
    switch(args.length) {
        case 2:
            callback = args.pop(),
            fname = args.pop();
            break;
        case 1: 
            callback = fname = args.pop();
            break;
    }
    
    if(typeof callback !== 'function') callback = undefined;
    if(typeof fname !== 'string' || !fname.length) fname = undefined;
   
    function render() {
        
        var e, events = context.__render_event_queues;
        
        for(var i = 0; i < events.length; i++) {
            if(events[i].__renderId__ === context.__renderId__ && context.__renderId__ !== null) {
                events = events[i];
                break;
            }
        }
        
        if(events === context.__render_event_queues) {
            
            if(events[0].length)
                events = events[0];
            else
                events = events[1];
        }
        
        (context.__renderId__ = events.__renderId__ = null);
        
        if( e = events.shift() ) {
            
            e.startTime = new Date();
            
            if(!e.animationFrame && e === events.__draw ) {
                
                if(!events.length)
                    return (e.animationFrame = true), events.unshift(e), ( context.__renderId__ = events.__renderId__ = requestAnimFrame(render) );
                else if(events.length)
                    return events.push(e), ( context.__renderId__ = setTimeout(render, 0) );
            }
            
            if( e.animationFrame )
                (events.__draw = null);
            
            ( context.__renderId__ = setTimeout(render, 0) );
            
            ( context.event = e.event ), context[e.function].call(context), (context.event =  null);

            if(typeof e.callback === 'function')
                e.callback.call(context);
            
        } 
        else
            return (events.__draw = null), (context.event =  null);
        
    };
    
    if(fname) {}
    else if (
        event.type === 'save' ||
        event.type === 'reload:eof' || 
        event.type === 'delete'
    ) {
        this.render('update'), (fname = 'resize');
    }
    else if(event.type === 'resize')
        (fname = 'draw');
     else if(
         event.type === 'receive'
     )
        (fname = 'update');    
    else 
        (fname = 'draw');
        
    e = {
            'event': event, 
            'callback': callback, 
            'function': fname,
            'arrivalTime' : new Date()
        };
    
    if( events.__draw && fname === 'draw')
        (events.__draw.event =  event), (events.__draw.callback = callback);
    else {
        
        if(events.__draw && events.__draw.startTime && (events.__draw.startTime.getTime() - events.__draw.arrivalTime.getTime()) > 1000) {
            
            while(events.length) {
                if( events.__draw && events.shift() === events.__draw) {
                    events.unshift(events.__draw);
                    break;
                }
            }
        }
        
        events.push( e.function !== 'draw' ? e : (events.__draw = e) );
    }
    
    return context.__renderId__ || render();
    
};

vrt.Api.DataSet.prototype.onCreate = function(config) {
    
        if(typeof config === 'object')
            return vrt.create(config, false);
        		
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

		vrt.Api.DataSet.groups[this.group] = vrt.Api.DataSet.groups[this.group] || [];
		vrt.Api.DataSet.groups[this.group].__vrt_hide_group__ |= this.stacked;
		vrt.Api.DataSet.groups[this.group].push(this);
		
		this.create();		
		this.onResize();
        
        return (this.group === vrt.controls.active) && this.show();

	};

vrt.Api.DataSet.prototype.onResize = function(event, w, h) {
        
    this.event = $.extend(new Event('resize'), {w: w, h: h});
    
	if(this.stacked && event)
		return;

	this.getDimensions(w||$(window).width(), h||$(window).height());
	this.positionTitle();
    
	return this.resize();
        
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
		
		return this.render('update', function truncate () {
           
            if(Array.isArray(this.data))
				while(this.bufferSize < this.data.length)
					this.data.shift();

			for(var x = 0, len = this.data.length; x < len; x++)
				while(this.bufferSize < this.data[x].length)
					this.data[x].shift();         
					
		});
		
	};

vrt.Api.DataSet.prototype.onError = function(err) {
    this.event = $.extend(new Event('error'), {error: err});
    vrt.log.error(err);
};

vrt.Api.DataSet.prototype.onSave = function(data) {
    return $.extend(this, this.fromJSON.call(data)), (this.event = $.extend(new Event('save'), {data: data})), this.render();
};

vrt.Api.DataSet.prototype.onDelete = function(info, data) {
    return $.extend(this, this.fromJSON.call(data)), (this.event = $.extend(new Event('delete'), Store.delete.call(this, (info.filter || info.index), info.path, 'data')) ), this.render();
};

vrt.Api.DataSet.prototype.onDestroy = function() {
        return this.destroy.apply(this, arguments);
    };

vrt.Api.DataSet.prototype.update = function() {
    return this.render('draw');
};

vrt.Api.DataSet.prototype.resize = function() {
		
    d3.select(this.element)
        .style({
            width: this.dimensions.width + "px",
            height: this.dimensions.height + "px"
        });
        
    return (this.event = this.event || $.extend(new Event('resize'), {w: this.dimensions.width, h: this.dimensions.height})), this.render('draw');
       
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
    
        return vrt.Api.DataSet.prototype.destroy.call(this);   
        
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