Object.extend(vrt.Api.Pie.prototype, vrt.Api.Pie.prototype.__proto__);

vrt.Api.Pie.prototype.createElement = function() {

	var element = $(document.createElement('div'))
		canvas = $(document.createElement('canvas'));

	canvas.id = this.id;	

	element.insert({'top' : canvas});

	this.options.rgraph = this.options.rgraph || {};
	this.options.rgraph = Object.extend({

		'chart.gutter.left' : 45,
		'chart.key.background' : 'rgba(255,255,255,0.4)',
		'chart.key.interactive' : true,
		'chart.key.position' : 'graph',
		'chart.key.position.x' : 1,
		'chart.text.font' : 'Helvetica',
		'chart.text.size' : 7,
		'chart.strokestyle' : 'white',
		'chart.linewidth' : 1,
		'chart.exploded' : 5,
		'chart.shadow' : true,
		'chart.shadow.offsetx' : 0,
		'chart.shadow.offsety' : 0,
		'chart.shadow.blur' : 25

	}, this.options.rgraph);

	this.canvas = canvas;
	this.element = element;
};

vrt.Api.Pie.prototype.resize = function() {

	this.canvas.width = this.width;
	this.canvas.height = this.height;

	this.async(this.draw);

};

vrt.Api.Pie.prototype.draw = function() {

	if(!this.element.parentNode)
		return;

	RGraph.Clear($(this.id));

	var values = Object.values(this.data),
		keys =  Object.keys(this.data);
		
	var pie = new RGraph.Pie(this.id, values);

	pie.Set('chart.title', this.title);	
	pie.Set('chart.colors', this.randomColors(keys.length));
	pie.Set('chart.key', keys);

	if(typeof this.options.rgraph === 'object')
		for(var key in this.options.rgraph)
			pie.Set(key, this.options.rgraph[key]);

	pie.Draw();

	return pie;		

};