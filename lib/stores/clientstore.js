function ClientStore () {
	
	Store.apply(this, arguments);
	this.data.queue = [];

};

ClientStore.prototype.__proto__ =  Store.prototype;

ClientStore.prototype.Tree =  function() {};

ClientStore.prototype.Tree.prototype.__proto__ = Store.prototype.Tree.prototype;

ClientStore.prototype.get = function(id, callback) {

	var response;
	
	$.ajax({
		  url: './api/v1/' + id,
		  dataType: 'json',
		  async: typeof callback === 'function',
		  success: function(data) {

		  	if(typeof callback === 'function')
				callback(data.error ? new Error(data.error) : undefined, data)
			else if(data.error)
				throw new Error(data.error);
              
            response = data;
              
		  }
		})
		.fail(function(xhr, statustext, err) {
			if(typeof callback === 'function')
		    	return callback(err);
			throw err;
		});

	if(response && response.error)
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
			vrt.controls.message("<span style=\"font-size: 18pt;\">Welcome to VRT</span>", "<br /><span style=\"font-size: 12pt;\">Move the cursor to the top to display the toolbar</span>", "<span style=\"font-size: 16pt;\">&uarr;</span>", 10000);	
			
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
	
	return $.ajax({
		  url: './api/v1/' + id,
		  type: 'POST',
		  contentType: 'application/json',
		  dataType: 'text',
		  processData: false,
		  data: JSON.stringify(data),
		  async: typeof callback === 'function',
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

	dataset = vrt.Api[dataset.type.capitalize()].prototype.toJSON.call(dataset);

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
		  async: true,
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

	});
};
