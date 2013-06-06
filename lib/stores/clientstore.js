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

Object.extend(ClientStore.prototype, Store.prototype);

ClientStore.prototype._queue = null;

ClientStore.prototype.get = function(id) {

	var response;

	new Ajax.Request(
		'./api/v1/'+id, {

			method: 'get',
			asynchronous: false,
			onSuccess: function(transport) {
				response = transport.responseJSON;
			},
			onFailure: function(transport) {
				throw new Error(transport.statusText);
			}
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


	new Ajax.Request(
		'./api/v1/list', {

			method: 'get',
			asynchronous: false,
			onSuccess: function(transport) {
				response = transport.responseJSON;
			},
			onFailure: function(transport) {
				throw new Error(transport.statusText);
			}
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

ClientStore.prototype.receive = function(id, eventHandlerName, data, retry) {

	try {
		vrt.Api.DataSet.collection[id][eventHandlerName](data);
		if(retry)
			console.debug("ClientStore.receive: A Command was successfully executed after recovering from an error");
	}
	catch(err) {

		console.error(err.message);

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
