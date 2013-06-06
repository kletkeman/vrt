
/**
 * @preserve Written by Odd Marthon Lende, Baker Hughes INTEQ
 *
 * Copyright 2012
 *
 *  Version 1.0
 *
 */
 
Ajax.Request.prototype.abort = function() {
	// prevent and state change callbacks from being issued
	this.transport.onreadystatechange = Prototype.emptyFunction;
	// abort the XHR
	this.transport.abort();
	// update the request counter
	Ajax.activeRequestCount--;
};

Array.prototype.top = function() {
	return this[this.length - 1];
};

Array.fill = function(value, size) {

	var pos = 0, arr = new Array();
	while(pos < size) {
		arr.push(value);
		pos++;
	}
	return arr;
}


Array.prototype.maximum = function() {

	var max = 0;

	for(var i = 0; i<this.length; i++)
		if(!max || max < this[i])
			max = this[i];

	return max;

};

Array.prototype.minimum = function() {

	var min = 0;

	for(var i = 0; i<this.length; i++)
		if(!min || min > this[i])
			min = this[i];

	return min;
	
};

Effect.Scroll = Class.create();
Object.extend(Object.extend(Effect.Scroll.prototype, Effect.Base.prototype), {

	initialize: function(element) {
		this.element = $(element);
		var options = Object.extend({
			'x': 0,
			'y': 0,
			'mode': 'absolute'
		}, arguments[1] || {});
		this.start(options);
	},
	setup: function() {
		if (this.options.continuous && !this.element._ext) {
			this.element.cleanWhitespace();
			this.element._ext = true;
			this.element.appendChild(this.element.firstChild);
		}

		this.originalLeft = this.element.scrollLeft;
		this.originalTop = this.element.scrollTop;

		if (this.options['mode'] == 'absolute') {
			this.options['x'] -= this.originalLeft;
			this.options['y'] -= this.originalTop;
		} else {

		}
	},
	update: function(position) {
		this.element.scrollLeft = this.options['x'] * position + this.originalLeft;
		this.element.scrollTop = this.options['y'] * position + this.originalTop;
	}
});

String.prototype.trim = function(chars) {
	return this.trimleft(this.trimright(this, chars), chars);
};

String.prototype.trimleft = function(chars) {
	chars = chars || "\\s";
	return this.replace(new RegExp("^[" + chars + "]+", "g"), "");
};

String.prototype.trimright = function(chars) {
	chars = chars || "\\s";
	return this.replace(new RegExp("[" + chars + "]+$", "g"), "");
};


Ajax.InPlaceEditor.prototype.__initialize = Ajax.InPlaceEditor.prototype.initialize;
Ajax.InPlaceEditor.prototype.__createEditField = Ajax.InPlaceEditor.prototype.createEditField;
Ajax.InPlaceEditor.prototype.__destroy = Ajax.InPlaceEditor.prototype.destroy;

Ajax.InPlaceEditor.prototype = Object.extend(Ajax.InPlaceEditor.prototype, {

	initialize: function(element, url, options) {

		var __options = options || {};

		__options.okControl = __options.okControl || false;
		__options.cancelControl = __options.cancelControl || false;
		__options.submitOnBlur = __options.submitOnBlur || true;
		__options.rows = __options.rows || 1;
		__options.size = __options.size || 20;
		__options.highlightColor = __options.highlightEndColor = 'none';
		__options.onComplete = __options.onComplete ||
		function(response, element) {
			element.innerHTML = (this.options.isPassword ? '' : (this._outputText || response['ms']));
			User.showMessage.call($(document.body), "Save completed successfully!");
			this.destroy();
		}.bind(this);

		this.__initialize(element, url, __options);

	},

	handleFormSubmission: function(e) {

		var form = this._form;
		var value = $F(this._controls.editor);

		this._outputText = value;

		if (this._controls.editor.options) 
			for (var i = 0; i < this._controls.editor.options.length; i++)
				if (this._controls.editor.options[i].selected) this._outputText = this._controls.editor.options[i].text;
		

		this.prepareSubmission();

		if(this.url instanceof Array && this.url.length === 3 && typeof this.url[2] === 'object') {

			this.url[2].value = parseInt(value) || value;
			this.url.push(this._boundWrapperHandler);

			Stream.send.apply(Stream, this.url);

		}
		else throw new Error("TypeError: Bad Argument");

		


		if (e) Event.stop(e);
	},
	getText: function() {
		return /\w.+\w/igm.exec(this.element.innerHTML.unescapeHTML());
	},
	createEditField: function(e) {

		this.__createEditField();

		if (this._controls.editor && this.options.isPassword) this._controls.editor.type = 'password';

		this.element

		for (var parent = this.element;parent !== document; parent = parent.up())
			parent.addClassName('editing');

	},
	destroy: function() {
		for (var parent = this.element;parent !== document; parent = parent.up())
			parent.removeClassName('editing');
		this.__destroy();
	}

});

Ajax.InPlaceCollectionEditor.prototype = Object.extend(Ajax.InPlaceCollectionEditor.prototype, {

	loadCollection: function() {

		this._form.addClassName(this.options.loadingClassName);
		this.showLoadingText(this.options.loadingCollectionText);

		Stream.send('request', 'keyvalue', this.options.loadCollectionURL, function(response) {

			if (response.error) {

				this.leaveEditMode();
				return false;
			}

			var _text = this.getText();
			this._collection = [];

			if (!response.empty) this._collection = response['ms'];

			this.checkForExternalText();

			for (var i = 0; i < this._controls.editor.options.length; i++) {
				var option = this._controls.editor.options[i];
				if (option.text == _text) option.selected = true;
			}

		}.bind(this));


	}

});

Ajax.Autocompleter.prototype.__initialize = Ajax.Autocompleter.prototype.initialize;

Ajax.Autocompleter.prototype = Object.extend(Ajax.Autocompleter.prototype, {

	initialize: function(element, update, url, options) {

		options = (options ? options : {});
		options['onShow'] = function(element, update) {

			for (var parent = element.up(), scrollTop = 0;parent !== document;parent = parent.up()) {

				if(parent.scrollTop)
					scrollTop += parent.scrollTop;
			}

			if (!update.style.position || update.style.position == 'absolute') {
				update.style.position = 'absolute';
				Position.clone(element, update, {
					setHeight: false,
					offsetTop: (element.offsetHeight + scrollTop)
				});
			} else if (update.style.position == 'relative' && typeof this.options.position == 'object' || typeof this.options.position == 'function') Position.clone(element, update, (typeof this.options.position == 'function' ? this.options.position() : this.options.position));

			Effect.Appear(update, {
				'duration': 0.15
			});

			return true;

		}.bind(this);

		this.__initialize(element, update, url, options);
	},
	getUpdatedChoices: function() {

		this.startIndicator();

		var url = (typeof this.url == "function" ? this.url() : this.url);

		if (!url) return false;

		var _search = url.split("=>");
		if (_search.length) {
			Stream.send('request', 'keyvalue', {
				'paths': [url],
				'search': [
					[_search[1], escape(this.getToken() + '%')].join("=>")],
				'limit': 25
			}, function(response) {

				if (response.error) {

					this.stopIndicator();					

					return false;
				}

				if (!response.empty) {

					var _ul = $(document.createElement("ul"));
					var o = this.options;

					response['ms'].each(function(r) {
						if (r) this.insert({
							'bottom': ('<li>' + r + '</li>')
						});
					}.bind(_ul));

					this.updateChoices(_ul.outerHTML);
					_ul = null;

				}

			}.bind(this));

		}

	},
	stopIndicator: function() {
		this.element.removeClassName('loading');
	},
	startIndicator: function() {
		this.element.addClassName('loading');
	}

});



bkElement.prototype.__pos = bkElement.prototype.pos;
bkElement.prototype.__construct = bkElement.prototype.construct;

bkElement.prototype = Object.extend(bkElement.prototype, {

	_body: null,
	pos: function() {

		var _position = this.__pos();

		if (!this._body) {

			var _body = Element.up(this);

			for (;;) {

				if (Element.hasClassName(_body, 'Frame_Overlay_Backdrop') || _body == document.body) break;

				_body = Element.up(_body);
			}

			this._body = _body;


		}

		_position[1] = _position[1] - this._body.scrollTop;

		return _position;

	}

});

nicEditorPane.prototype.__construct = nicEditorPane.prototype.construct;

nicEditorPane.prototype = Object.extend(nicEditorPane.prototype, {

	construct: function(D, C, B, A) {

		this.__construct(D, C, B, A);

		this._body = Overlay.top().Elements.Background || document.body;

		Event.observe(this._body, 'scroll', function() {
			this.hide();
		}.bind(this.pane));

		return this;
	}
});


Ajax.Responders._register = Ajax.Responders.register;
Ajax.Responders.register = function() {

	this._register.apply(this, arguments);

	this.responders = this.responders.sortBy(function(r) { return !(r.onCreate && r.onCreate === setWindowCookie); }).reverse();

};
