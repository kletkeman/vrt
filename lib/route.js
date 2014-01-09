function pathRegexp(path, keys, sensitive, strict) {

	if ({}.toString.call(path) == '[object RegExp]') return path;
	if (Array.isArray(path)) path = '(' + path.join('|') + ')';

	path = path
		.concat(strict ? '' : '/?')
		.replace(/\/\(/g, '(?:/')
		.replace(/(\/)?(\.)?\[(\w+)\](?:(\(.*?\)))?(\?)?(\*)?/g,

			function(_, dot, format, key, capture, optional, star) {

				keys.push({
					name: key,
					optional: !! optional
				});
				dot = dot || '';

				return '' + (optional ? '' : dot) + '(?:' + (optional ? dot : '') + (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')' + (optional || '') + (star ? '(/*)?' : '');

			})
		.replace(/([\/.])/g, '\\$1')
		.replace(/\*/g, '(.*)');

	return new RegExp('^' + path + '$', sensitive ? '' : 'i');

};

function Route(path, bind, format, obj, options) {

	options = options || {};

	this.path = path;
	this.bind = bind;
	this.format = format;
	this.obj = obj;

	this.pathregexp = pathRegexp(path, this.keys = [], options.sensitive, options.strict);
	this.valuekey_ref_regexp = /^(\w+)\[(\w+)\]$/gi,
	this.data_ref_regexp = /^\{((\w+)|((\w+)\[(\w+)\]))\}$/gi;

	Route.routes.push(this);
};

Route.routes = [];

Route.router = function(path, data) {

	if (Guid && Guid.isGuid(path))
		return 0;

	for (var i = 0, len = this.routes.length, m = 0; i < len; i++)
		m += this.routes[i].dispatch(path, data);

	return m;
};

Route.remove = function() {
    
    var schema = typeof arguments[0] === 'object' ? arguments[0] : undefined,
        path   = typeof arguments[0] === 'string' ? arguments[0] : undefined;
    
    if(!schema && !path)
        throw new Error("Expected string or object");
    
    for(var i = 0, len = this.routes.length, route; i < len; i++) {
        
        if(route = this.routes[i])       
            if (path) route.match(path) && route.remove();
            else if (schema) {
                for(var path in schema)
                    route.match(path) && route.remove();
            }
        
        
    }
};

Route.prototype.remove = function() {

	var routes = Route.routes,
		i = 0,
		len = routes.length,
		route;

	while (len && i++ < len) {

		route = routes.shift();

		if (route && route !== this)
			routes.push(route);
		else {
            
			i--;
            
            vrt.log.debug("Route#remove() Remove route ", route.path, route.obj.id);
        }
	}
};

Route.prototype.dispatch = function(path, data) {

	if (this.match(path)) {

		if (!this.pack(data))
			return 0;

		this.obj.write(this.payload);

		return 1;
	}

	return 0;
};

Route.prototype.match = function(path) {

	this.pathregexp.compile(this.pathregexp);

	var keys = this.keys,
		params = this.params = [],
		m = this.pathregexp.exec(path);

	if (!m) return false;

	for (var i = 1, len = m.length; i < len; ++i) {

		var key = keys[i - 1];
		var val = 'string' == typeof m[i] ? decodeURIComponent(m[i]) : m[i];

		if (key) {
			params[key.name] = val;
		} else {
			params.push(val);
		}
	}

	return true;
};

Route.prototype.replace = function(s) {

	var context = this;

	return s.replace(/(\[\w+\])/gi, function(part) {
		return context.params[part.substr(1, part.length - 2)] || part;
	});
};

Route.prototype.prepare = function(key, value) {

	key = this.replace(key);
	value = this.replace(value);

	this.data_ref_regexp.compile(this.data_ref_regexp); // Bug - RegEx returns false even if match after it has been used in the if statement above
	this.valuekey_ref_regexp.compile(this.valuekey_ref_regexp);

	var dr_key = this.data_ref_regexp.exec(key),
		vk_value = this.valuekey_ref_regexp.exec(value);

	this.valuekey_ref_regexp.compile(this.valuekey_ref_regexp);

	var vk_dr_key = this.valuekey_ref_regexp.exec(dr_key = dr_key ? dr_key[1] : null),
		payload = this.payload,
		data = this.data,
		vindex, kindex, fallback = function(d) {
			return d;
		};


	(vindex = vk_value ? vk_value[2] : null) && (vk_value = vk_value[1]);
	(kindex = vk_dr_key ? vk_dr_key[2] : null) && (vk_dr_key = vk_dr_key[1]);

	if (dr_key) {
		if (vk_dr_key) {
			if (vk_value) {
				payload[vk_value][vindex] = (this.format[vk_value] === Object ||
					this.format[vk_value] === Array ?
					fallback : this.format[vk_value])(data[vk_dr_key][kindex]);
			} else {
				payload[value] = this.format[value](data[vk_dr_key][kindex]);
			}
		} else {
			if (vk_value) {
				payload[vk_value][vindex] = (this.format[vk_value] === Object ||
					this.format[vk_value] === Array ?
					fallback : this.format[vk_value])(data[dr_key]);
			} else {
				payload[value] = this.format[value](data[dr_key]);
			}
		}

	} else {

		if (vk_value) {
			payload[vk_value][vindex] = (this.format[vk_value] === Object ||
				this.format[vk_value] === Array ?
				fallback : this.format[vk_value])(key);
		} else {
			payload[value] = this.format[value](key);
		}
	}
};

Route.prototype.pack = function(data) {

	this.payload = $.extend({}, this.format), this.data = data;

	for (var key in this.payload) {
		if (typeof this.payload[key] === 'function')
			this.payload[key] = this.payload[key]();
	};

	for (var name in this.bind) {

		if (typeof this.bind[name] === 'string') {
			this.prepare(name, this.bind[name]);
		} else if (typeof this.bind[name] === 'object') {

			if (!(function(context) {

				var match = 0;

				for (var filter in context.bind[name]) {
					context.data_ref_regexp.compile(context.data_ref_regexp); // Bug - RegEx returns false even if match after it has been used in the if statement above

					if (typeof context.bind[name][filter] === 'object' && context.data_ref_regexp.test(filter)) {
						for (var key in context.bind[name][filter]) {
							if (context.replace(name) === key)
								(++match) && context.prepare(filter, context.bind[name][filter][key]);
						}

					} else if (typeof context.bind[name][filter] === 'string') {
						if (filter === name && typeof context.bind[name][filter] === 'string')
							context.prepare(filter, context.bind[name][filter]);
						else if (context.replace(name) === filter)
							(++match) && context.prepare(name, context.bind[name][filter]);
					}

				}

				return match;

			})(this))
				return false;
		}
	}

	return true;

};

module.exports = function(Api) {Api.Route = Route;};
