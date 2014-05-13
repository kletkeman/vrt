$.extend(vrt.Api.Stack.prototype, vrt.Api.Stack.prototype.__proto__, $.extend({}, vrt.Api.Stack.prototype));

vrt.Api.Stack.prototype.create = function() {
	d3.select(this.element)
		.classed("container", false)
		.select(".widget.title")
		.classed("widget", false)
		.classed("stack", true);
};

vrt.Api.Stack.prototype.update = function() {
        
    if(!this.event) {}
    else if(this.event.type === 'save')
        this._configure();
        
	return vrt.Api.DataSet.prototype.update.apply(this, arguments);
};

vrt.Api.Stack.prototype.show = function() {

	var datasets = d3.values(this.datasets)
		.sort(function(a, b) {
			return a.sortKey > b.sortKey;
		});

	vrt.Api.DataSet.prototype.show.apply(this, arguments);

	for(var i = 0, len = datasets.length; i < len; i++) {
		datasets[i].show(this.element);
	}

};

vrt.Api.Stack.prototype.hide = function() {

	for(var i in this.datasets)
		this.datasets[i].hide();

	vrt.Api.DataSet.prototype.hide.call(this);
};

vrt.Api.Stack.prototype.draw = function() {

	if(!this.visible())
		return;

	for(var i in this.datasets) {
        this.datasets[i].onResize(null, this.dimensions.width, this.dimensions.height);
	}

};