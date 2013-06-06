var viewController = {

	progress: function(percent) {

		var bar = this.elements().progressbar;	

		bar.innerText = 'Loading objects : ' + percent + '%';
		console.log(bar.innerText);

		if(percent < 100) 
			bar.show();
		else 
			bar.hide();
	},

	showGroup : function(groupname) {

		if(typeof vrt.Api.DataSet.groups[groupname] === 'undefined')
			throw new Error('No group `'+groupname+'`');

		vrt.Api.DataSet.groups[groupname] = vrt.Api.DataSet.groups[groupname].sortBy(function(dataset) {
			return dataset.sortKey;
		});

		this.hideAll();

		for(var i = 0, group = vrt.Api.DataSet.groups[groupname], len = group.length; i < len; i++)
			group[i].show();

	},

	loadMenu : function() {

		var context = this;
		var elements = this.elements();
		var menu = elements.menu;
		var navigation = elements.navigation;

		return {

			groups : function() {				

				for(var i = 0, len = menu.options.length; i < len; i++)
					menu.remove(menu.options[i]);

				menu.add(new Option(''));

				for(var name in vrt.Api.DataSet.groups)
					menu.add(new Option(name));
			}

		};
	},

	hideAll : function() {
		
		if(window['RGraph'])
			RGraph.ObjectRegistry.Clear();

		for(var id in vrt.Api.DataSet.collection)
			vrt.Api.DataSet.collection[id].hide();
	},

	elements : function() {

		return {
			navigation : $('navigation'),
			menu : $('grouplist'),
			status : $('status'),
			progressbar : $('progressbar')
		};
	}

};

document.observe('dom:loaded', function() {

	var navigation = viewController.elements().navigation,
		navigation_height = navigation.getHeight();

	document.observe('scroll', function(event) {
		viewController.elements().navigation.setStyle({
			top : document.body.scrollTop + 'px'
		});
	});

	document.observe('mousemove', function(event) {
		if(event && (event.clientY <= navigation_height) )
			navigation.show()
		else
			navigation.hide();
	});

	var responder = function(response) {
		if(response.action === 'onCreate')
			new vrt.Api[response.ms.type.capitalize()](response.ms);
		else if(response.action === 'onError')
			console.error(response);
		else if(/^(on)/gi.test(response.action))
			vrt.receive(response.type, response.action, response.ms);;
	};

	if(window['Stream'])
		Stream.Responders.register(responder);
	else {
		var socket = io.connect('http://' + window.location.host + ':' + window.location.port);
		socket.on('event', responder);
	}


	vrt.reload();
	viewController.loadMenu().groups();
	

});