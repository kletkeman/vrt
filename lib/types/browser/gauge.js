Object.extend(vrt.Api.Gauge.prototype, vrt.Api.Gauge.prototype.__proto__);

vrt.Api.Gauge.prototype.createElement = function() {

	var element = $(document.createElement('div'))
		canvas = $(document.createElement('canvas'));

	canvas.id = this.id;	

	element.insert({'top' : canvas});

	this.options.rgraph = this.options.rgraph || {};
	
	this.canvas = canvas;
	this.element = element;
};

vrt.Api.Gauge.prototype.resize = function() {

	this.canvas.width = this.width;
	this.canvas.height = this.height;

	this.async(this.draw);

};

vrt.Api.Gauge.prototype.draw = function() {

	if(!this.element.parentNode)
		return;

	RGraph.Clear(this.canvas);
	RGraph.ObjectRegistry.Clear(this.canvas);

	var value = this.data.value,		
		gauge = new RGraph.Gauge(this.id, this.min, this.max, value);

	gauge.Set('chart.title', this.title);

	if(typeof this.options.rgraph === 'object')
		for(var key in this.options.rgraph)
			gauge.Set(key, this.options.rgraph[key]);

	gauge.Draw();

	return gauge;

};