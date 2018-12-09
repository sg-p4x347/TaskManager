// Purpose : Supply utility functions for enumerated arrays of objects

Array.prototype.Where = function(predicate) {
	var result = [];
	this.forEach(function(element) {
		if (predicate(element))
			result.push(element);
	});
	return result;
}

Array.prototype.Find = function(predicate) {
	var result = null;
	this.some(function(element) {
		if (predicate(element)) {
			result = element;
			return true;
		}
	});
	return result;
}

Array.prototype.Select = function(selector) {
	var result = [];
	this.forEach(function(element) {
		result.push(selector(element));;
	});
	return result;
}

Array.prototype.Count = function(predicate) {
	var count = 0;
	this.forEach(function(element) {
		if (predicate(element))
			count++;
	});
	return count;
}

Array.prototype.Sum = function(predicate) {
	var sum = 0;
	this.forEach(function(element) {
		let value = predicate(element);
		if (typeof value === 'number')
			sum += value;
	});
	return sum;
}

Array.prototype.Contains = function(element) {
	return this.some(function(e) {
		if (e == element) return true;
	});
}

Array.prototype.IndexOf = function (element) {
	var index = -1;
	this.some(function(e,i) {
		if (e == element) {
			index = i;
			return true;
		}
	});
	return index;
}

Array.prototype.Remove = function (element) {
	var index = this.IndexOf(element);
	if (index !== -1)
		this.splice(index,1);
}
Array.prototype.Max = function(predicate) {
	let max = -Infinity;
	this.forEach((element) => {
		let value = predicate(element);
		if (value > max) {
			max = value;
		}
	});
	return max;
}
Array.prototype.Clear = function() {
	this.splice(0,this.length);
}
Array.prototype.Any = function(predicate) {
	return this.some(function(element) {
		if (predicate(element)) return true;
	});
}
HTMLCollection.prototype.forEach = function(callback)  {
	for (let i = 0; i < this.length; i++) {
		callback(this[i],i);
	}
}