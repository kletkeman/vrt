var viewController = {

	progress: function(percent) {

		var bar = this.elements().progressbar;	

		bar.innerText = 'Loading objects : ' + percent + '%';
		console.log(bar.innerText);

		if(percent < 100) 
			$(bar).show();
		else 
			$(bar).hide();
	},

	showGroup : function(groupname) {

		if(typeof vrt.Api.DataSet.groups[groupname] === 'undefined')
			throw new Error('No group `'+groupname+'`');

		vrt.Api.DataSet.groups[groupname] = vrt.Api.DataSet.groups[groupname].sort(function(a, b) {
			return d3.ascending(a.sortKey, b.sortKey);
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
					if(!vrt.Api.DataSet.groups[name].__vrt_hide_group__)
						menu.add(new Option(name));
			}

		};
	},

	hideAll : function() {

		for(var id in vrt.Api.DataSet.collection)
			vrt.Api.DataSet.collection[id].hide();
	},

	elements : function() {

		return {
			navigation : $('#navigation').get(0),
			menu : $('#grouplist').get(0),
			status : $('#status').get(0),
			progressbar : $('#progressbar').get(0)
		};
	}

};

$(document).ready(function() {

	var navigation = viewController.elements().navigation,
		navigation_height = $(navigation).height();

	$(document).scroll(function(event) {
		viewController.elements().navigation.setStyle({
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

	if(window['Stream'])
		Stream.Responders.register(responder);
	else {
		var socket = io.connect('http://' + window.location.host + ':' + window.location.port);
		socket.on('event', responder);
	}


	vrt.store.reload();
	viewController.loadMenu().groups();
	

});