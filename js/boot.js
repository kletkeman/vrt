$(document).ready(function() {

	var navigation = vrt.controls.elements().navigation,
		navigation_height = $(navigation).height();

	$(document).scroll(function(event) {
		vrt.controls.elements().navigation.setStyle({
			top : document.body.scrollTop + 'px'
		});
	});

	$(document).mousemove(function(event) {
		if(event && (event.clientY <= navigation_height) )
			$(navigation).show()
		else
			$(navigation).hide();
	});

	var responder = function(response) {
		
		if(response.action === 'onCreate')
		{
			var type = response.ms.type.capitalize();
			new vrt.Api[type](response.ms);
		}
		else if(response.action === 'onError')
			console.error(response);
		else if(/^(on)/gi.test(response.action))
			vrt.receive(response.type, response.action, response.ms);;
	};

	io.connect('http://' + window.location.host + ':' + window.location.port).on('event', responder);

    vrt.log.disableAll();
	vrt.store.reload();
	vrt.controls.loadMenu().groups();	
    
    

});