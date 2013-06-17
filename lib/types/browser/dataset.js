$.extend(vrt.Api.DataSet.prototype, {

	async : function(fn, time_delay_ms) {

		var context = this;

		if(typeof fn === 'function')
			if(this.__async_queue__.indexOf(fn) === -1)
				this.__async_queue__.push(fn);
		
		if(!this.__queue_running__)
			setTimeout(function() { context.__queue_runner__.call(context); }, 1);

	},

	__queue_runner__ : function() {

		var fn      = this.__async_queue__.shift(),
			context = this;

		if(fn && !fn.running)  {
			this.__queue_running__ = true;
			setTimeout(function() { fn._running = true; fn.call(context); fn._running = false; context.__queue_runner__.call(context); }, 1);
		}
		else 
			this.__queue_running__ = false;
	},

	__async_queue__ : null,

	show: function(container) {
		
		container = container || document.body;
		
		if(this.visible())
			return;
			
		var context = this,
			group   = vrt.Api.DataSet.groups[context.group]
						 .sort(function(a, b) { return a.sortKey > b.sortKey; });
		
		for(var i=0,len=group.length;i<len;i++)
			if(group[i].visible() && group[i].sortKey > this.sortKey) {
				container.insertBefore(this.element, group[i].element);
				break;
			}
		
		if(!this.visible())
			container.insertBefore(this.element);
		
		this.draw();
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
		
		this.delay = 1000;
		this.__async_queue__ = [];
		this.dimensions = {
			width: null,
			height: null, 
			margin: {
				top: 20,
				right: 20,
				bottom: 30, 
				left: 40
				}
			};
		this.element = document.createElement('div');
		
		d3.select(this.element)
		.style({
			'display' : 'inline-block',
			'vertical-align': 'top'
		})
		.classed("widget container", true)
		.classed(this.type, true)
		.attr("id", this.id);

		vrt.Api.DataSet.collection[this.id] = this;
		vrt.Api.DataSet.groups[this.group] = vrt.Api.DataSet.groups[this.group] || [];
		vrt.Api.DataSet.groups[this.group].__vrt_hide_group__ |= this.stacked;
		vrt.Api.DataSet.groups[this.group].push(this);
		
		this.create();
		
		this.onResize();
		
		$(window).resize(this.onResize.bind(this));
				
		viewController.loadMenu().groups();

	},

	onResize : function(event, w, h) {

		if(this.stacked && event)
			return;

		this.getDimensions(w||$(window).width(), h||$(window).height());
		d3.select(this.element)
		.style({
			'width' : this.dimensions.width + 'px',
			'height' : this.dimensions.height + 'px'
		});
		this.resize();
	},

  	onReceive : function(data) {	
		this.update(data);
  	},
  	
  	onError : function(err) {
  		console.error(err);
  	},
  	
  	onSave : function(data) {
  		
  		for(var key in data)
			this[key] = data[key];

		this.async(this.draw, this.delay);
  	},

  	update : function(data) {
	
		for(var key in data)
			this.data[key] = data[key];

		this.async(this.draw, this.delay);
	},

	resize : function() {
		
		d3.select(this.element)
		  .style({
			width: this.dimensions.width,
			height: this.dimensions.height
		  });
		
		this.async(this.draw);
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
  delay: Number,
  dimensions : Object

});

vrt.Api.DataSet.groups = {};