function ClientStore () {};

Object.extend(ClientStore.prototype, Store.prototype);

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

ClientStore.prototype.receive = function(id, eventHandlerName, data) {
	vrt.Api.DataSet.collection[id][eventHandlerName](data);
};
