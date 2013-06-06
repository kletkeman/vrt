
/**
 * @preserve Written by Odd Marthon Lende, Baker Hughes INTEQ
 *
 * Copyright 2012
 *
 *  Version 1.0
 *
 */
 
var Time  =  function() {

	this._mode = 0;	
	this._time = new Date();	

	return this;

};

Time.prototype.setMode = function(mode) {
	// Kunne sette forskjellig modus feks tekst basert og klokke basert
};

Time.prototype.init = function(time) {
	this._time = time || new Date();
};

Time.prototype.diff = function(other) {

	var reference = this._time.getTime();
	var comparer = other.getTime();

	var d = Math.round((reference - comparer) / this._days());
	var h = Math.round((reference - comparer) / this._hours());
	var m = Math.round((reference - comparer) / this._minutes());
	var s = Math.round((reference - comparer) / this._seconds());
	var y = Math.round(d / 365);

	return {
		'days': d,
		'hours': h,
		'minutes': m,
		'seconds': s,
		'years': y
	};
};

Time.prototype.toString = function(other) {

	var reference = this._time.getTime();
	var comparer = other.getTime();

	var _diff = this.diff(other);

	var d = _diff['days'];
	var h = _diff['hours'];
	var m = _diff['minutes'];
	var s = _diff['seconds'];
	var y = _diff['years'];

	if (d >= 1) {
		if (d <= 7) return 'on ' + this.Day(other.getDay() - 1);
		else if (y < 1 && d > 30) return 'on ' + User.Time().Day(other.getDay() - 1) + ', ' + User.Time().Month(other.getMonth()) + ' ' + other.getDate() + User.Time().Ordinal(other.getDate());
		else if (y >= 1) return y + ' ' + (y > 1 ? 'years' : 'year') + ' ago';
		else return d + ' ' + (d > 1 ? 'days' : 'day') + ' ago';
	} else if (h >= 1) {

		return 'about ' + h + ' ' + (h > 1 ? 'hours' : 'hour') + ' ago';
	} else if (m >= 1) {

		return 'about ' + m + ' ' + (m > 1 ? 'minutes' : 'minute') + '  ago';
	} else {
		if (s < 1) s = 1;
		return 'about ' + s + ' ' + (s > 1 ? 'seconds' : 'second') + ' ago';
	}

};

Time.prototype.padZero = function(n) {
	if (n < 10) return '0' + n;
	else return n;
};

		
Time.prototype._seconds = function() {
	return 1000;
};

Time.prototype._minutes = function() {
	return (this._seconds() * 60);
};

Time.prototype._hours = function() {
	return (this._minutes() * 60);
};

Time.prototype._days = function() {
	return (this._hours() * 24);
};

Time.prototype._years = function() {
	return (this._days() * 365);
};

Time.prototype.Day = function(dayOfWeek) {
	switch (dayOfWeek) {
		case 0:
			return 'Monday';
		case 1:
			return 'Tuesday';
		case 2:
			return 'Wednesday';
		case 3:
			return 'Thursday';
		case 4:
			return 'Friday';
		case 5:
			return 'Saturday';
		case 6:
			return 'Sunday';
		default:
			break;
		}

};

Time.prototype.Month = function(monthOfYear) {

	switch (monthOfYear) {
		case 0:
			return 'January';
		case 1:
			return 'Febuary';
		case 2:
			return 'March';
		case 3:
			return 'April';
		case 4:
			return 'May';
		case 5:
			return 'June';
		case 6:
			return 'July';
		case 7:
			return 'August';
		case 8:
			return 'September';
		case 9:
			return 'October';
		case 10:
			return 'November';
		case 11:
			return 'December';
		default:
			return '';
		}

};

Time.prototype.Ordinal = function(number) {

	var __number;
	if (number > 20) {
		var numbers = number.toString().match(/\d/gi);
		if (numbers) __number = parseInt(numbers[numbers.length - 1]);
	} else __number = number;


	if (__number) switch (__number) {
	case 1:
		return 'st';
	case 2:
		return 'nd';
	case 3:
		return 'rd';
	default:
		return 'th';
	};
};