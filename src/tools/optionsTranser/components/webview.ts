import { WebviewPanel ,Disposable, env, window, StatusBarItem, ViewColumn} from "vscode";

export class Webview {
	private _panelView!: WebviewPanel | null;
	private _disposables: Disposable[] = [];
	private _statusBarItem: StatusBarItem;
	constructor(statusBarItem:StatusBarItem) {
		this._statusBarItem = statusBarItem // 继承状态栏
	}
	
	private createWebview() {
		// 渲染
		this._panelView = window.createWebviewPanel(
			'myExtension.previewPanel',
			'Light生成options',
			ViewColumn.One,
			{
				enableScripts: true, // 允许js脚本执行
				retainContextWhenHidden: true,// 当页签切换离开时保持插件上下文不销毁
			}
		);
		this.renderSkeletonWebview();
		// 添加面板关闭监听
		this._panelView.onDidDispose(() => {
			this._panelView = null
			this._disposables.forEach(d => d.dispose());
			this._disposables = [];
		}, null, this._disposables);
	}
	 // 先显示骨架屏
	public renderSkeletonWebview() {
		console.log("renderSkeletonWebview")
		if (!this._panelView) return;
		this._panelView.webview.html = this.getSkeletonContent();
    }
// 新增骨架屏模板
	private getSkeletonContent(): string {
		return `<!DOCTYPE html>
			<html>
			<head>
				<style>
					.skeleton-line {
						height: 20px;
						background: #eee;
						margin: 10px;
						border-radius: 4px;
						animation: pulse 1.5s infinite;
					}
					@keyframes pulse {
						0% { opacity: 1; }
						50% { opacity: 0.5; }
						100% { opacity: 1; }
					}
				</style>
			</head>
			<body>
				<div class="skeleton-line" style="width: 80%"></div>
				<div class="skeleton-line" style="width: 60%"></div>
				<div class="skeleton-line" style="width: 70%"></div>
			</body>
			</html>`;
	}

	public renderWebview(data: any) {
		// 确保面板存在且未被销毁
		if (!this._panelView) {
			this.createWebview()
		} else {
			// 重要：清空旧的事件监听器
			this._disposables.forEach(d => d.dispose());
			this._disposables = [];
		}

		if (this._panelView) {
			const renderHtml = this.renderJSON(data)
			
			// 强制更新webview内容
			this._panelView.webview.html = this.getWebviewContent(data);  // 确保传入最新数据
			
			this._panelView.webview.postMessage({
				type: 'LOAD_DATA',
				data: renderHtml
			});

			// 更新消息处理逻辑
			this._disposables.push(
				this._panelView.webview.onDidReceiveMessage(
					message => {
						switch (message?.command) { 
							case 'copy':
								env.clipboard.writeText(JSON.stringify(data));
								break;
							default:
								console.warn('未知消息类型:', message);
						}
					}
				)
			);
		}
	}


	private getWebviewContent(data: any): string {
		return `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="UTF-8">
				<style>
					/* 添加加载动画 */
					.skeleton-line {
						height: 20px;
						background: #eee;
						margin: 10px;
						border-radius: 4px;
						animation: pulse 1.5s infinite;
					}
					@keyframes pulse {
						0% { opacity: 1; }
						50% { opacity: 0.5; }
						100% { opacity: 1; }
					}
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
						color: var(--vscode-button-background);
						
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
					.debug-toolbar {
						position: fixed;
						top: 0;
						right: 0;
						background: rgba(0,0,0,0.7);
						padding: 8px;
						color: white;
						z-index: 1000;
					}	
				</style>
			</head>
			<body>
			<!-- 添加加载提示 -->
            
				<div class="toolbar">
					<button id="copyBtn" >复制</button>
				</div>
				<div class="json-container" id="json-content">
					<div class="skeleton-line" style="width: 80%"></div>
					<div class="skeleton-line" style="width: 60%"></div>
					<div class="skeleton-line" style="width: 70%"></div>
				</div>
			</body>
			<script>
				let currentData = null;
				const vscode = acquireVsCodeApi();

				window.addEventListener('message', event => {
					const message = event.data;
					switch (message.type) {
						case 'LOAD_DATA':
							console.log('receive message')
							currentData = message.data;
							renderData(currentData);
							break;
					}
				});

				function renderData(data) {
					const container = document.getElementById('json-content');
					console.log('renderData', data)
					container.innerHTML = data;
					initCollapsible();
					initEvents();
				}

				// 事件委托
				function initCollapsible() {
					// 使用静态父容器监听
					document.getElementById('json-content').addEventListener('click', (e) => {
						// 精确匹配点击目标
						const collapsible = e.target.closest('.collapsible');
						const collapsibleNode = e.target.classList.contains('collapsible')
						if (collapsible && collapsibleNode) {
							collapsible.classList.toggle('collapsed');
							console.log('折叠状态切换:', collapsible.classList.contains('collapsed'));
						}
					});
				}
				
			
				// 统一事件绑定
				function initEvents() {
					document.getElementById('copyBtn').addEventListener('click', copyToClipboard);
				}

				function copyToClipboard() {
					vscode.postMessage({
							command: 'copy',
						});
				}
			
				
				</script>
			</html>
		`;
	}
	
	private renderJSON(data: any = []): string {
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

