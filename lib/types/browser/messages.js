Object.extend(vrt.Api.Text.prototype, vrt.Api.Text.prototype.__proto__);
Object.extend(vrt.Api.Text.required, {
	data: Array
});

vrt.Api.Text.prototype.createElement = function() {

	var element = $(document.createElement('div'));

	element.setStyle({
		'font-family' : this.fontFamily,
		'font-size' : this.fontSize,
		'color' : this.fontColor,
		'overflow' : 'auto'
	});

	this.element = element;

};

vrt.Api.Text.prototype.update = function(data) {
	this.data.push(data);
	if(this.data.length > this.bufferSize) {
		this.data.shift();
	}
	this.async(this.draw);
};

vrt.Api.Text.prototype.draw = function() {

	if(!this.visible())
		return;

	this.element.childElements().each(Element.remove);

	for(var i = 0, len = this.data.length, element; i < len; i++) {

		element = $(document.createElement('div'));
		element.setStyle({
			'padding': '5px'
		});
		
		for(var timestamp in this.data[i]) {
			element.innerHTML += '<div style="font-size: 8pt; float: right; display: inline-block;">' + this.getTimeString(new Date(parseInt(timestamp))) + '</div>';
			element.innerHTML += this.data[i][timestamp];
			break;
		};
		this.element.insert({'top' : element});

	};
	
};

vrt.Api.Text.prototype.getTimeString = function(date) {

	var now = (new Date());
		timestring = '';

	if(date.getDay() < now.getDay() || date.getMonth() < now.getMonth())
		timestring += Time.prototype.Day(date.getDay()) + ', ' + Time.prototype.Month(date.getMonth()) + ' ' + date.getMonth() + Time.prototype.Ordinal(date.getMonth()) + ' ';

	timestring += Time.prototype.padZero(date.getHours()) + ':' + Time.prototype.padZero(date.getMinutes()) + ':' + Time.prototype.padZero(date.getSeconds());

	return timestring;

};

