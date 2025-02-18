import * as vm from 'vm'; // 用于动态执行代码
import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';
import * as babel from '@babel/core';

// 动态加载模块的函数
async function loadModule(modulePath: string) {
	try {
	  return require(modulePath);
	} catch (error) {
	  vscode.window.showErrorMessage(`无法加载模块: ${modulePath}, 错误: ${error}`);
	  return null;
	}
  }
  
  // 解析 panel.js 文件
export  async function parsePanelJs(code: string) {
    // 使用 Babel 将 ES6 代码转换为 CommonJS 模块语法
	const { code: transformedCode } = babel.transformSync(code, {
		presets: ['@babel/preset-env']
	});

	// 创建一个沙箱环境来执行代码
	const sandbox = {
	  require: (moduleName: string) => {
		if (moduleName.startsWith('@baozun/light-panel-tools')) {
		  return loadModule(moduleName);
		} else if (moduleName.startsWith('../../constants/lang')) {
		  return { $$t: (key: string, defaultValue: string) => defaultValue };
		} 
		return require(moduleName);
	  },
	  console,
	  module: { exports: {} },
	};
  
	// 在沙箱中执行代码
	vm.createContext(sandbox);
	vm.runInContext(code, sandbox);
  
	// 返回导出的结果
	return sandbox.module.exports;
  }