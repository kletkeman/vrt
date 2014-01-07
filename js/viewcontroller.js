function ViewController() {};

ViewController.prototype.open = function(groupname) {

		if(typeof vrt.Api.DataSet.groups[groupname] === 'undefined')
			throw new Error('No group `'+groupname+'`');

		var context = this, 
			tab_id  = 'vrt-navigation-toolbar-tab-' + groupname.split(' ').join('-').toLowerCase();

		vrt.Api.DataSet.groups[groupname] = vrt.Api.DataSet.groups[groupname].sort(function(a, b) {
			return d3.ascending(a.sortKey, b.sortKey);
		});

		this.hideAll();

		for(var i = 0, group = vrt.Api.DataSet.groups[groupname], len = group.length; i < len; i++)
			group[i].show();

		(this.tabs = this.tabs ||
				$('#navigation-tabs').w2tabs({
					name: 'vrt-navigation-toolbar-tabs',
					onClick: function(e) {
						context.open(e.object.caption);
					},
					onClose: function(e) {
						if(context.tabs.active === e.target)
							context.hideAll();
					}
				}))
        
        this.tabs.get(tab_id) || this.tabs.add({ id: tab_id , caption: groupname, closable: true });

		this.tabs.active = tab_id;
		this.tabs.refresh();
        
        this.__title = document.title;
        document.title = this.__title + " -- " + groupname;

};

ViewController.prototype.initialize = function() {

		var context    = this,
			elements   = this.elements(),
            navigation = $(elements.navigation),
		    height     = navigation.height(),
			toolbar, t;

		(toolbar = this.toolbar = this.toolbar || 
			$('#navigation').w2toolbar({

				name: 'vrt-navigation-toolbar',
				items: [
					{ type: 'html',  id: 'vrt-navigation-toolbar-title', html: '&nbsp;&nbsp;&nbsp;<strong>VRT</strong>&nbsp;&nbsp;&nbsp;' },
					{ type: 'button',   id: 'vrt-navigator-open-button', caption: 'Dashboards', img: 'icon-folder', items: []},
					{ type: 'break',  id: 'vrt-navigation-break0' },
					{ type: 'html',  id: 'vrt-navigation-toolbar-tabs', html: '<div style="background-color: transparent;" id="navigation-tabs"></div>' },
					{ type: 'spacer'},
					{ type: 'break',  id: 'vrt-navigation-break1' },
				],
				onClick: function(e) {
					if(e.target === 'vrt-navigator-open-button')
                        context.navigator();
				}
			}));
		
        toolbar.refresh();

        $(document).scroll(function handleScrollEvent(event) {
            navigation.setStyle({
                top : document.body.scrollTop + 'px'
            });
        });
    
        $(document).mousemove(function handleMouseMoveEvent(event) {
            if(event && (event.clientY <= height) )
                navigation.show();
            else
                navigation.hide();
        });
    
        d3.select(window).on('resize', function() {
            
            clearTimeout(t);        
            t = setTimeout(function() {
                
                var w;
                
                for(var id in vrt.Api.DataSet.collection)
                    if( (w = vrt.Api.DataSet.collection[id]).visible() && !w.stacked )
                        w.onResize.apply(w, arguments);
                
                for(var id in vrt.Api.DataSet.collection)
                    if( !(w = vrt.Api.DataSet.collection[id]).visible() && !w.stacked )
                        w.onResize.apply(w, arguments);
                
            }, 100);
    
        });

};

ViewController.prototype.message =  function(text) {
	
		text = String(text);

		var msg = this.message, context = this, args = Array.prototype.slice.call(arguments),
			expire = typeof args[args.length - 1] === 'number' ? args.pop() : undefined,
            elements = this.elements(),
            messages = elements.messages,
            backdrop = elements.backdrop;
            
		
		msg.queue = msg.queue || [];

		if(args.length > 1) {
			while(args.length && (text = String(args.shift())))
				msg.apply(this, typeof expire === 'number' ? [text, expire] : [text]);
			return;
		}
		else if(msg.busy)
			return msg.queue.push(arguments);

		var e = d3.select(messages).insert("div", ":first-child"),
			b = d3.select(backdrop).classed("front", true);
			
		msg.busy = true;
		msg.back = clearTimeout(msg.back) | setTimeout(function(){b.classed("front", false);}, 5000);

		e.html(text);

		if(typeof expire === 'number')
			setTimeout(function() {e.remove();}, expire);

		function proceed() {
			msg.busy = false;
			if(msg.queue.length)
				msg.apply(context, msg.queue.shift());
            else if (!messages.childNodes.length) {
                clearTimeout(msg.back);
                b.classed("front", false);
            }
		};

		var t = setTimeout(proceed, 250);

		return {
			remove: function() {
				clearTimeout(t); 
				e.remove();	
                proceed();
			}
		};
};

ViewController.prototype.hideAll = function() {
		for(var id in vrt.Api.DataSet.collection)
			vrt.Api.DataSet.collection[id].hide();
    
     document.title = this.__title ? this.__title : document.title;
};

ViewController.prototype.elements =  function() {

		return {
			navigation : $('#navigation').get(0),
			status : $('#status').get(0),
			messages : $('div.backdrop div.messages').get(0),
			backdrop : $('div.backdrop').get(0)
		};
};