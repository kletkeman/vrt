Object.extend(vrt.Api.Stack.prototype, vrt.Api.Stack.prototype.__proto__);

vrt.Api.Stack.prototype.createElement = function() {
	this.element = $(document.createElement('div'));
};

vrt.Api.Stack.prototype.onCreate = function() {

	vrt.Api.DataSet.prototype.onCreate.call(this);

	for(var i in this.datasets)
		(function(context) {

			var id = context.datasets[i].id;

			Object.defineProperty(context.datasets, i, {
		  		enumerable: true,
		  		configurable: false,
		  		get: function() {
		  			return vrt.Api.DataSet.collection[id];
		  		}
			});

		})(this);
};

vrt.Api.Stack.prototype.onResize = function() {

	vrt.Api.DataSet.prototype.onResize.call(this);
	
	for(var i in this.datasets)
		try {
			this.datasets[i].onResize(null, this.width, this.height);
		} catch(err) { continue; }
};

vrt.Api.Stack.prototype.show = function() {

	var datasets = Object.values(this.datasets)
		.sortBy(function(dataset) {
			return dataset.sortKey;
		});

	vrt.Api.DataSet.prototype.show.call(this);

	for(var i = 0, len = datasets.length, element, widget; i < len; i++) {
		
		widget = vrt.Api.DataSet.collection[datasets[i].id];
		element = widget.element;

		widget.onResize(null, this.width, this.height);

		this.element.insert({'bottom' : element});
		element.show();
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