import { WebviewPanel , env, window, ViewColumn} from "vscode";
export class Webview {
	private _panelView!: WebviewPanel;
	constructor() {
		
	}
	
	public renderWebview(data: any) {
		// 生成 HTML 内容
		const htmlContent = this.getWebviewContent(data);
		this._panelView = window.createWebviewPanel(
			'lightHelper',
			'Light生成options',
			ViewColumn.Beside,
			{}
		);
		
		// 更新 webview 内容
		this._panelView.webview.html = htmlContent;
		
		// // 处理来自 webview 的消息
		// this._panelView.webview.onDidReceiveMessage(
		// 	message => {
		// 		switch (message.command) {
		// 			case 'copy':
		// 				// 复制到剪贴板
		// 				env.clipboard.writeText(message.text);
		// 				window.showInformationMessage('已复制到剪贴板');
		// 				return;
		// 		}
		// 	},
		// 	undefined,
		// 	this._disposables
		// );
	}
	private getWebviewContent(data: any): string {
		return `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="UTF-8">
				<style>
					body {
						padding: 20px;
						font-family: var(--vscode-font-family);
						color: var(--vscode-editor-foreground);
					}
					.json-container {
						font-family: monospace;
						font-size: 14px;
						background: var(--vscode-editor-background);
						padding: 15px;
						border-radius: 4px;
					}
					.json-item {
						padding-left: 20px;
						position: relative;
					}
					.collapsible:before {
						content: '▼';
						position: absolute;
						left: 0;
						cursor: pointer;
						color: var(--vscode-button-foreground);
					}
					.collapsed:before {
						content: '▶';
					}
					.collapsed .json-item {
						display: none;
					}
					.key {
						color: var(--vscode-symbolIcon-propertyForeground);
					}
					.string {
						color: var(--vscode-debugTokenExpression-string);
					}
					.number {
						color: var(--vscode-debugTokenExpression-number);
					}
					.boolean {
						color: var(--vscode-debugTokenExpression-boolean);
					}
					.null {
						color: var(--vscode-debugTokenExpression-error);
					}
					.toolbar {
						margin-bottom: 10px;
					}
					button {
						background: var(--vscode-button-background);
						color: var(--vscode-button-foreground);
						border: none;
						padding: 8px 12px;
						border-radius: 4px;
						cursor: pointer;
						margin-right: 8px;
					}
					button:hover {
						background: var(--vscode-button-hoverBackground);
					}
				</style>
			</head>
			<body>
				<div class="toolbar">
					<button onclick="expandAll()">展开全部</button>
					<button onclick="collapseAll()">折叠全部</button>
					<button onclick="copyToClipboard()">复制</button>
				</div>
				<div class="json-container" id="json-content">
					${this.renderJSON(data)}
				</div>
				<script>
					const vscode = acquireVsCodeApi();
	
					document.addEventListener('click', (e) => {
						if (e.target.parentElement.classList.contains('collapsible')) {
							e.target.parentElement.classList.toggle('collapsed');
						}
					});
	
					function expandAll() {
						document.querySelectorAll('.collapsed').forEach(el => {
							el.classList.remove('collapsed');
						});
					}
	
					function collapseAll() {
						document.querySelectorAll('.collapsible').forEach(el => {
							el.classList.add('collapsed');
						});
					}
	
					function copyToClipboard() {
						const content = ${JSON.stringify(data)};
						vscode.postMessage({
							command: 'copy',
							text: JSON.stringify(content, null, 2)
						});
					}
				</script>
			</body>
			</html>
		`;
	}
	
	private renderJSON(data: any): string {
		const renderValue = (val: any): string => {
			if (val === null) return '<span class="null">null</span>';
			if (typeof val === 'string') return `<span class="string">"${this.escapeHtml(val)}"</span>`;
			if (typeof val === 'number') return `<span class="number">${val}</span>`;
			if (typeof val === 'boolean') return `<span class="boolean">${val}</span>`;
			if (Array.isArray(val)) return this.renderArray(val);
			if (typeof val === 'object') return this.renderObject(val);
			return this.escapeHtml(String(val));
		};
	
		return renderValue(data);
	}
	
	private renderObject(obj: object): string {
		if (!obj || Object.keys(obj).length === 0) return '{}';
	
		const items = Object.entries(obj).map(([key, value]) => `
			<div class="json-item">
				<span class="key">"${this.escapeHtml(key)}"</span>: ${this.renderJSON(value)}
			</div>
		`).join('');
	
		return `
			<div class="collapsible">
				{
				${items}
				}
			</div>
		`;
	}
	
	private renderArray(arr: any[]): string {
		if (arr.length === 0) return '[]';
	
		const items = arr.map(item => `
			<div class="json-item">
				${this.renderJSON(item)}
			</div>
		`).join('');
	
		return `
			<div class="collapsible">
				[
				${items}
				]
			</div>
		`;
	}
	
	private escapeHtml(str: string): string {
		return str
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');
	}
}

