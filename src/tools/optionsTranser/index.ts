import { Node } from 'acorn';
import { window, Disposable, StatusBarItem, StatusBarAlignment, workspace, Uri,	WorkspaceFolder , WebviewPanel, ViewColumn } from "vscode";
import { cloneDeep } from './utils';
import { ASTParser } from './utils/ASTParser';
import { filePathTransAlias, getTransformedBase, addExtensionIfNeeded } from './utils/filePathTrans';
import { Webview } from './components/webview';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { transformFileSync } from '@babel/core' // 同步处理代码 

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

// 存储依赖关系的类型
type Dependency = {
	fullPath: string; // 绝对路径
	fileName: string; // 文件名
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
	private _fileDir: string = '';
	private pathAliases: Record<string, string> = {}; // 新增路径别名缓存
	private _dependencies: Map<string, Dependency> = new Map(); //依赖收集
	constructor() {
		
	}
	private transpileFile (filePath: string){
	
		// 通过闭包捕获类实例上下文
		const that = this;
		// 通过闭包捕获路径别名配置和类上下文
		const pathAliases = this.pathAliases;	
		try {
		// 使用Babel进行文件转译
		const result = transformFileSync(filePath, {
			presets: [ // 预设集合
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
			plugins: [ // 插件列表
				// 自定义路径转换插件
				function customPathPlugin() {
					console.log('插件已注册', filePath)
					return {
						visitor: {
							// 处理所有import声明
							ImportDeclaration(node: any) {
								let source = node.node.source.value;
								console.log( 'ImportDeclaration source', source)
								// 处理路径别名转换
								const aliaSource = filePathTransAlias(source, pathAliases);
							
								// 如果路径是相对路径或存在别名转换
								if (source.startsWith('.') || aliaSource) {
									source = aliaSource || source
									// 生成标准化路径
									const normalizedPath = getTransformedBase(source, that._fileDir)
									
										// 构建新的转译路径
									const newBase = `./${normalizedPath}.js`;


									// 记录依赖映射关系
									// 处理相对路径
									const fullPath = addExtensionIfNeeded(aliaSource ? aliaSource : path.join(that._fileDir, source));
									const dep = {
										fullPath,
										fileName: newBase,
									}
									that._dependencies.set(node.node.source.value, dep);
									console.log('newBase', newBase)
									node.node.source.value = newBase;  // 修改导入路径
								}
							},
	
						}
					};
				}
				
			],
			// 其他配置
			ignore: [],             // 不忽略任何文件
			include: /.*/,          // 包含所有文件
			sourceType: 'unambiguous' // 自动检测源码类型
		});

		// 生成输出路径并写入转译结果
		const depEntry = Array.from(this._dependencies).find(([key, value]) => value.fullPath === filePath);
		const transformedBase = depEntry 
		? depEntry[1].fileName
		: path.basename(filePath, path.extname(filePath));

		const outputPath = path.join(this._fileDir, transformedBase);
		fs.writeFileSync(outputPath, result.code);
		console.log('outputPath 转译 成功',  outputPath)
		return outputPath;
		} catch (e:any) {
		throw new Error(`转译失败:  ${filePath} ---- ${e}`, );
		}
	}
	// 新增递归转译方法
	private transpileRecursively(filePath: string, processed = new Set<string>()) {
		// 避免重复处理
		if (processed.has(filePath)) return;
		processed.add(filePath);

		// 转译当前文件
		const transpiled = this.transpileFile(filePath);
		
		// 获取当前文件的依赖
		const currentDeps = Array.from(this._dependencies)			
		// 递归转译依赖
		currentDeps.forEach(dep => {
			const [key, value] = dep
			this.transpileRecursively(value.fullPath, processed);
		});

		return transpiled || '';
	}

	private async templateScript(mainTranspiledPath:string | undefined, tempScriptPath:string){
		const tempScriptContent = `
		(async () => {
			try {
				
				const targetModule = require('${mainTranspiledPath?.replace(/\\/g, '/')}');
				console.log(JSON.stringify(targetModule.default || targetModule));
			} catch (error) {
				console.error('完整错误:', error.stack);
				process.exit(1);
			}
			})();
		`;

	   // 将临时脚本内容写入文件
	   await workspace.fs.writeFile(Uri.file(tempScriptPath), Buffer.from(tempScriptContent));
	   this._statusBarItem.text = `临时脚本已写入`;
	   console.log(`临时脚本已写入: ${tempScriptPath}`);
   
	}
	// 新增配置加载方法
	private loadProjectConfig(workspacePath: string) {
		try {
			// 修复配置路径获取逻辑
			let configPath = path.join(workspacePath, 'jsconfig.json');
			if (!fs.existsSync(configPath)) {
				configPath = path.join(workspacePath, 'tsconfig.json');
				console.log('配置文件格式 configPath', configPath)
				if (!fs.existsSync(configPath)) {
					throw new Error(`配置文件格式错误 (请检查引号和逗号, ${configPath}` );
					
				}
			}
			
			const configContent = fs.readFileSync(configPath, 'utf-8');  // 恢复正确读取方式
			const cleanedContent = configContent.replace(/^\uFEFF/, ''); // 保持 BOM 头处理
			const config = JSON.parse(cleanedContent);

			if (config?.compilerOptions?.paths) {
				for (const [alias, paths] of Object.entries(config.compilerOptions.paths)) {
					// 转换 @/* -> ./src/*
					const cleanAlias = alias.replace('/*', '/');
					const cleanPath = (paths as string[])[0].replace('/*', '/');
					this.pathAliases[cleanAlias] = path.join(workspacePath, cleanPath);
				}
			}


		} catch (e:any) {
			console.log('错误详情:', e.message);
			this.pathAliases['@/'] = path.join(workspacePath, 'src')
			throw new Error(`读取项目配置失败` );
		}
	}
	// 获取panel文件的数据
	public async getPanelData() {
		let editor = window.activeTextEditor;
		if(!editor) {
			return;
		}
	
		this._statusBarItem.text = `正在解析panel.js...`;
		this._statusBarItem.show();
		
		try {
			
		
			const text = editor.document.getText();
			const filePath = editor.document.uri.fsPath;
			// 获取当前的工作区文件夹
			const workspaceFolders = workspace.workspaceFolders;
			const workspaceFolder = workspaceFolders?.[0];
			const workspacePath = workspaceFolder?.uri.fsPath || '';
			// 新增：加载项目配置
			this.loadProjectConfig(workspacePath);
			this._statusBarItem.text = `正在加载项目配置...`;
			console.log('loadProjectConfig pathAliases', this.pathAliases)
			// // 创建解析器实例时传入当前文件路径

			
			const fileDir = path.dirname(filePath);
			this._fileDir = fileDir;

			const tempScriptPath = path.join(fileDir, 'tempScript.cjs');
			const escapedFilePath = filePath.replace(/\\/g, '\\\\');
			// 主文件转译（带递归依赖处理）
			const mainTranspiledPath = this.transpileRecursively(escapedFilePath);

			// 生成临时脚本
			await this.templateScript(mainTranspiledPath, tempScriptPath);
	  
		  	 // 执行临时脚本并获取输出
		    const panelData = execSync(`node ${tempScriptPath}`, { cwd: this._fileDir, encoding: 'utf8' });
			this._statusBarItem.text = `解析完成， 正在转换options...`;
			// 删除

			
			// 解析
			const rawData = panelData.trim();
			const parsedData = JSON.parse(rawData);
			const options = this.panelToOptions(parsedData);
			this._webview.renderWebview(options);
			window.showInformationMessage('转换成功');
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


}
