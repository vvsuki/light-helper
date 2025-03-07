 // The module 'vscode' contains the VS Code extensibility API
 // Import the module and reference it with the alias vscode in your code below
import {
	window, 
	commands, 
	Disposable, 
	ExtensionContext, 
	StatusBarAlignment, Position,CancellationToken,CompletionContext,
	StatusBarItem, TextDocument,

	} from 'vscode';
import { OptionsTransformer,  } from './tools/optionsTranser';
import { quickPanelProvider } from './tools/quickPanel'

/**
 * 插件被激活时触发， 所有代码总入口
 * @param context 插件上下文
 */
export function activate(context: ExtensionContext) {


    // 用console输出诊断信息(console.log)和错误(console.error)
    // 下面的代码只会在你的插件激活时执行一次
	console.log('"light-helper"启动成功');

	// 入口命令已经在package.json文件中定义好了，现在调用registerCommand方法
    // registerCommand中的参数必须与package.json中的command保持一致

	// commands是命令执行
	const optionsTransformer = new OptionsTransformer();

	const commitId = 'LightHelper.getPanelOptions'
	let disposable = commands.registerCommand(commitId, () => {
		optionsTransformer.getPanelData();
		
	});
	context.subscriptions.push(disposable);
	context.subscriptions.push(quickPanelProvider)
}




// this method is called when your extension is deactivated
export function deactivate() {}
