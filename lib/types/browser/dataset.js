Object.extend(vrt.Api.DataSet.prototype, {

	async : function(fn) {

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

	randomColor : function() {
		return new Color('rgb('+Math.round(Math.random() * 254)+','+Math.round(Math.random() * 254)+','+Math.round(Math.random() * 254)+')').hex;
	},

	randomColors : function(length) {

		var colors = [];

		if(length)
			for(var i = 0; i < length; i++)
				colors.push(this.randomColor());

		return colors;
				
		
	},

	show: function() {
		$(document.body).insert({'bottom' : this.element});
		this.draw();
	},

	hide: function() {
		if(this.element.parentNode)
			this.element.remove();
	},

	visible: function() {
		return !!this.element.parentNode;
	},

	dimensionsToNumber : function(ref_width, ref_height) {

		var expression_prc = /\d+%/gi,
			expression_px = /\d+px/gi,
			percent, width = this.width, height = this.height;

		if(typeof this['%'] === 'object') {
			this.height = (typeof this.height === 'string' ? this.height : this['%'].height) || this.height;
			this.width = (typeof this.width === 'string' ? this.width : this['%'].width) || this.width;
		}
		else if(typeof this['px'] === 'object') {
			this.height = (typeof this.height === 'string' ? this.height : this['px'].height) || this.height;
			this.width = (typeof this.width === 'string' ? this.width : this['px'].width) || this.height;
		}


		if( this.height && this.height.match(expression_prc) ) {

			var hpercent = parseInt(this.height, 10),
				hbody = ref_height;
			
			height = (hbody / 100) * hpercent;

			this['%'] = this['%'] || {};
			this['%'].height = this.height;
			this.height = height;

		}
		else if( this.height && this.height.match(expression_px) ) {

			this['px'] = this['px'] || {};
			this['px'].height = this.height;

			height = parseInt(this.height, 10);

		}
		else if (typeof this.height === 'string')
			height = parseInt(this.height, 10);
		else if(typeof this.height !== 'number')
			throw new Error('Invalid property `height`');

		if( this.width && this.width.match(expression_prc) ) {

			var wpercent = parseInt(this.width, 10) - 1,
				wbody = ref_width;
			
			width = (wbody / 100) * wpercent;

			this['%'] = this['%'] || {};
			this['%'].width = this.width;
			this.width = width;
		}
		else if( this.width && this.width.match(expression_px) ) {

			this['px'] = this['px'] || {};
			this['px'].width = this.width;

			width = parseInt(this.width, 10);			

		}
		else if (typeof this.width === 'string')
			width = parseInt(this.width, 10);
		else if(typeof this.width !== 'number')
			throw new Error('Invalid property `width`');

		this.height = Math.floor(height);
		this.width = Math.floor(width);

	},

	onCreate : function() {
		
		this.__async_queue__ = [];

		vrt.Api.DataSet.collection[this.id] = this;
		
		if(!this.stacked) {
			vrt.Api.DataSet.groups[this.group] = vrt.Api.DataSet.groups[this.group] || [];
			vrt.Api.DataSet.groups[this.group].push(this);
		}

		this.createElement();

		this.element.setStyle({
			'display' : 'inline-block',
			'vertical-align': 'top'
		});

		
		this.onResize();
		Event.observe(window, 'resize', this.onResize.bind(this));
				
		viewController.loadMenu().groups();

	},

	onResize : function(event, w, h) {

		if(this.stacked && event)
			return;

		this.dimensionsToNumber(w||document.viewport.getWidth(), h||document.viewport.getHeight());
		this.element.setStyle({
			'width' : this.width + 'px',
			'height' : this.height + 'px'
		});
		this.resize();
	},

  	onReceive : function(data) {	
		this.update(data);
  	},
  	
  	onError : function(err) {
  		console.error(err);
  	},
  	
  	onUpdate : function(data) {
  		
  		for(var key in data)
			this[key] = data[key];

		this.async(this.draw);
  	},

  	update : function(data) {
	
		for(var key in data)
			this.data[key] = data[key];

		this.async(this.draw);
	},

	resize : function() {
		this.async(this.draw);
	}

});

Object.extend(vrt.Api.DataSet.required, {

  createElement : Function,
  element : HTMLDivElement,
  data : Object,
  draw : Function,
  update : Function,
  show : Function,
  hide : Function,
  resize : Function,
  height : Number,
  width : Number,
  onResize : Function

});

vrt.Api.DataSet.groups = {};