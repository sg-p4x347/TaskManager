function ajax(url, method, data, dataHandler) {
	url = new URL(window.location.origin + url);
	let request = new XMLHttpRequest();
	request.open(method, url.href);
	if (dataHandler)
		request.addEventListener('load', (response) => {
			dataHandler(request.response);
		});
	if (method === 'GET') {
		for (let qp in data) {
			url.searchParams.set(qp, data[qp]);
		}
		request.send();
	} else if (method === 'POST') {
		request.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
		request.send(JSON.stringify(data));
	}
	
	
	
}
function main() {
	let head = new Head();
	let body = new Body();

	body.children.add(modal);
	body.children.add(app);
	
}
class App extends Div {
	constructor() {
		super();
		//----------------------------------------------------------------
		// Style
		this.addClass('app');

		//----------------------------------------------------------------
		// Model
		let self = this;
		this.lastID = 0;


		let tree = new TreeView();
		tree.addClass('fixed');
		
		tree.addEventListener('nodeSelected', (evt) => {
			let node = evt.detail;
			let currentTask = self.children.find(c => c.elem.classList.contains('task'));
			if (currentTask) {
				self.children.remove(currentTask);
			}
			self.children.add(node.model);
			
		});
		
		
		this.tree = tree;
		this.children.add(tree);

		
		let saveBtn = new SpriteButton('save', (evt) => {
			//localStorage.setItem('app', JSON.stringify(app.export()));
			ajax('/update', 'POST', app.export());
		});
		let priorityBtn = new SpriteButton('exclamation', (evt) => {
			self.analyzePriority();
		});

		let toolbar = new Row([priorityBtn,saveBtn]);
		toolbar.addClass('toolbar');
		this.children.add(toolbar);

		// try to get data from the server
		ajax('/get', 'GET', {}, (data) => {
			let appData = JSON.parse(data);
			if (appData) {
				this.import(appData);
			} else {
				// initialize the tree with a dummy node
				tree.rootNode = this.newNode(this.newTask("Root"));
			}
		});
		
	}
	newTask(name) {
		let task = new Task(++this.lastID);
		if (name) task.name = name;
		return task;
	}
	newNode(task) {
		let self = this;
		let node = new TreeNode(task);
		node.name = task.name;
		task.addEventListener('nameChanged', () => {
			node.name = task.name;
		});
		// hook into task changes
		task.addEventListener('childTaskAdded', (e) => {
			e.stopPropagation();
			let childNode = self.newNode(e.detail);
			node.addChild(childNode);
		});
		task.addEventListener('childTaskRemoved', (e) => {
			e.stopPropagation();
			node.removeChild(node.childNodes[e.detail.childIndex]);
		});
		// recursively construct child nodes from child tasks
		task.childTasks.forEach(childTask => node.addChild(self.newNode(childTask)));
		return node;
	}
	analyzePriority() {
		let form = new Form();
		form.addClass('form');
		let table = new Table();
		table.addClass('priority-report');
		this.tree.rootNode.model.analyzePriority().forEach((task, index) => {
			let priorityItem = new TableRow([
				new TableData([paragraph(task.name)]),
				new TableData([paragraph(task.priority)])
			]);
			priorityItem.addClass('priority-item');
			
			table.rows.add(priorityItem);
		});
		form.children.add(table);
		modal.open(form);
	}
	import(data) {
		// first create the tasks
		let tasks = {};
		this.lastID = 0;
		for (let id in data.tasks) {
			let task = new Task();
			task.import(data.tasks[id]);
			tasks[id] = task;
			this.lastID = Math.max(id, this.lastID);
		}
		// link tasks
		for (let id in tasks) {
			let task = tasks[id];
			data.tasks[task.id].children.forEach((childID) => {
				task.addChild(tasks[childID]);
			});
		}
		// create root node
		this.tree.rootNode = this.newNode(tasks[data.rootTask]);
	}
	export() {
		let self = this;
		let tasks = {};
		function mapIfMissing(task) {
			if (!tasks[task.id]) {
				tasks[task.id] = task.export();
				// recurse
				task.childTasks.forEach(child => mapIfMissing(child));
			}
		}
		let rootTask = self.tree.rootNode.model;
		mapIfMissing(rootTask);
		return {
			tasks: tasks,
			rootTask: rootTask.id
		};
	}
}

class TreeNode extends Div {
	constructor(model) {
		super();
		//----------------------------------------------------------------
		// Style
		this.style = column;
		this.addClass('tree-node');
		
		//----------------------------------------------------------------
		// Model
		let self = this;
		this.model = model;
		this.expanded = true;
		this.onclick = (evt) => {
			evt.stopPropagation();
			self.parent.select(this);
		};

		//----------------------------------------------------------------
		// Node Header
		this.header = new class TreeNodeHeader extends Div {
			constructor() {
				super();
				this.addClass('header');
				//----------------------------------------------------------------
				// Node text
				let text = new Div();
				text.addClass('text');
				this.text = text;
				//----------------------------------------------------------------
				// Toggle button
				self.toggleBtn = new SpriteButton();
				self.toggleBtn.addClass('invisible');
				self.toggleBtn.addEventListener('click', (evt) => {
					evt.stopPropagation();
					self.toggle();
				});

				this.children.add(self.toggleBtn);
				this.children.add(text);
			}
		}();
		//----------------------------------------------------------------
		// Node body (child node container)
		this.body = new class TreeNodeBody extends Div {
			constructor() {
				super();
				this.style =
					column
					+ 'margin-left:16px';
			}
			select(node) {
				this.parent.select(node);
			}
		}();

		this.children.add(this.header);
		this.children.add(this.body);

		this.toggle();
	}
	set name(value) {
		this.header.text.innerHTML = value;
	}
	get name() {
		return this.header.text.innerHTML;
	}
	// recursively pass selection up the tree
	select(node) {
		this.parent.select(node);
	}
	set selected(value) {
		if (value) {
			this.addClass('selected');
			
		} else {
			this.removeClass('selected');
		}
		// recursively remove selected class from any children
		this.body.children.forEach((child) => child.selected = false);
	}
	addChild(node) {
		node.tree = this.tree;
		this.toggleBtn.removeClass('invisible');
		this.childNodes.add(node);
	}
	removeChild(node) {
		this.childNodes.remove(node);
		if (this.childNodes.length === 0)
			this.toggleBtn.addClass('invisible');
	}
	get childNodes() {
		return this.body.children;
	}
	toggle() {
		if (this.expanded) {
			// collapse
			this.toggleBtn.removeClass('down');
			this.toggleBtn.addClass('right');
			this.body.addClass('hidden');
		} else {
			// expand
			this.toggleBtn.removeClass('right');
			this.toggleBtn.addClass('down');
			this.body.removeClass('hidden');
		}

		this.expanded = !this.expanded;
	}
	nodesByModelRecursive(model) {
		let self = this;
		let results = [];
		if (self.model === model) results.push(this);
		self.body.children.forEach(childNode => {
			results = results.concat(childNode.nodesByModelRecursive(model));
		});
		return results;
	}
	nodesByModel(model) {
		return this.childNodes.Where(child => child.model === model);
	}
	static copy(node,nodeFactory) {
		let copy = nodeFactory(node.model);
		// copy children recursively
		node.body.children.forEach(child => copy.addChild(TreeNode.copy(child,nodeFactory)));

		return copy;
	}
}
class TreeView extends Div {
	constructor() {
		super();
		this.addClass('tree');
	}
	get rootNode() {
		return this.m_rootNode;
	}
	set rootNode(node) {
		node.tree = this;
		this.m_rootNode = node;
		this.children.set(this.rootNode);
	}
	select(node) {
		this.selectedNode = node;
	}
	get selectedNode() {
		return this.m_selectedNode;
	}
	set selectedNode(node) {
		this.m_selectedNode = node;
		this.rootNode.selected = false;
		node.selected = true;
		this.elem.dispatchEvent(new CustomEvent('nodeSelected', { detail: node }));
	}
	nodesByModelRecursive(model) {
		return this.rootNode.nodesByModelRecursive(model);
	}
	static copy(tree,nodeFactory) {
		let copy = new TreeView();
		copy.rootNode = TreeNode.copy(tree.rootNode,nodeFactory);
		return copy;
	}
}
class Task extends Div {
	constructor(id) {
		super();
		//----------------------------------------------------------------
		// Style
		this.addClass('task');
		//----------------------------------------------------------------
		// Events
		this.nameChanged = new Event('nameChanged');
		//----------------------------------------------------------------
		// Model
		let self = this;
		this.nameEditor = new Textbox();
		this.nameEditor.addClass('text-editor');
		this.nameEditor.addClass('text-center');
		
		this.nameEditor.addEventListener('change', (evt) => {
			self.elem.dispatchEvent(self.nameChanged);
		});
		this.descriptionEditor = new Textarea();
		this.descriptionEditor.addClass('text-editor');
		this.body = new class extends Div {
			constructor() {
				super();
				this.addClass('body');
				
				this.children.add(paragraph('Name','heading'));
				this.children.add(self.nameEditor);
				this.children.add(paragraph('Description', 'heading'));
				this.children.add(self.descriptionEditor);
				this.children.add(paragraph('Child tasks', 'heading'));
			}
		}();

		
		this.id = id;
		this.name = "A task";
		this.parentTasks = [];
		this.priority = 0;

		this.childTaskList = new TaskList(this);
		this.childTaskList.addEventListener('taskAdded', (evt) => {
			evt.stopPropagation();
			self.elem.dispatchEvent(new CustomEvent('childTaskAdded', { detail: evt.detail }));
		});
		this.childTaskList.addEventListener('taskRemoved', (evt) => {
			evt.stopPropagation();
			self.elem.dispatchEvent(new CustomEvent('childTaskRemoved', { detail: evt.detail }));
		});
		this.children.add(self.body);
		this.children.add(self.childTaskList);

		
	}
	get childTasks() {
		return this.childTaskList.tasks;
	}
	addChild(task) {
		task.parentTasks.push(this);
		this.childTaskList.addListItem(task);
	}
	analyzePriority() {
		let self = this;
		this.executeRecursiveBottomUp((child, parent) => {
			child.priority = child.parentTasks.Sum(p => p.priority) + 1;
		});
		// sort by priority
		let results = [];
		let visited = {};
		this.executeRecursive((child) => {
			if (!visited[child.id]) {
				visited[child.id] = true;
				results.push(child);
			}
		});
		return results.sort((a, b) => b.priority - a.priority);
	}
	executeRecursiveBottomUp(callback, parent) {
		let self = this;
		self.childTasks.forEach(child => {
			callback(child, parent);
			child.executeRecursiveBottomUp(callback,child);
		});
	}
	executeRecursive(callback) {
		let self = this;
		self.childTasks.forEach(child => {
			callback(child, self);
			child.executeRecursive(callback);
		});
	}
	isDesendant(task) {
		return this.childTasks.Any(child => child === task || child.isDesendant(task));
	}
	get name() {
		return this.nameEditor.value;
	}
	set name(value) {
		this.nameEditor.value = value;
		this.elem.dispatchEvent(this.nameChanged);
	}
	get description() {
		return this.descriptionEditor.value;
	}
	set description(value) {
		this.descriptionEditor.value = value;
	}
	import(data) {
		this.id = data.id;
		this.name = data.name;
		this.description = data.description;
	}
	export() {
		return {
			id: this.id,
			name: this.name,
			description: this.description,
			children: this.childTasks.Select(child => child.id)
		};
	}
}
class Sprite extends Div {
	constructor(type) {
		super();
		this.addClass('ui-sprite');
		this.addClass(type);
	}
}
class SpriteButton extends Sprite {
	constructor(type,clickCallback) {
		super(type);
		this.addClass('btn');
		if (clickCallback)
			this.addEventListener('click', clickCallback);
	}
}
class Column extends Div {
	constructor(children) {
		super(children);
		this.addClass('column');
	}
}
class Row extends Div {
	constructor(children) {
		super(children);
		this.addClass('row');
	}
}
function paragraph(text,classNames) {
	let div = new Div();
	div.innerHTML = text;
	if (typeof classNames === 'string') {
		div.addClass(classNames);
	} else if (Array.isArray(classNames)) {
		classNames.forEach(className => div.addClass(className));
	}
		
	return div;
}
class TaskListItem extends Div {
	constructor(task,list) {
		super();
		//----------------------------------------------------------------
		// Style
		this.addClass('item');
		//----------------------------------------------------------------
		// Model
		let self = this;
		this.nameDiv = paragraph(task.name);
		
		this.task = task;

		task.addEventListener('nameChanged', (evt) => self.name = task.name);

		let gotoBtn = new SpriteButton('link', (evt) => {
			let nodes = app.tree.nodesByModelRecursive(task);
			app.tree.select(nodes[0]);
			nodes.forEach(node => node.selected = true);
		});
		gotoBtn.style = 'margin-left:auto;';
		let removeBtn = new SpriteButton('trash', (evt) => {
			list.removeListItem(self);
		});


		this.children.add(removeBtn);
		this.children.add(this.nameDiv);
		this.children.add(gotoBtn);
	}
	get name() {
		return this.nameDiv.innerHTML;
	}
	set name(value) {
		this.nameDiv.innerHTML = value;
	}
}
class TaskList extends Div {
	constructor(parentTask) {
		super();

		this.addClass('task-list');

		let self = this;
		this.parentTask = parentTask;
		let addBtn = new SpriteButton('plus',(evt) => {
			self.addNew();
		});
		let linkToExisting = new SpriteButton('graph',(evt) => {
			self.addExisting();
		});
		let header = new class Header extends Row {
			constructor() {
				super();
				this.addClass('header');

				this.children.add(addBtn);
				this.children.add(linkToExisting);
			}
		}();
		this.body = new Column();
		this.children.add(header);
		this.children.add(this.body);
	}
	get tasks() {
		return this.body.children.Select(taskItem => taskItem.task);
	}
	addListItem(task) {
		let self = this;
		this.body.children.add(new TaskListItem(task, self));
		self.elem.dispatchEvent(new CustomEvent('taskAdded', { detail: task }));
	}
	removeListItem(listItem) {
		let self = this;
		let childIndex = self.body.children.indexOf(listItem);
		self.body.children.remove(listItem);
		self.elem.dispatchEvent(new CustomEvent('taskRemoved', {
			detail:
			{
				child: listItem.task,
				parent: self.parentTask,
				childIndex: childIndex
			}
		}));
	}
	addNew() {
		let self = this;
		let form = new Form();
		form.addClass('column');
		form.addClass('form');

		let errorMessage = paragraph('');
		errorMessage.addClass('error-message');
		errorMessage.addClass('hidden');
		form.children.add(errorMessage);

		form.children.add(paragraph('Name', ['heading','text-center']));

		let nameBox = new Textbox();
		nameBox.addClass('text-center');
		nameBox.addClass('text-editor');
		form.children.add(nameBox);

		let submit = new Button('Submit');
		submit.addClass('btn');
		submit.addClass('submit');
		submit.elem.type = 'submit';

		form.children.add(submit);
		form.addEventListener('submit', (evt) => {
			evt.preventDefault();
			if (nameBox.value) {
				let task = app.newTask(nameBox.value);
				self.addListItem(task);
				modal.close();
			} else {
				errorMessage.innerHTML = "Please specify a name";
				errorMessage.removeClass('hidden');
			}
		});
		modal.open(form);
		nameBox.elem.focus();
	}
	addExisting() {
		let self = this;
		let form = new Form();
		form.addClass('column');
		form.addClass('form');

		let errorMessage = paragraph('');
		errorMessage.addClass('error-message');
		errorMessage.addClass('hidden');
		form.children.add(errorMessage);

		let tree = TreeView.copy(app.tree, task => {
			let node = new TreeNode(task);
			node.name = task.name;
			return node;
		});
		tree.rootNode.toggle();
		tree.addEventListener('nodeSelected', (evt) => {
			let task = evt.detail.model;
			if (task !== self.parentTask && !task.isDesendant(self.parentTask)) {
				self.addListItem(task);
				modal.close();
			} else {
				errorMessage.removeClass('hidden');
				errorMessage.innerHTML = "You cannot create a circular dependency";
			}
		});
		form.children.add(tree);

		modal.open(form);
	}
	
}
class ModalWindow extends Div {
	constructor() {
		super();
		//----------------------------------------------------------------
		// Style
		this.addClass('modal-backdrop');
		this.addClass('hidden');
		//----------------------------------------------------------------
		// Model
		let self = this;
		this.addEventListener('click', (evt) => {
			if (evt.srcElement === self.elem) {
				self.close();
			}
		});
	}
	get isOpen() {
		return this.children.length > 0;
	}
	open(model) {
		this.children.set(model);
		this.removeClass('hidden');
		app.addClass('blur');
	}
	close() {
		this.addClass('hidden');
		this.children.clear();
		app.removeClass('blur');
	}
}
// Global utility
let modal = new ModalWindow();
let app = new App();