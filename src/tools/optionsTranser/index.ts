import { Node } from 'acorn';
import { window, Disposable, StatusBarItem, StatusBarAlignment, workspace, 	WorkspaceFolder , WebviewPanel, ViewColumn } from "vscode";
import { cloneDeep } from './utils';
import { ASTParser } from './utils/ASTParser';
import { Webview } from './components/webview';
import { execSync } from 'child_process';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { transformFileSync } from '@babel/core'

// 声明模块
declare module '@babel/preset-env';


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
			// // 获取当前的工作区文件夹
			const workspaceFolders = workspace.workspaceFolders;
			// // 假设只有一个工作区文件夹
			const workspaceFolder = workspaceFolders?.[0];
			const workspacePath = workspaceFolder?.uri.fsPath || '';
			// 创建解析器实例时传入当前文件路径
			const parser = new ASTParser( filePath, workspacePath );
			const dependencies = await parser.parse(text);
			console.log('path', path.join(__dirname, '../node_modules/@babel/plugin-transform-modules-commonjs'));
			const transpileFile = (filePath: string) => {
				const result = transformFileSync(filePath, {
				  presets: [
					[
					  path.join(__dirname, '../node_modules/@babel/preset-env'),
					
						{
						targets: { node: 'current' },
						modules: 'commonjs',
						useBuiltIns: 'usage',
						corejs: 3
					  }
					]
				  ],
				  plugins: [
					[
						path.join(__dirname, '../node_modules/@babel/plugin-transform-modules-commonjs'), 
						{ 
							strictMode: true,  // 确保导出顺序正确
							noInterop: false   // 允许default导出
						}
				  	],
					// 新增路径转换插件
					function replaceImportPath() {
						return {
						  visitor: {
							ImportDeclaration(node: any) {
							  // 替换本地相对路径引用
							  const source = node.node.source.value;
							  if (source.startsWith('.')) {
								const ext = path.extname(source);
								const base = path.basename(source, ext);
								const newBase = `./transpiled_${base}`;
								node.node.source.value = newBase;
							  }
							},
						  }
						};
					  }
				  ],
				  ignore: [],
				  include: /.*/,
				  sourceType: 'unambiguous',
				});
				if (!result?.code) throw new Error(`转译失败: ${filePath}`);
				
				const outputPath = path.join(fileDir, `transpiled_${path.basename(filePath)}`);
				fs.writeFileSync(outputPath, result.code);
				return outputPath;
			  };

			
			const fileDir = path.dirname(filePath);

			const tempScriptPath = path.join(fileDir, 'tempScript.cjs');
			const escapedFilePath = filePath.replace(/\\/g, '\\\\');
			// 主文件转译
			const mainTranspiledPath = transpileFile(escapedFilePath);
					
			// 依赖文件转译 ↓
			const depTranspiledPaths = Array.from(dependencies?.values()).map(dep => 
				transpileFile(path.resolve(fileDir, dep.path))
			);

	
	  
			const tempScriptContent = `
				(async () => {
				try {
					
					const targetModule = require('${mainTranspiledPath.replace(/\\/g, '/')}');
					console.log(JSON.stringify(targetModule.default || targetModule));
				} catch (error) {
					console.error('完整错误:', error.stack);
					process.exit(1);
				}
				})();
				`;

			   // 将临时脚本内容写入文件
			   await vscode.workspace.fs.writeFile(vscode.Uri.file(tempScriptPath), Buffer.from(tempScriptContent));
			   console.log(`临时脚本已写入: ${tempScriptPath}`);
   
			   // 执行临时脚本并获取输出
			   const panelData = execSync(`node ${tempScriptPath}`, { cwd: fileDir, encoding: 'utf8' });
   
			   [mainTranspiledPath, ...depTranspiledPaths].forEach(p => {
				try {
				  fs.unlinkSync(p);
				  console.log('已删除转译文件:' , p);
				} catch (e) {
				console.log('删除转译文件失败:' , p, e);

				}
			  });

			  
			// 修改后的解析逻辑
			try {
				const rawData = panelData.trim();
				// 添加空值检查
				if (!rawData.startsWith('{') && !rawData.startsWith('[')) {
				throw new Error('非法的JSON数据格式');
				}
				
				const parsedData = JSON.parse(rawData);
				
				if (parsedData?.__ERROR__) {
				throw new Error(`模块执行错误: ${parsedData.message}\n${parsedData.stack}`);
				}
			
				const options = this.panelToOptions(parsedData);
				this._webview.renderWebview(options);
				vscode.window.showInformationMessage('转换成功');
			} catch (e: any) {
				console.error('解析失败:', e);
				throw new Error(`数据解析错误: ${e.message}`);
			}

		} catch (error: any) {
			console.log('error', error);
			this._statusBarItem.text = `解析代码时出错: ${error.message}`;
			this._statusBarItem.show();
		}
	}

	// 转为options
	public panelToOptions(panel: Array<any>){
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
