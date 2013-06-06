Object.extend(vrt.Api.Graph.prototype, vrt.Api.Graph.prototype.__proto__);
Object.extend(vrt.Api.Graph.required,{
	labels: Array
});

vrt.Api.Graph.prototype.createElement = function() {

	var element = $(document.createElement('div')),
		canvas = $(document.createElement('canvas'));

	canvas.id = this.id;

	element.insert({'top' : canvas});

	this.options.rgraph = this.options.rgraph || {};	
	this.options.rgraph = Object.extend({

		'chart.strokestyle' : false,
		'chart.labels.above' : true,
		'chart.title.vpos' : 0.5,
		'chart.title.hpos' : 0.1,
		'chart.text.size' : 8,
		'chart.text.angle' : 45,
		'chart.text.font' : 'Arial',		
		'chart.key.position.y' : 10,
		'chart.key.position' : 'gutter',
		'chart.key.position.gutter.boxed' : false,
		'chart.key.interactive' : true,
		'chart.shadow' : true,
		'chart.shadow.blur' : 15,
		'chart.shadow.offsetx' : 0,
		'chart.shadow.offsety' : 0,
		'chart.shadow.color' : '#999',
		'chart.gutter.left' : 55,
		'chart.gutter.right' : 5,
		'chart.gutter.top' : 50,
		'chart.gutter.bottom' : 70

	}, this.options.rgraph);

	this.colors = this.randomColors(this.labels.length);
	this.canvas = canvas;
	this.element = element;
	

};

vrt.Api.Graph.prototype.resize = function() {

	this.canvas.width = this.width;
	this.canvas.height = this.height;

	this.async(this.draw);

};

vrt.Api.Graph.prototype.draw = function() {

	if(!this.visible())
		return;

	RGraph.Clear(this.canvas);
	RGraph.ObjectRegistry.Clear(this.canvas);

	var values = Object.values(this.data),
		keys =  Object.keys(this.data);

	var bar = new RGraph.Bar(this.id, values);

	bar.Set('chart.title', this.title);
	bar.Set('chart.labels', keys);
	
	if(this.multiple)
		bar.Set('chart.key', this.labels);
	
	bar.Set('chart.colors', this.colors);
	
	if(typeof this.options.rgraph === 'object')
		for(var key in this.options.rgraph)
			bar.Set(key, this.options.rgraph[key]);

	bar.Draw();

};

