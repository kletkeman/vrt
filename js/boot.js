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

	io.connect('http://' + window.location.host + ':' + window.location.port).on('event', 
                                                                                 
        function(response) {
		
            if(response.action === 'onCreate')
            {
                vrt.create(response.ms, false);
            }
            else if(response.action === 'onError') 
            {
                vrt.log.error(response);
            }
            else if(/^(on)/gi.test(response.action))
                vrt.receive(response.type, response.action, response.ms);
	});

    vrt.log.disableAll();
	vrt.store.reload();
	vrt.controls.loadMenu().groups();	
    
    

});