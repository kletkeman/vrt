function ClientStore () {
	
	Store.apply(this, arguments);
	this.data.queue = [];

};

ClientStore.prototype.__proto__ =  Store.prototype;

ClientStore.prototype.Tree =  function() {};

ClientStore.prototype.Tree.prototype.__proto__ = Store.prototype.Tree.prototype;

ClientStore.prototype.error = function(data) {
    return data.error ? $.extend(new Error(data.error.message), {stack: data.error.stack}) : undefined;
}

ClientStore.prototype.get = function(id, callback) {

	var response, context = this, error;
	
	$.ajax({
		  url: './api/v1/' + id,
		  dataType: 'json',
		  async: typeof callback === 'function',
		  success: function(data) {
            
            error = context.error(data);
              
		  	if(typeof callback === 'function')
				callback(error, data);
			else if(error)
				throw error;
              
            response = data;
              
		  }
		})
		.fail(function(xhr, statustext, err) {
			if(typeof callback === 'function')
		    	return callback(err);
			throw err;
		});

	if(error)
		throw error;

	return response;
};

ClientStore.prototype.data = function(id, callback) {

	var last_length = 0, context = this;

	if(this.data.queue.map(function(d) {return d[0];}).indexOf(id) > -1)
		return;
	else if(this.data.working)
		return this.data.queue.push(arguments);

	this.data.working = true;

	if(!this.data.queue.length && arguments.callee.caller.name !== "onsuccess_data_ajax_callback")
		this.data.msg = vrt.controls.message("Loading data, please wait...");

	function parse(e) {

	  	var r = typeof e === 'string' ? e : e.currentTarget.response, char; 

	  	r.substr(last_length).split("\n")
	  	 .forEach(function(d) {

	  		try {
	  			if(typeof callback === 'function')
	  				return callback(null, JSON.parse(d), last_length === r.length);
	  		} catch(e) {
	  			
	  			if( (char = d.match(/\W/)) && (char = char[0])) {
	  					last_length = (r.length - d.length);
	  			}
	  			else if(d.length && d.match(/[ \n\t\r]/gi) !== d.length) {
	  				if(typeof callback === 'function')
	  					return callback(e);
	  				throw e;
	  			}
	  		}
	  	});
		
		if(!char)
	  		last_length = r.length
	};

	vrt.log.info('Loading data for widget with id: '+id);
	
	return $.ajax('./api/v1/' + id + '/data',
		  {
		  async: true,
		  success : function (data) {

		  	if(!last_length)
		  		parse(data);

		  	if(typeof callback === 'function')
	  			callback(null, null, true);

		  	context.data.working = false;

		  	if(context.data.queue.length)
		  		setTimeout(function onsuccess_data_ajax_callback() {
		  			context.data.apply(context, context.data.queue.shift());		  	
		  		}, 0);
		  	else if(context.data.msg) {
		  		context.data.msg.remove();
		  		delete context.data.msg;
		  	}
		  		
		  },
		  xhrFields: {
			  onprogress: parse 
		  }
		
		})
		.fail(function(xhr, statustext, err) {
			throw err;
		});
	
};

ClientStore.prototype.delete = function(id, filter_index, path, callback) {
    
    var context = this, error, response;
    
    return $.ajax('./api/v1/' + id + '/data/delete',
		  {
          type: 'POST',
		  contentType: 'application/json',
		  dataType: 'text',
		  processData: false,
		  data: JSON.stringify({
              filter : (typeof filter_index === 'object' ? filter_index : undefined),
              index : (Number.isFinite(filter_index) ? filter_index : undefined),
              path : path
          }),
		  async: typeof callback === 'function',
		  success : function (data) {
              
			response = JSON.parse(data);
            error = context.error(response);
			
		    if(typeof callback === 'function')
				callback(error, response)
			else if(error)
				throw error;
		  }
		
		})
		.fail(function(xhr, statustext, err) {
			throw err;
		});
    
    if(error)
		throw error;

	return response;
    
};

ClientStore.prototype.list = function() {

	var args = Array.prototype.slice.call(arguments),
		response, error, context = this;

	if(typeof args[0] === 'object')
		return Store.prototype.list.apply(this, arguments);

	$.ajax({
		  url: './api/v1/list',
		  dataType: 'json',
		  async: false,
		  success: function(data) {
            
            if(error = context.error(data))
		      throw error;	
              
		    response = data;
		  }
		})
		.fail(function(xhr, statustext, err) {
			throw err;
		});

	if(error)
		throw error;

	return response;
	
};

ClientStore.prototype.reload = function(callback) {


	this.reload.progress && this.reload.progress.remove();	
	this.reload.progress = vrt.controls.message('Loading objects : 0%');	

	var ids = this.list(), 
		len = ids.length, i = 0, context = this;

	(function loadId() { i++;

		var id     = ids.pop(),
			config = context.get(id);

		vrt.create(config, false);

		if(!ids.length) {
			context.reload.progress.remove();
			if(typeof callback === 'function')
                callback();
			
		}
		else {
			
			context.reload.progress.remove();
			context.reload.progress = vrt.controls.message('Loading objects : ' + Math.ceil( (100 / len) * i) + '%');

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
	
    var error, context = this, response;
    
	return $.ajax({
		  url: './api/v1/' + id,
		  type: 'POST',
		  contentType: 'application/json',
		  dataType: 'text',
		  processData: false,
		  data: JSON.stringify(data),
		  async: typeof callback === 'function',
		  success: function(data) {
			
            response = JSON.parse(data);
            error = context.error(response);
			
			
		    if(typeof callback === 'function')
				callback(error, response)
			else if(error)
				throw error;
			
		  }
		})
		.fail(function(xhr, statustext, err) {
			
			if(typeof callback === 'function')
				callback(err);
			else
				throw err;
		});
    
    if(error)
		throw error;

	return response;
	
};

ClientStore.prototype.save = function(dataset, callback) {
    
    var error, context = this, response;
    
	dataset = vrt.type(dataset.type).prototype.toJSON.call(dataset);

	return this.get(dataset.id, function(err, sataset) {

		if(err) throw err;

		for(var k in sataset)
			if(typeof dataset[k] === 'undefined') {
				delete sataset[k];
				continue;
			}
			else if(typeof sataset[k] === 'object' && typeof dataset[k] === 'object')
				$.extend(true, sataset[k], dataset[k]);
			else
				sataset[k] = dataset[k];

		delete sataset['id'];

		return $.ajax({
		  url: './api/v1/' + dataset.id + '/save',
		  type: 'POST',
		  contentType: 'application/json',
		  dataType: 'text',
		  processData: false,
		  data: JSON.stringify(sataset),
		  async: (typeof callback === 'function'),
		  success: function(data) {
              
			response = JSON.parse(data);
            error = context.error(response);			
			
		    if(typeof callback === 'function')
				callback(error, response)
			else if(error)
				throw error;
			
		  }
		})
		.fail(function(xhr, statustext, err) {
			
			if(typeof callback === 'function')
				callback(err);
			else
				throw err;
		});
        
        if(error)
		  throw error;

	   return response;

	});
};
