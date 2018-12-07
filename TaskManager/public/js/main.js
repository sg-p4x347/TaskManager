function main() {
	let head = new Head();
	let body = new Body();

	let version1 = new Task('Version1');
	let tree = new TreeView(new TreeNode(version1.name,version1));
	tree.nodeSelected = (node) => {
		if (body.children.length > 1) {
			body.children.remove(body.children[1]);
		}
		body.children.add(node.model);
	};
	body.children.add(tree);

	let task1 = new Task('Go to bed');
	tree.rootNode.addChild(new TreeNode(task1.name, task1));
}

class TreeNode extends Div {
	constructor(name,model) {
		super();
		//----------------------------------------------------------------
		// Style
		this.style = column;
		this.addClass('tree-node');
		
		//----------------------------------------------------------------
		// Model
		let self = this;
		this.model = model;
		this.model.addEventListener('nameChanged', (evt) => {
			self.name = self.model.name;
		});
		this.expanded = true;
		this.onclick = (evt) => {
			evt.stopPropagation();
			self.tree.selectedNode = self;
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
				self.toggleBtn = new class TreeNodeToggle extends Div {
					constructor() {
						super();
						this.addClass('ui-sprite');
						this.addClass('btn');
						this.onclick = (evt) => {
							evt.stopPropagation();
							self.toggle();
						};
					}
				}();

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
		}();

		this.children.add(this.header);
		this.children.add(this.body);

		this.toggle();
		this.name = name || '';
	}
	set name(value) {
		this.header.text.innerHTML = value;
	}
	get name() {
		return this.header.text.innerHTML;
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
}
class TreeView extends Div {
	constructor(rootNode) {
		super();
		this.style =
			column
			+ width('400px')
			+ height('100%')
			+ background('rgba(32,32,32,0.75)')
			+ dropShadow('32px');
		this.addClass('tree');
		this.rootNode = rootNode || new TreeNode('root');
		this.rootNode.tree = this;
		this.children.add(this.rootNode);
	}
	get selectedNode() {
		return this.m_selectedNode;
	}
	set selectedNode(node) {
		this.m_selectedNode = node;
		this.rootNode.selected = false;
		node.selected = true;
		if (typeof this.nodeSelected === 'function') {
			this.nodeSelected(node);
		}
	}
}
class Task extends Div {
	constructor(name) {
		super();
		//----------------------------------------------------------------
		// Style
		this.addClass('task');
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

		

		this.name = name;
		
		this.dependencies = new TaskList();

		this.children.add(self.body);
		this.children.add(self.dependencies);

		this.nameChanged = new Event('nameChanged');
	}
	get name() {
		return this.nameEditor.value;
	}
	set name(value) {
		this.nameEditor.value = value;
	}
	get description() {
		return this.descriptionEditor.value;
	}
	set description(value) {
		this.descriptionEditor.value = value;
	}
}
class TaskList extends Div {
	constructor() {
		super();

		this.addClass('task-list');

		let self = this;
		this.addBtn = new class extends Div {
			constructor() {
				super();
				this.addClass('ui-sprite');
				this.addClass('btn');
				this.addClass('plus');
			}
			onclick() {
				self.add();
			}
		}();
		this.children.add(this.addBtn);
	}
	add() {
		let taskItem = new Textbox();
		taskItem.addClass('item');
		taskItem.addClass('text-editor');
		this.children.add(taskItem);
	}
}