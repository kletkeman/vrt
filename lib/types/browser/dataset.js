window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            return window.setTimeout(callback, 1000 / 60);
          };
})();

$.extend(vrt.Api.DataSet.required, {
 
  'create'     : Function,
  'element'    : HTMLDivElement,
  'data'       : Object,
  'draw'       : Function,
  'update'     : Function,
  'show'       : Function,
  'hide'       : Function,
  'resize'     : Function,
  'onResize'   : Function,
  'dimensions' : Object,
  'render'     : Function

});

vrt.Api.DataSet.groups = {};

vrt.Api.DataSet.prototype.onCreate = function(config) {
    
    var context = this;
    
    if(typeof config === 'object' && !Array.isArray(config))
        return vrt.create(config, false);
    
    this.dimensions = $.extend(this.dimensions, 
    {
        width: null,
        height: null,
        margin : {
            top: 30,
            right: 40,
            bottom: 30,
            left: 40
        },
        compensated : Object.create({}, {
            width: {
                get : function() {
                    var d = context.dimensions, m = d.margin;
                    return d.width - m.left - m.right;
                }
            },
            height: {
                get : function() {
                    var d = context.dimensions, m = d.margin;
                    return d.height - m.top - m.bottom;
                }
            }
        })
    }),
        
    this.element = document.createElement('div');
		
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
        
    return this.onResize(), this.create(), ( (this.group === vrt.controls.active) && this.show());

};

vrt.Api.DataSet.prototype.onResize = function(event, w, h) {
    
    var expression = /\d+%/gi, // Check if percent
		dimensions,
        paths = ['height', 'width', 'margin.top', 'margin.bottom', 'margin.left', 'margin.right'],
        reference = {
            'width' : ( w || $(window).width() ),
            'height' : ( h || $(window).height() )
        },
        path, property, name, object;
    
    if(this.stacked && event)
		return;
			
    while(path = paths.pop()) {
        
        path       = path.split('.'),
        property   = true,
        dimensions = this.dimensions;
        
        while(path.length && property) {
            property   = ( object = (property && typeof property === 'object' ? property : this) )[(name = path.shift())],
            dimensions = ( dimensions[name] && typeof dimensions[name] === 'object' ? dimensions[name] : dimensions );
        }
        
        if(!property)
            continue;
        
        if(object === this && property.match(expression))
            dimensions[name] = (reference[name] / 100) * parseInt(property, 10);
        else if (typeof property === 'string')
		    dimensions[name] = parseInt(property, 10);
        else if (typeof property === 'number')
            dimensions[name] = property;
        
        dimensions[name] = Math.floor(dimensions[name]);
        
    }
    
	return (this.event = $.extend(new Event('resize'), {'width': reference.width, 'height': reference.height })), this.render('resize');
        
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
			
		this.render('draw', this.positionTitle);

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
				return vrt.log.error(err);
            
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
		
		d3.select(this.element).select(".widget.title")
            .text(this.title)
            .style({
                left : function() { return Math.ceil( context.element.offsetLeft - (this.clientWidth / 2) + ( (context.dimensions.margin.left / 2) - (this.clientHeight / 2) ) ) + "px"; },
                top : function() { return Math.ceil(this.clientWidth / 2) - (this.clientHeight / 2) + context.dimensions.margin.top + context.element.offsetTop + "px"; }
            });
	};

vrt.Api.DataSet.prototype.hide = function() {
    
    if(this.visible())
		d3.select(this.element).remove();
        
};

vrt.Api.DataSet.prototype.visible = function() {
    return !!this.element.parentNode;
};

vrt.Api.DataSet.prototype.render = function() {
    
    var context = this,
        callback, e, fname,
        event = $.extend({}, this.event), 
        events = (this.__render_event_queues = this.__render_event_queues || [[],[]])[(!event || event.type !== 'receive' ) ? 0 : 1],
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
    )
        this.render('update'), (fname = 'onResize');
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
        (events.__draw.event =  event), (callback && (events.__draw.callback = callback));
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
    
    return context.__renderId__ || ( context.__renderId__ = setTimeout(render, 0) );
    
};

vrt.Api.DataSet.prototype.update = function() {
    return this.render('draw');
};

vrt.Api.DataSet.prototype.resize = function() {
		
    d3.select(this.element)
        .style({
            'width': this.dimensions.width + "px",
            'height': this.dimensions.height + "px"
        });
        
    return (this.event = this.event || $.extend(new Event('resize'), {'width': this.dimensions.width, 'height': this.dimensions.height})), this.render('draw', this.positionTitle);
       
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

vrt.Api.DataSet.prototype.editor = function editor ( options ) {
        
        var context  = this, 
            defaults = {
      
              title   : null,
              record  : null,
              fields  : [],
              actions : null,
              width   : 640,
              height  : 480
                
            },
            fid     = this.id + "-editor-main-form",
            mfid     = this.id + "-editor-modal-form",           
            actions, modal, main = w2popup.get(), f = w2ui[fid], m = w2ui[mfid];
    
        if(f && m)
            return false;
        
        options = $.extend({}, defaults, options || {
            title: context.title,
            record: context,
            fields: [  
                {name: "title"},
                {name: "description"},
                {name: "bufferSize"},
                {name: "width"},
                {name: "height"},
                {name: "seconds"}
            ],
            actions: null
        });
        
        actions = options.actions || {};

        f = $().w2form({

            name   :  main ? mfid : fid,
            style  : 'border: 0px; background-color: transparent;',
            header  : main ? options.title : undefined,
            fields : options.fields,
            record : options.record,
            actions: $.extend({}, actions, (!main ? {
                
                "save": function () {

                    if(!this.validate().length) {

                        $.extend(true, options.record, this.record);

                        if(typeof actions.save === 'function')
                            actions.save.call(this);
                                    
                        context.save();
                        
                        w2popup.close();

                    }
                },
                "update": function () {

                    if(!this.validate().length) {

                        $.extend(true, options.record, this.record);

                        if(typeof actions.update === 'function')
                            actions.update.call(this);
                                    
                        context.resize();
                    }
                }
            } : {}), {
                "cancel": function () {
                    return modal ? w2popup.message() : w2popup.close();
                }
            })           
        });
    
        return main ? 
            
            (modal = w2popup.message({ 
                html: ('<div id="' + mfid +'" style="width: 100%; height: 100%;"></div>'), 
                width: options.width * .9, 
                height: options.height * .9,
                onOpen: function() {
                    $('#w2ui-popup #'+mfid).w2render(mfid), w2ui[mfid].resize();
                },
                form: f
            }))

            : 

            (main = w2popup.open({

                title	: options.title,
                body	: ('<div id="'+fid+'" style="width: 100%; height: 100%;"></div>'),
                style	: 'padding: 15px 0px 0px 0px',
                width	: options.width,
                height	: options.height,
                showMax : true,
                onMin	: function (event) {
                    $(w2ui[fid].box).hide();
                    event.onComplete = function () {
                        $(w2ui[fid].box).show();
                        w2ui[fid].resize();
                    }
                },
                onMax	: function (event) {
                    $(w2ui[fid].box).hide();
                    event.onComplete = function () {
                        $(w2ui[fid].box).show();
                        w2ui[fid].resize();
                    }
                },
                onOpen	: function (event) {
                    event.onComplete = function () {
                        $('#w2ui-popup #'+fid).w2render(fid);
                    }
                },
                onClose : function() {
                    $().w2destroy(mfid);
                    $().w2destroy(fid);
                },
                form: f

            }));
        
};
    

