const acorn = require('acorn');
import { Node } from 'acorn';
import { window, Disposable, StatusBarItem, StatusBarAlignment, WebviewPanel, ViewColumn } from "vscode";
import { cloneDeep } from './utils';
import { ASTParser } from './utils/ASTParser';
import { Webview } from './components/webview';
import { parsePanelJs } from './utils/panelNode';
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
	public async getPanelData() {
		let editor = window.activeTextEditor;
		if(!editor) {
			return;
		}
		this._statusBarItem.text = `正在转换成options`;
		this._statusBarItem.show();
		
		try {
		
			const text = editor.document.getText();
			const filePath = editor.document.uri.fsPath;

		  
			// 创建解析器实例时传入当前文件路径
			const parser = new ASTParser(filePath);
			const panelData = await parser.parse(text);
			
			if (!panelData) {
				this._statusBarItem.text = `未找到panelComponents声明`;
				return;
			}

			const options = this.panelToOptions(panelData);
			console.log('options', options);
			this._webview.renderWebview(options);

		} catch (error: any) {
			console.log('error', error);
			this._statusBarItem.text = `解析代码时出错: ${error.message}`;
			this._statusBarItem.show();
		}
	}

	// 转为options
	public panelToOptions(panel: Array<Panel>){
		const options: { [key: string]: any } = {};
		
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