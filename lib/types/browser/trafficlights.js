Object.extend(vrt.Api.Trafficlights.prototype, vrt.Api.Trafficlights.prototype.__proto__);

vrt.Api.Trafficlights.prototype.createElement = function() {

	var element = (document.createElement('div'));

	element.setStyle({
		'padding' : '16px',
		'vertical-align' : 'top',
		'overflow' : 'auto'
	});

	this.element = element;

};

vrt.Api.Trafficlights.prototype.draw = function() {

	if(!this.element.parentNode)
		return;

	var colormap = ['red', 'orange', 'green'];

	this.element.childElements().each(Element.remove);

	for(var key in this.data) {
		
		var element = $(document.createElement('div')),
			light = $(document.createElement('div'));

		light.setStyle({
			'float' : 'right', 
			'vertical-align' : 'middle', 
			'width' : '16px', 
			'height' : '16px', 
			'background-color' : colormap[this.data[key]], 
			'border-radius' : '10px', 
			'margin-left' : '16px', 
			'text-align' : 'right'
		});

		element.innerText = key;
		element.insert({'bottom' : light});
		this.element.insert({'bottom' : element});
	};
};
