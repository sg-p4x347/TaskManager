
function main() {
	let head = new Head();
	let body = new Body();

	body.children.add(modal);
	body.children.add(app);
	
}
class App extends Div {
	constructor() {
		super();
		let self = this;
		this.lastID = 0;


		let tree = new TreeView();
		tree.addClass('fixed');
		function newNode(task) {
			let node = new TreeNode(task);
			node.name = task.name;
			task.addEventListener('nameChanged', () => {
				node.name = task.name;
			});
			return node;
		}
		tree.addEventListener('nodeSelected', (evt) => {
			let node = evt.detail;
			if (self.children.length > 1) {
				self.children.remove(self.children[1]);
			}
			self.children.add(node.model);
			// hook into task changes
			node.model.addEventListener('childTaskAdded', (e) => {
				let childNode = newNode(e.detail);
				node.addChild(childNode);
			});
		});
		
		// initialize the tree with some dummy nodes
		let version1 = newNode(this.newTask("Version 1"));

		let task1 = newNode(this.newTask("A Task"));
		version1.addChild(task1);

		tree.rootNode = version1;
		this.tree = tree;
		this.children.add(tree);
	}
	newTask(name) {
		let task = new Task(++this.lastID);
		if (name) task.name = name;
		return task;
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
		this.body.children.add(node);
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
	static copy(node) {
		let copy = new TreeNode(node.model);
		copy.name = node.name;
		// copy children recursively
		node.body.children.forEach(child => copy.addChild(TreeNode.copy(child)));

		return copy;
	}
}
class TreeView extends Div {
	constructor() {
		super();
		this.style =
			column
			+ width('400px')
			+ height('100%')
			+ background('rgba(32,32,32,0.75)')
			+ dropShadow('32px');
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
	static copy(tree) {
		let copy = new TreeView();
		copy.rootNode = TreeNode.copy(tree.rootNode);
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
				this.children.add(self.nameEditor);
				this.children.add(self.descriptionEditor);
				
			}
		}();

		
		this.id = id;
		this.name = "A task";


		this.dependencies = new TaskList();
		this.dependencies.addEventListener('taskAdded', (evt) => {
			self.elem.dispatchEvent(new CustomEvent('childTaskAdded', { detail: evt.detail }));
		});
		this.children.add(self.body);
		this.children.add(self.dependencies);

		
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
}
class SpriteButton extends Div {
	constructor(type) {
		super();
		this.addClass('ui-sprite');
		this.addClass('btn');
		this.addClass(type);
	}
}
class TaskList extends Div {
	constructor() {
		super();

		this.addClass('task-list');

		let self = this;
		this.addBtn = new SpriteButton('plus');
		this.addBtn.addEventListener('click', (evt) => {
			self.add();
		});
		this.children.add(this.addBtn);
	}
	add() {
		let taskList = this;
		class TaskListItem extends Div {
			constructor() {
				super();
				//----------------------------------------------------------------
				// Style
				this.addClass('item');
				//----------------------------------------------------------------
				// Model
				let self = this;
				this.nameEditor = new Textbox();
				this.nameEditor.addClass('text-editor');
				this.linkToExisting = new SpriteButton('link');
				this.linkToExisting.addEventListener('click', (evt) => {
					self.openLinkTree();
				});
				this.children.add(this.nameEditor);
				this.children.add(this.linkToExisting);
			}
			openLinkTree() {
				let self = this;
				let tree = TreeView.copy(app.tree);
				tree.addEventListener('nodeSelected', (evt) => {
					self.nameEditor.value = evt.detail.model.name;
					self.task = evt.detail.model;
					modal.close();
				});
				modal.open(tree);
			}
			get task() {
				return this.m_task;
			}
			set task(task) {
				this.m_task = task;
				taskList.elem.dispatchEvent(new CustomEvent('taskAdded', { detail: task }));
			}
		}
		this.children.add(new TaskListItem());
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
	}
	close() {
		this.addClass('hidden');
		this.children.clear();
	}
}
// Global utility
let modal = new ModalWindow();
let app = new App();