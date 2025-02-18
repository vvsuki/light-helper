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

// const vscode = require('vscode');
// const { VM } = require('vm2');
// const fs = require('fs');
// const path = require('path');
// const babel = require('@babel/core');

// function activate(context: ExtensionContext) {
//     const disposable = vscode.commands.registerCommand('LightHelper.getPanelOptions', async () => {
//         const editor = vscode.window.activeTextEditor;
//         if (editor) {
//             const document = editor.document;
//             const filePath = document.fileName;
//             if (path.extname(filePath) === '.js') {
//                 try {
//                     const code = fs.readFileSync(filePath, 'utf8');
// 					console.log('code', code);
//                     // 使用 Babel 将 ES6 代码转换为 CommonJS 模块语法
//                     const { code: transformedCode } = babel.transformSync(code, {
//                         presets: ['@babel/preset-env']
//                     });

//                     // 创建一个沙箱环境
//                     const vm = new VM({
//                         sandbox: {
//                             // 模拟 require 函数
//                             require: (moduleName: string) => {
//                                 const modulePath = path.join(path.dirname(filePath), moduleName);
//                                 try {
//                                     const moduleCode = fs.readFileSync(`${modulePath}.js`, 'utf8');
//                                     const { code: moduleTransformedCode } = babel.transformSync(moduleCode, {
//                                         presets: ['@babel/preset-env']
//                                     });
//                                     const moduleVm = new VM({
//                                         sandbox: {
//                                             exports: {},
//                                             module: { exports: {} }
//                                         }
//                                     });
//                                     moduleVm.run(moduleTransformedCode);
//                                     return moduleVm.run('module.exports');
//                                 } catch (error) {
//                                     console.error(`加载模块 ${moduleName} 时出错:`, error);
//                                     return {};
//                                 }
//                             },
//                             exports: {},
//                             module: { exports: {} }
//                         }
//                     });

//                     // 执行转换后的代码
//                     vm.run(transformedCode);

//                     // 获取导出的数据
//                     const exportedData = vm.run('module.exports');
//                     if (exportedData) {
//                         vscode.window.showInformationMessage(`导出的数据: ${JSON.stringify(exportedData, null, 2)}`);
//                     } else {
//                         vscode.window.showInformationMessage('未找到导出的数据');
//                     }
//                 } catch (error: any) {
//                     vscode.window.showErrorMessage(`执行文件时出错: ${error.message}`);
//                 }
//             } else {
//                 vscode.window.showInformationMessage('当前打开的不是 JavaScript 文件');
//             }
//         }
//     });

//     context.subscriptions.push(disposable);
// }

// function deactivate() {}

// module.exports = {
//     activate,
//     deactivate
// };