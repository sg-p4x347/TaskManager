class DomArray extends Array {
    constructor(parent) {
        super();
        this.parent = parent;
    }
    add(child) {
        // DOM manipulation
        this.parent.elem.appendChild(child.elem);
        // model manipulation
        child.parent = this.parent;
        super.push(child);
	}
	addRange(children) {
		if (Array.isArray(children)) children.forEach((child) => this.add(child));
	}
    remove(child) {
        for (var i = 0; i < this.length; i++) {
			if (this[i] === child) {
				// DOM manipulation
				this.parent.elem.removeChild(child.elem);
				// model manipulation
                this.splice(i, 1);
                return true;
            }
        }
        return false;
    }
	splice(index, count, ...items) {
        // DOM removal
        for (var i = index; i < index + count && i < super.length; i++) {
            this.parent.elem.removeChild(this[i].elem);
		}
        // model manipulation
		super.splice.apply(this, [index, count].concat(items));
		// DOM addition
		let insertBefore = this[index + items.length];
		for (let i = index; i < index + items.length; i++) {
			if (insertBefore) {
				// DOM manipulation
				this.parent.elem.insertBefore(this[i].elem, this.parent.elem.children[index]);
			} else {
				// DOM manipulation
				this.parent.elem.appendChild(this[i].elem);
			}
			// model manipulation
			this[i].parent = this.parent;
		}
	}
	where(predicate) {
		let results = [];
		this.forEach((child) => {
			if (predicate(child)) results.push(child);
		});
		return results;
	}
	ofType(type) {
		return this.where((child) => child instanceof type);
	}
}
class DomElement {
    constructor(elem) {
        this.elem = elem;
		let self = this;
		// setup standard event handlers
		this.addEventListener('click', function (evt) {
			if (typeof self.onclick === 'function') self.onclick(evt);
		});
	}
	get parent() {
		return this.m_parent;
	}
	set parent(value) {
		this.m_parent = value;
	}
    get innerHTML() {
        return this.elem.innerHTML;
    }
    set innerHTML(value) {
        this.elem.innerHTML = value;
	}
	get style() {
		return this.elem.style;
	}
	set style(val) {
		this.elem.style = val;
	}
    addClass(className) {
        this.elem.classList.add(className);
    }
    removeClass(className) {
        this.elem.classList.remove(className);
    }
    addEventListener(type, callback) {
        this.elem.addEventListener(type, callback);
	}
}
class Div extends DomElement {
    constructor(children) {
        super(document.createElement("div"));
		this.children = new DomArray(this);
		this.children.addRange(children);
	}
}
class Input extends DomElement {
	constructor(value) {
		super(document.createElement("input"));
		if (value !== undefined) this.elem.value = value;
	}
	get value() {
		return this.elem.value;
	}
	set value(val) {
		this.elem.value = val;
	}
}
class Textbox extends Input {
	constructor(value) {
		super(value);
		this.elem.type = 'text';
	}
}
class Textarea extends DomElement {
	constructor(value) {
		super(document.createElement("textarea"));
	}
	get value() {
		return this.elem.value;
	}
	set value(val) {
		this.elem.value = val;
	}
}
class Head extends Div {
    constructor() {
        super();
        this.elem = document.getElementsByTagName("head")[0];
    }
    addScript(src) {
        var script = document.createElement("script");
        script.src = src;
        script.type = "text/javascript";
        this.elem.appendChild(script);
    }
    addStyle(href) {
        var style = document.createElement("link");
        style.href = href;
        style.type = "text/css";
        this.elem.appendChild(style);
    }
}
class Body extends Div {
    constructor() {
        super();
        this.elem = document.getElementsByTagName("body")[0];
    }
}

//----------------------------------------------------------------
// CSS declarations

function width(val) {
	return `width:${val};`;
}
function height(val) {
	return `height:${val};`;
}
function alignItems(type) {
	return `align-items:${type};`;
}
function justifyContent(type) {
	return `justify-content:${type};`;
}
let scrollable = 'overflow-y:auto;';
let row = `
display:flex;
flex-direction:row;
`;
let column = `=
display:flex;
flex-direction:column;
`;
let centerHorizontal = `
margin-left:auto;
margin-right:auto;
`;
let noshrink = `
flex-shrink:0;
`;
let circle = `
border-radius:50%;
`;
function background(val) {
	
	if (val.match(/#[0-9a-fA-F]{6}/)
		|| val.match(/rgb\(/)
		|| val.match(/rgba\(/)
		|| val.match(/^\w+$/)) {
		return `background-color:${val};`;
	} else {
		return `background-image:url('${val}');`;
	}
}
function color(val) {

	if (val.match(/#[0-9a-fA-F]{6}/)
		|| val.match(/rgb\(/)
		|| val.match(/rgba\(/)
		|| val.match(/^\w+$/)) {
		return `color:${val};`;
	}
}
function dropShadow(radius) {
	return `box-shadow:0 0 ${radius} rgba(0,0,0,0.4)`;
}
function insetShadow(radius) {
	return `box-shadow:0 0 ${radius} rgba(0,0,0,0.4) inset`;
}