const acorn = require('acorn');
import { Node } from 'acorn';
import { window, Disposable, StatusBarItem, StatusBarAlignment, WebviewPanel, ViewColumn } from "vscode";
import { cloneDeep } from './utils';
import { astObjectToData } from './utils/ast';
import { Webview } from './components/webview';

type DynamicValue = {
	isDynamic: boolean;
	value: any;
}
type Panel = {
	componentKey: string;
	aliaNameKey: string;
	labelText: string;
	componentValue: DynamicValue | any;
};
/**
 * panel转换器
 * 状态栏 - 抛出错误 - 显隐
 * 侧边栏 - 展示最后的options数据 - 显隐
 * getPanelData() 获取panel.js中的数据 
 * panelToOptions() panel data转为options 
 */
export class OptionsTransformer {
	// 注册并声明一个状态栏项
	private _statusBarItem: StatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left)
	private _webview: Webview = new Webview();
	// 获取panel文件的数据
	public getPanelData(){
		// 已知panel一定会export一个数组， 直接读取

		// 获取当前编辑器内容
		let editor = window.activeTextEditor;
		if(!editor){
			return;
		}
		this._statusBarItem.text = `正在转换成options`;
		this._statusBarItem.show();
		const text = editor.document.getText();
		try {
			// 获取当前编辑器内容
			const ast = acorn.parse(text, {
				ecmaVersion: 2020, // es 版本
				sourceType: 'module', // script | module , script:严格模式, module: import/export,
			});
			// Find the panelComponents array declaration
			const panelComponentsNode = ast.body.find((node: Node) => 
				node.type === 'VariableDeclaration' && 
				(node as any).declarations?.[0]?.id?.name === 'panelComponents'
			);

			if (!panelComponentsNode) {
				return
			}
			// Get the exported array
			const nodeData = panelComponentsNode.declarations[0].init.elements;
			const panelData = nodeData.map(astObjectToData);
			const options = this.panelToOptions(panelData);

			console.log('options', options);

			// 渲染webview
			this._webview.renderWebview(options)

		} catch (error: any) {
			console.log('error', error)
			this._statusBarItem.text = `解析代码时出错: ${error.message}`;
			this._statusBarItem.show();
		}


	}


	// 转为options
	public panelToOptions(panel: Array<Panel>){
		const options: { [key: string]: any } = {};
		console.log('panelToOptions', options);

		if (!panel) return options;

		for (let i = 0; i < panel.length; i++) {
			const curPanel = panel[i];
			const { componentValue } = curPanel;
			const componentKey = curPanel?.aliaNameKey || curPanel.componentKey
			// todo 依据componentName MAP
			options[componentKey] = componentValue?.isDynamic
			? cloneDeep(componentValue?.value) // dynamic下记录的原静态数据
			: cloneDeep(componentValue);
		}
		return options;
	}

	// public showView(options: any){
	// 	// 注册并声明一个右侧
	// 	const  _panelView: WebviewPanel = window.createWebviewPanel(
	// 		'lightHelper',  // 面板的唯一标识符
	// 		'Light生成options', // 面板标题
	// 		ViewColumn.Beside, // 显示在右侧
	// 		{} // Webview 选项
	// 	);
	// 	 // 生成要显示的 HTML 内容
	// 	 const htmlContent = `
	// 	 <!DOCTYPE html>
	// 	 <html lang="en">
	// 	 <head>
	// 		 <meta charset="UTF-8">
	// 		 <meta name="viewport" content="width=device-width, initial-scale=1.0">
	// 	 </head>
	// 	 <body>
	// 		 <h5>转换成options</h5>
	// 		<pre id="json-content">${this.syntaxHighlight(options)}</pre>

	// 	 </body>
	// 	 </html>
	//  `;

	// 	// 设置 Webview 的 HTML 内容
	// 	_panelView.webview.html = htmlContent;
	// }
    // 必须是panel.js才会触发调用

	constructor() {
	}

}

// /***
//  * 订阅事件
//  */
// export class TransController {
// 	private _transformer: OptionsTransformer; // 字数统计器
// 	private _disposable: Disposable; // 释放器


// 	constructor(transformer: OptionsTransformer) {
// 		this._transformer = transformer;
// 		// 收集所有事件的Disposable， 统一释放
// 		let subscriptions: Disposable[] = [];
		
// 		// 订阅编辑器改变事件
        
//         //激活编辑器（打开的编辑器）切换的时候触发
// 		window.onDidChangeActiveTextEditor(this._onEvents, this, subscriptions)
//          //鼠标位置变动时触发
//         window.onDidChangeTextEditorSelection(this._onEvents, this, subscriptions);
// 		this._wordCounter.updateWordCount();

//         // 把两个事件订阅器整合成一个临时容器
//         this._disposable = Disposable.from(...subscriptions);
// 	}
//     _onEvents(){
//        this._wordCounter.updateWordCount()
//     }
    
//     dispose() {
//         this._disposable.dispose();
//     }
// }