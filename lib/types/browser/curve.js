Object.extend(vrt.Api.Curve.prototype, vrt.Api.Curve.prototype.__proto__);
Object.extend(vrt.Api.Curve.required, {
	data: Array
});

vrt.Api.Curve.prototype.createElement = function() {

	var element = $(document.createElement('div')),
		canvas = $(document.createElement('canvas'));

	canvas.id = this.id;

	element.insert({'top' : canvas});

	this.colors = this.data.length ? this.randomColors(this.data.length) : [], 
	this.fillstyle = this.data.length ? this.randomColors(this.data.length) : [],
	this.element = element,
	this.canvas = canvas;

	this.options.rgraph = this.options.rgraph || {};
	this.options.rgraph = Object.extend({

		'chart.filled' : false,
		'chart.linewidth' : 2,
		'chart.gutter.left' : 40,
		'chart.gutter.top' : 35,
		'chart.gutter.right' : 15,
		'chart.gutter.bottom' : 50,		
		'chart.tooltips.effect' : 'none',
		'chart.text.size' : 7,
		'chart.text.angle' : 45,
		'chart.tooltips' : this.tooltip.bind(this)

	}, this.options.rgraph);

	this.options.rgraph['chart.curvy'] = false;

};

vrt.Api.Curve.prototype.resize = function() {

	this.canvas.width = this.width;
	this.canvas.height = this.height;

	vrt.Api.DataSet.prototype.resize.call(this);
};
	    		
vrt.Api.Curve.prototype.curveCount =  function() {
	return this.data.length;
};
		
vrt.Api.Curve.prototype.clear = function() {

	for(var x = 0, xlen = this.data.length; x < xlen; x++)
	    for (var y=0, ylen = this.data[x].length; y < ylen; ++y) {
    	    this.data[x][y] = null;
	};			
};

vrt.Api.Curve.prototype.createLabels = function() {

	var labels = [], scale;

	if(this.unit === 'days')
		scale = 60 * 24 * 365 * 1000;
	else if(this.unit === 'hours')
		scale = 60 * 24 * 1000;
	else if(this.unit === 'minutes')
		scale = 60 * 1000;
	else if(this.unit === 'seconds')
		scale = 1000;

	for(var cursor = this.left, len = this.getTime().length; cursor <= this.right; cursor += len)
		labels.push( new Date( (cursor - len) * scale ) );

	for(var i = 0, len = labels.length, date; i < len; i++) {
		date = labels[i];

		if(this.resolution >= 1)
			 labels[i] = Time.prototype.Day( date.getUTCDay() );
		else
			labels[i] = Time.prototype.padZero(date.getUTCHours())  + ':' + Time.prototype.padZero(date.getUTCMinutes());

	};

	return labels;

};

vrt.Api.Curve.prototype.getGraph = function() {	
	
	var curveData = this.data, 
		id = this.id;

	var Line = function() {

	    function L(args) {
	    	return RGraph.Line.apply(this, args);
	    };

	    L.prototype = RGraph.Line.prototype;

	    	return function() {
    			return new L([id].concat(curveData));
    		}
	    	
	};

	return (RGraph.ObjectRegistry.getObjectsByCanvasID(this.id) || [])[0] || Line()();

};
	    
vrt.Api.Curve.prototype.draw = function() {

	if(!this.visible() || !this.data.length)
		return;

	var graph   = this.getGraph(),
		timings = this.getTime();

	graph.original_data = this.data;

	graph.Set('chart.title', this.title);
	graph.Set('chart.fillstyle', this.fillstyle);
	graph.Set('chart.colors', this.colors);
	graph.Set('chart.xticks', this.bufferSize);    	
	graph.Set('chart.numxticks', timings.resolution);
	graph.Set('chart.background.grid.autofit.numvlines', timings.resolution * 2);
	graph.Set('chart.labels', this.createLabels());

	if(typeof this.options.rgraph === 'object')
		for(var key in this.options.rgraph)
			graph.Set(key, this.options.rgraph[key]);
	        
	RGraph.Clear(this.canvas);
	graph.Draw();

};

vrt.Api.Curve.prototype.pad = function(length) {

	if(typeof length !== 'number')
	 	throw new Error('Type of the one and only parameter `length` [Number] is invalid');
	    	
	var empty = Array.fill(null, this.data.length);

	for(var i = 0; i < length; i++)
		this.push.apply(this, empty);

	return length;

};

vrt.Api.Curve.prototype.add = function() {

	this.data.push(Array.fill(null, this.bufferSize));
	this.colors.push(this.randomColor());
	this.fillstyle.push(this.randomColor());
	    	
};

vrt.Api.Curve.prototype.exists = function(curveIndex, valueIndex) {
	    		    	
   	if(this.data[curveIndex] !== undefined && 
       this.data[curveIndex][curveIndex] !== undefined)
   		return true;
   	else
   		return false;
};

vrt.Api.Curve.prototype._update = function(curveIndex, valueIndex, value) {	  
	    	
	if(this.exists(curveIndex, valueIndex)) 
		this.data[curveIndex][valueIndex] = value;
	    		
};

vrt.Api.Curve.prototype.tooltip = function(index) {
    	
    var curveIndex = Math.ceil(index * (1 / this.bufferSize)) - 1,
    	valueIndex = index - (curveIndex * this.bufferSize);

    return this.labels[curveIndex] + ' ( ' + Math.round(this.data[curveIndex][valueIndex]) + ' ) ';
};

vrt.Api.Curve.prototype.update = function(data) {

	for(var key in data) {
		if(key === '__cursor__') {
			this.cursor = data[key];
			delete data[key];
			break;
		}
	}

	this.pad(this.reset());

	for(var key in data) {

		while(this.curveCount() < this.labels.length)
			this.add();			
							
		this._update(this.labels.indexOf(key),
			this.currentIndex, 
			data[key]
		);				
	}

	this.async(this.draw);

};

vrt.Api.Curve.prototype.push = function() {

	var args = [];

    for(id in arguments)
    	args.push(arguments[id]);

    if(args.length > this.data.length)
    	for(var i = 0, len = (args.length - this.data.length); i < len; i++)
    		this.add();

    else if(args.length < this.data.length) {

    	for(var i = 0, len = this.data.length; i < len; i++)
    		if(typeof args[i] !== 'number')
    			this.data[i].push(null);
		    		
	    }

	    for(var i = 0, len = this.data.length; i < len; i++) {

	    	if(typeof args[i] === 'number' || args[i] === null)
	    		this.data[i].push(args[i]);

	    	if (this.data[i].length > length)
	           	this.data[i] = RGraph.array_shift(this.data[i]);
	    };
};