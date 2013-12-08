$.extend(vrt.Api.Stack.prototype, vrt.Api.Stack.prototype.__proto__, $.extend({}, vrt.Api.Stack.prototype));

vrt.Api.Stack.prototype.create = function() {
	d3.select(this.element)
		.classed("container", false)
		.select(".widget.title")
		.classed("widget", false)
		.classed("stack", true);
};

vrt.Api.Stack.prototype.onResize = function(event, width, height) {

	vrt.Api.DataSet.prototype.onResize.call(this, event, width, height);
	
	for(var i in this.datasets)
		try {
			this.datasets[i].onResize(null, width||this.dimensions.width, height||this.dimensions.height);
		} catch(err) { continue; }
		
	if(this.visible())
		this.show();
};

vrt.Api.Stack.prototype.onSave = function() {
	vrt.Api.DataSet.prototype.onSave.apply(this, arguments);
	this._configure();
};

vrt.Api.Stack.prototype.resize = function() {
	
	vrt.Api.DataSet.prototype.resize.apply(this, arguments);
	
	if(arguments.callee.caller !== vrt.Api.DataSet.prototype.onResize)
		return this.onResize();
};

vrt.Api.Stack.prototype.show = function(element) {

	var datasets = d3.values(this.datasets)
		.sort(function(a, b) {
			return a.sortKey > b.sortKey;
		});

	vrt.Api.DataSet.prototype.show.call(this, element);

	for(var i = 0, len = datasets.length, element, widget; i < len; i++) {
		
		widget = vrt.Api.DataSet.collection[datasets[i].id];
		widget.onResize(null, this.dimensions.width, this.dimensions.height);
		widget.show(this.element);
	}

};

vrt.Api.Stack.prototype.hide = function() {

	for(var i in this.datasets)
		vrt.Api.DataSet.collection[this.datasets[i].id].hide();

	vrt.Api.DataSet.prototype.hide.call(this);
};

vrt.Api.Stack.prototype.draw = function() {

	if(!this.visible())
		return;

	for(var i in this.datasets) {
		vrt.Api.DataSet.collection[this.datasets[i].id].draw();
	}

};