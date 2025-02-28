import { WebviewPanel ,Disposable, env, window, StatusBarItem, ViewColumn} from "vscode";

export class Webview {
	private _panelView!: WebviewPanel | null;
	private _disposables: Disposable[] = [];
	private _statusBarItem: StatusBarItem;
	constructor(statusBarItem:StatusBarItem) {
		this._statusBarItem = statusBarItem // 继承状态栏
	}
	
	  // 新增面板控制方法
	  public toggleWebview(visible: boolean) {
        if (visible) {
            if (!this._panelView) {
                // 如果面板不存在则创建
                this._panelView = window.createWebviewPanel(
                    'lightHelper',
                    'Light生成options',
                    ViewColumn.Beside,
                    {
						enableScripts: true, // 允许js脚本执行
						retainContextWhenHidden: true,// 当页签切换离开时保持插件上下文不销毁
					}
                );
            }
            // 显示面板
            this._panelView.reveal();
        } else if (this._panelView) {
            // 关闭并销毁面板
            this._panelView.dispose();
            this._panelView = null;
        }
    }


	public renderWebview(data: any) {

		// 先生成 HTML 内容
		const htmlContent = this.getWebviewContent(data);
		// 调用toggle显示面板
		this.toggleWebview(true);
		if (!this._panelView) {
           return
        }
		this._panelView.webview.html = htmlContent;    
		// 添加面板关闭监听
		this._panelView.onDidDispose(() => {
			this._panelView = null;
		});

		  // 清空旧监听器
		  this._disposables.forEach(d => d.dispose());
		  this._disposables = [];
		// 添加消息回执
		this._panelView?.webview.postMessage({
			type: 'ACK',
		});
		  // 更新消息处理逻辑
		  this._disposables.push(
			  this._panelView.webview.onDidReceiveMessage(
				  message => {
					  console.log('收到消息:', message); // 添加详细日志
					  switch (message?.command) {  // 添加空值检查
						  case 'copy':
							  env.clipboard.writeText(message.text);
							  window.showInformationMessage('已复制到剪贴板');
							  break;
						  case 'debug':
							  console.log('调试消息:', message.action);
							  break;
							  case 'retryRender':
								this.renderWebview(data); // 需要保持 data 的引用
								break;
						  default:
							  console.warn('未知消息类型:', message);
					  }
				  }
			  )
		  );
	}
	expandAll(){
		console.log('render expandAll')
		return `expandAll()`;
	}
	private getWebviewContent(data: any): string {
		return `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="UTF-8">
				<style>
					/* 添加加载动画 */
					.loading {
						position: fixed;
						top: 50%;
						left: 50%;
						transform: translate(-50%, -50%);
						font-size: 20px;
						color: var(--vscode-editor-foreground);
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
            <div class="loading" id="loading">正在生成选项预览...</div>
            

				<!-- 添加调试工具栏 -->
				<div class="debug-toolbar">
					<button onclick="openDevTools">打开调试器</button>
					<button onclick="dumpState">输出状态</button>
				</div>

				<div class="toolbar">
					<button onclick="${this.expandAll}">展开全部</button>
					<button onclick="collapseAll">折叠全部</button>
					<button onclick="copyToClipboard">复制</button>
				</div>
				<div class="json-container" id="json-content">
					${this.renderJSON(data)}
				</div>
				<script>
				  // 先显示加载提示
                	const loading = document.getElementById('loading');
                  // 延迟渲染防止阻塞
                window.addEventListener('load', () => {
                    // 隐藏加载动画
                    loading.style.display = 'none';
					const vscode = acquireVsCodeApi();
					 // 修正消息发送逻辑
					function safePostMessage(msg) {
						try {
							vscode.postMessage(msg);
						} catch (e) {
							console.error('消息发送失败:', e);
						}
					}

					function copyToClipboard() {
						const content = ${JSON.stringify(data).replace(/\\/g, '\\\\')}; // 处理路径转义
						safePostMessage({
							command: 'copy',
							text: JSON.stringify(content, null, 2)
						});
					}

					
					// 调试方法
					function openDevTools() {
						vscode.postMessage({
							command: 'debug',
							action: 'openDevTools'
						});
					}

					function dumpState() {
						console.log('当前数据结构:', ${JSON.stringify(data)});
						vscode.postMessage({
							command: 'debug',
							action: 'dumpState',
							data: ${JSON.stringify(data)}
						});
					}
					document.addEventListener('click', (e) => {
						console.log(e.target)
						if (e.target.parentElement.classList.contains('collapsible')) {
							e.target.parentElement.classList.toggle('collapsed');
						}
					});
	
					function expandAll() {
						console.log('expandAll')
						document.querySelectorAll('.collapsed').forEach(el => {
							el.classList.remove('collapsed');
						});
					}
	
					function collapseAll() {
					console.log('collapseAll')
						document.querySelectorAll('.collapsible').forEach(el => {
							el.classList.add('collapsed');
						});
					}
	
				});
				  // 添加重试机制
                function retryRender() {
                    vscode.postMessage({ command: 'retryRender' });
                }
				</script>
			</body>
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

