// 将 AST 中的 ObjectExpression 节点转换为实际的 JavaScript 对象
// 已废弃 现使用babel解析， 但可以用这个文件学习回归一下AST的作用

import * as acorn from 'acorn';
import * as walk from 'acorn-walk';
import * as path from 'path';
import * as fs from 'fs';
import { filePathTransAlias } from './file';


// 存储依赖关系的类型
type Dependency = {
  path: string;
  type: 'local' | 'node_module';
  exports: string[];
};

export class ASTParser {
    private dependencies: Map<string, Dependency>;
	private filePath: string;
	private nodeModulesPath: string;
	private imports: string[] = [];
	private pathAliases: Record<string, string>;  // 新增路径别名存储
    private currentDir: string;            
	constructor(options: {
        filePath: string;
        workspacePath: string;
        pathAliases: Record<string, string>;
        currentDir: string;
    }) {
        this.filePath = options.filePath;
        this.nodeModulesPath = path.join(options.workspacePath, 'node_modules');
        this.dependencies = new Map<string, Dependency>();
        this.pathAliases = options.pathAliases;    // 继承路径别名
        this.currentDir = options.currentDir;     // 继承当前目录
    }

    public parse(code: string) {
        const ast = acorn.parse(code, {
            ecmaVersion: 2020,
            sourceType: 'module',
        });
		this.collectImports(ast);
		this.readImport(this.filePath, this.dependencies);
		console.log('dependencies', this.filePath, this.dependencies);
		return this.dependencies;
        // return this.findPanelComponents(ast);
    }
	private async readImport(filePath: string, dependencies: Map<string, Dependency>, depth = 0) {
		 // 处理所有导入项
		 for (const imp of this.imports) {
		
			const currentDir = path.dirname(this.filePath);

			const resolvedPath = this.resolveImportPath(imp, currentDir);
			if (!resolvedPath || this.dependencies.has(resolvedPath)) continue;
			const dependency: Dependency = {
			  path: resolvedPath,
			  type: imp.startsWith('.') ? 'local' : 'node_module',
			  exports: [],
			};
			// 获取导出内容
			if (fs.existsSync(resolvedPath)) {
				try {
					const moduleContent = fs.readFileSync(resolvedPath, 'utf-8');
					const moduleAst = acorn.parse(moduleContent, { 
						ecmaVersion: 'latest',  
						 sourceType: 'module',});

					walk.simple(moduleAst, {
					  ExportNamedDeclaration(node: any) {

						if (node.declaration?.id?.name) {
						  dependency.exports.push(node.declaration.id.name);
						}
						node.specifiers?.forEach((spec: any) => {
						  dependency.exports.push(spec.exported.name);
						});
					  }
					});
			
					this.dependencies.set(resolvedPath, dependency);
					
					// 递归解析
					if (dependency.type === 'local') {
					  await this.readImport(resolvedPath, this.dependencies, depth + 1);
					}
				  } catch (err) {
					console.warn(`Failed to parse ${resolvedPath}: ${err}`);
				  }
				}
			}

		
	}
	// 路径解析器
	private resolveImportPath(importPath: string, baseDir: string): string | null {
		try {
			const fullPath = path.resolve(baseDir, importPath);		 	 // 处理相对路径
			const truePath = filePathTransAlias(fullPath, this.pathAliases); // 处理路径别名
		  	if (importPath.startsWith('.') || truePath) {
				// 尝试添加扩展名
				const extensions = ['', '.js', '.ts', '.json'];
				for (const ext of extensions) {
					const candidate = truePath + ext;
					if (fs.existsSync(candidate)) {
						return candidate;
					}
				}
				
				return null;
			}
	
		  	// 处理 node_modules
			return importPath;
		} catch (e) {
			console.log('resolveImportPath error',this.nodeModulesPath, e);
		  return null;
		}
	  }
    private collectImports(ast: any) {
		// AST 遍历
		walk.simple(ast, {
			ImportDeclaration: (node: any) => {
			this.imports.push(node.source.value);
			},
			CallExpression: (node: any) => {
			if (node.callee.name === 'require' && node.arguments[0]?.type === 'Literal') {
				this.imports.push(node.arguments[0].value);
			}
			}
		});
		console.log('imports', this.imports);
	
    }

}