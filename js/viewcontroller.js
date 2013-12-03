function ViewController() {};

ViewController.prototype.showGroup = function(groupname) {

		if(typeof vrt.Api.DataSet.groups[groupname] === 'undefined')
			throw new Error('No group `'+groupname+'`');

		vrt.Api.DataSet.groups[groupname] = vrt.Api.DataSet.groups[groupname].sort(function(a, b) {
			return d3.ascending(a.sortKey, b.sortKey);
		});

		this.hideAll();

		for(var i = 0, group = vrt.Api.DataSet.groups[groupname], len = group.length; i < len; i++)
			group[i].show();

};

ViewController.prototype.loadMenu = function() {

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
};

ViewController.prototype.message =  function(text) {
	
		text = String(text);

		var msg = this.message, context = this, args = Array.prototype.slice.call(arguments),
			expire = typeof args[args.length - 1] === 'number' ? args.pop() : undefined;
		
		msg.queue = msg.queue || [];

		if(args.length > 1) {
			while(args.length && (text = String(args.shift())))
				msg.apply(this, typeof expire === 'number' ? [text, expire] : [text]);
			return;
		}
		else if(msg.busy)
			return msg.queue.push(arguments);

		var e = d3.select(this.elements().messages).insert("div", ":first-child"),
			b = d3.select(this.elements().backdrop).classed("front", true);
			
		msg.busy = true;
		msg.back = clearTimeout(msg.back) | setTimeout(function(){b.classed("front", false);}, 5000);

		e.html(text);

		if(typeof expire === 'number')
			setTimeout(function() {e.remove();}, expire);

		function proceed() {
			msg.busy = false;
			if(msg.queue.length)
				msg.apply(context, msg.queue.shift());
		};

		var t = setTimeout(proceed, 500);

		return {
			remove: function() { 
				proceed();
				clearTimeout(t); 
				e.remove();				
			}
		};
};

ViewController.prototype.hideAll = function() {
		for(var id in vrt.Api.DataSet.collection)
			vrt.Api.DataSet.collection[id].hide();
};

ViewController.prototype.elements =  function() {

		return {
			navigation : $('#navigation').get(0),
			menu : $('#grouplist').get(0),
			status : $('#status').get(0),
			messages : $('div.backdrop div.messages').get(0),
			backdrop : $('div.backdrop').get(0)
		};
};