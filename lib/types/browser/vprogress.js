Object.extend(vrt.Api.Vprogress.prototype, vrt.Api.Vprogress.prototype.__proto__);
Object.extend(vrt.Api.Vprogress.required, {
	colors : Array
});

vrt.Api.Vprogress.prototype.createElement = function() {

	var element = $(document.createElement('div')),
		canvas = $(document.createElement('canvas'));

	canvas.id = this.id;	

	element.insert({'top' : canvas});

	this.options.rgraph = this.options.rgraph || {};
	this.options.rgraph = Object.extend({

		'chart.margin'              : 5,
    	'chart.tooltips.effect'     : 'fade',
        'chart.tickmarks'           : true,
        'chart.tickmarks.inner'     : true,
        'chart.tickmarks.color'     : '#333',
        'chart.tickmarks.zerostart' : true,
        'chart.scale.decimals'      : 0,
        'chart.gutter.right'        : 130,
        'chart.strokestyle.inner'   : 'rgba(0,0,0,0)'

	}, this.options.rgraph);
	
	this.element = element,
	this.canvas  = canvas;
	this.colors = [];
};

vrt.Api.Vprogress.prototype.resize = function() {
	this.canvas.width = this.width;
	this.canvas.height = this.height;
};	

vrt.Api.Vprogress.prototype.draw = function() {

	if(!this.visible())
		return;

	RGraph.Clear(this.canvas);
	RGraph.ObjectRegistry.Clear(this.canvas);

	var values = Object.values(this.data),
		labels    = Object.keys(this.data);
		vprogress = new RGraph.VProgress(this.id, values, this.topBoundary);

	while(this.colors.length < labels.length)
		this.colors.push(this.randomColor());

	vprogress.Set('chart.title',          this.title);
    vprogress.Set('chart.colors',         this.colors);
	vprogress.Set('chart.tooltips',       labels);
	
	if(this.showLabels) {
		vprogress.Set('chart.key',            labels);
   		vprogress.Set('chart.key.position.x', this.canvas.width - 90);
    }

    if(typeof this.options.rgraph === 'object')
		for(var key in this.options.rgraph)
			vprogress.Set(key, this.options.rgraph[key]);
            
    vprogress.Draw();

};
