function ClientStore () {
	this._queue = [];
	this._queue_flush_interval = setInterval((function(that) {

		return function() {
			while(that._queue.length) {
				var q = that._queue.shift();
				that.receive.apply(that, q);
			}
		}
	})(this), 1000);
};

$.extend(ClientStore.prototype, Store.prototype);

ClientStore.prototype._queue = null;

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

ClientStore.prototype.receive = function(id, eventHandlerName, args, retry) {

	try {
		vrt.Api.DataSet.collection[id][eventHandlerName].apply(vrt.Api.DataSet.collection[id], args);
		if(retry)
			console.debug("ClientStore.receive: A Command was successfully executed after recovering from an error");
	}
	catch(err) {

		console.error(err.message);
		console.error(err.stack);

		if(typeof retry === 'undefined' || retry > 0) {
			
			var args = Array.prototype.slice.call(arguments);
			
			if(args.length === 3)
				args.push(5);
			else
				retry--;

			this._queue.push(args);
			console.error("ClientStore.receive: Command re-queued after error");
		}
		else if(typeof retry !== 'undefined' && !retry)
			console.error("ClientStore.receive: Command failed");
		
		console.error("Arguments: " + JSON.stringify(arguments));		
		
	}
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

ClientStore.prototype.save = function() {
	var obj = this.get(id);
	for(var name in obj) {
		// Only store properties that have not been created in the browser
	}
};
