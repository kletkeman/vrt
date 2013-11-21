function ClientStore () {
	this.data.queue = [];
};

ClientStore.prototype.__proto__ =  Store.prototype;

ClientStore.prototype.get = function(id) {

	var response;
	
	$.ajax({
		  url: './api/v1/' + id,
		  dataType: 'json',
		  async: false,
		  success: function(data) {
		    response = data;
		  }
		})
		.fail(function(xhr, statustext, err) {
			throw err;
		});

	if(response.error)
		throw new Error(response.error);

	return response;
};

ClientStore.prototype.data = function(id, callback) {

	var last_length = 0, context = this;

	if(this.data.queue.map(function(d) {return d[0];}).indexOf(id) > -1)
		return;
	else if(this.data.working)
		return this.data.queue.push(arguments);

	this.data.working = true;

	function parse(e) {

	  	var r = typeof e === 'string' ? e : e.currentTarget.response; 

	  	r.substr(last_length).split("\n").forEach(function(d) {

	  		try {
	  			if(typeof callback === 'function')
	  				return callback(null, JSON.parse(d), last_length === r.length) ;
	  		} catch(e) {
	  			if(d.match(/ /gi) !== d.length) {
	  				if(typeof callback === 'function')
	  					return callback(e);
	  				throw e;
	  			}
	  		}
	  	});
			  	
	  	last_length = r.length
	};

	console.log('Loading data for widget with id: '+id);
	
	return $.ajax('./api/v1/' + id + '/data',
		  {
		  async: true,
		  success : function(data) {

		  	if(!last_length)
		  		parse(data);

		  	if(typeof callback === 'function')
	  			callback(null, null, true);

		  	context.data.working = false;

		  	if(context.data.queue.length)
		  		setTimeout(function() {
		  			context.data.apply(context, context.data.queue.shift());		  	
		  		}, 0);
		  		
		  },
		  xhrFields: {
			  onprogress: parse 
		  }
		
		})
		.fail(function(xhr, statustext, err) {
			throw err;
		});
	
};

ClientStore.prototype.list = function() {

	var args = Array.prototype.slice.call(arguments),
		response;

	if(typeof args[0] === 'object')
		return Store.prototype.list.apply(this, arguments);

	$.ajax({
		  url: './api/v1/list',
		  dataType: 'json',
		  async: false,
		  success: function(data) {
		    response = data;
		  }
		})
		.fail(function(xhr, statustext, err) {
			throw err;
		});

	if(response.error)
		throw new Error(response.error);

	return response;
	
};

ClientStore.prototype.reload = function() {

	window['Stream'] && Stream.pause(); 
	viewController.progress(0);

	var ids = this.list(), len = ids.length, i = 0, context = this;

	(function loadId() { i++;

		var id     = ids.pop(),
			config = context.get(id);

		new vrt.Api[config.type.capitalize()](config);

		if(!ids.length) {
			viewController.progress( 100 );	
			window['Stream'] && Stream.resume();
			
		}
		else {
			viewController.progress( Math.ceil( (100 / len) * i) ); 
			setTimeout(loadId, 0);			
		}

	})();	

	

};

ClientStore.prototype.receive = function(id, eventHandlerName, args) {
	
	(this._queue || (this._queue = new vrt.Api.Queue({timeout : 30000}))).stash(id, arguments)(function(guid, set) {
			
		if(!guid)
			set((vrt.Api.DataSet.collection[id]||{}).id);
				
	}).release('0', id, function(guid, args_) {
			
		var id = args_[0],
			eventHandlerName = args_[1],
			args = args_[2];
			
		vrt.Api.DataSet.collection[id][eventHandlerName].apply(vrt.Api.DataSet.collection[id], args);
	});
		
};

ClientStore.prototype.push = function(x, y, id, data, callback) {
	
	return $.ajax({
		  url: './api/v1/' + id,
		  type: 'POST',
		  contentType: 'application/json',
		  dataType: 'text',
		  processData: false,
		  data: JSON.stringify(data),
		  async: false,
		  success: function(response) {
			
			response = JSON.parse(response);
			
		    if(typeof callback === 'function')
				callback(response.error ? new Error(response.error) : undefined, data)
			else if(response.error)
				throw new Error(response.error);
			
		  }
		})
		.fail(function(xhr, statustext, err) {
			
			if(typeof callback === 'function')
				callback(err);
			else
				throw err;
		});
	
};

ClientStore.prototype.save = function(dataset, callback) {
	var obj = this.get(dataset.id);
	for(var name in obj) {
		// Only store properties that have not been created in the browser
	}
};
