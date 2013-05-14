Object.extend(vrt.Api.Ticker.prototype, vrt.Api.Ticker.prototype.__proto__);

vrt.Api.Ticker.prototype.createElement = function() {

	var element = $(document.createElement('div'));

	element.setStyle({
		'vertical-align' : 'top',
		'overflow' : 'auto',
		'padding' : '16px',
		'font-size' : this.fontSize,
		'font-weight' : this.fontWeight,
		'color' : this.fontColor
	});
	
	this.element = element;
};

vrt.Api.Ticker.prototype.draw = function() {

	if(!this.element.parentNode)
		return;

	this.element.childElements().each(Element.remove);

	for(var key in this.data) {

		var element = $(document.createElement('div')),
			value = $(document.createElement('div'));

		value.innerText = this.data[key];

		value.setStyle({
			'display' : 'inline-block',
			'float' : 'right', 
			'vertical-align' : 'middle', 
			'width' : 'auto', 
			'height' : 'auto',
			'margin-left' : '16px', 
			'text-align' : 'right'
		});

		element.innerText = key;

		element.insert({'bottom' : value});
		this.element.insert({'bottom' : element});

	};

};
