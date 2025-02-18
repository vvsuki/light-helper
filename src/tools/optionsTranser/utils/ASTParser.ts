// 将 AST 中的 ObjectExpression 节点转换为实际的 JavaScript 对象

import { Node } from 'acorn';
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';
import * as vm from 'vm'; // 用于动态执行代码
import * as path from 'path';
import * as fs from 'fs';

export class ASTParser {
    private imports: Map<string, { source: string, imported: string }>;
	private panelConfig;
	private filePath: string;

    constructor(filePath: string) {
		this.panelConfig = {
			panelArrays: [] as any[],
			usedTools: new Set<string>(),
			exports: null as any
		}
		this.filePath = filePath;
        this.imports = new Map();
    }

    public parse(code: string) {
        const ast = acorn.parse(code, {
            ecmaVersion: 2020,
            sourceType: 'module',
        });

		this.collectImports(ast);
        // 遍历 AST 查找配置信息
		// walk.simple(ast, {
		// 	VariableDeclarator: (node: any) => {
		// 		// 查找所有面板数组定义
		// 		if (node.init && this.isPanelConfigArray(node.init)) {
		// 			console.log('node.init', node);
		// 			const panelArray = {
		// 				name: node.id.name,
		// 				configs: node.init.elements.map((element: any) => {
		// 					const obj: any = {};
		// 					element.properties.forEach((prop: any) => {
		// 						const key = prop.key.name;
		// 						if (prop.value.type === 'MemberExpression') {
		// 							obj[key] = `${prop.value.object.name}.${prop.value.property.name}`;
		// 						} else if (prop.value.type === 'CallExpression' && 
		// 								 prop.value.callee.name === '$$t') {
		// 							obj[key] = prop.value.arguments[1]?.value;
		// 						} else if (prop.value.type === 'ArrayExpression') {
		// 							obj[key] = 'Array';
		// 						} else if (prop.value.type === 'ObjectExpression') {
		// 							obj[key] = 'Object';
		// 						} else {
		// 							obj[key] = prop.value.value;
		// 						}
		// 					});
		// 					return obj;
		// 				})
		// 			};
		// 			this.panelConfig.panelArrays.push(panelArray);
		// 		}
		// 	},
		// 	ImportDeclaration: (node: any) => {
		// 		// 记录使用的工具
		// 		if (node.source.value === '@baozun/light-panel-tools') {
		// 			node.specifiers.forEach((specifier: any) => {
		// 				this.panelConfig.usedTools.add(specifier.local.name);
		// 			});
		// 		}
		// 	},
		// 	ExportDefaultDeclaration: (node: any) => {
		// 		// 分析导出方式
		// 		if (node.declaration.type === 'CallExpression') {
		// 			this.panelConfig.exports = {
		// 				type: 'function',
		// 				name: node.declaration.callee.name,
		// 				arguments: node.declaration.arguments.map((arg: any) => {
		// 					if (arg.type === 'Identifier') {
		// 						return arg.name;
		// 					} else if (arg.type === 'CallExpression') {
		// 						return `${arg.callee.object.name}.${arg.callee.property.name}()`;
		// 					}
		// 					return 'unknown';
		// 				})
		// 			};
		// 		} else if (node.declaration.type === 'Identifier') {
		// 			this.panelConfig.exports = {
		// 				type: 'identifier',
		// 				name: node.declaration.name
		// 			};
		// 		}
		// 	}
		// });
        return this.findPanelComponents(ast);
    }

	private isPanelConfigArray(node: any): boolean {
		// 检查是否是数组
		if (node.type !== 'ArrayExpression') return false;
		
		// 检查数组元素是否符合面板配置的特征
		// 至少有一个元素，且元素是对象，包含 modelName 或 labelText 等特征属性
		return node.elements.length > 0 && 
			   node.elements[0].type === 'ObjectExpression' &&
			   node.elements[0].properties.some((prop: any) => 
				   prop.key.name === 'modelName' || 
				   prop.key.name === 'labelText' ||
				   prop.key.name === 'componentName');
	}
	
    private collectImports(ast: any) {
		const imports: acorn.Node[] = [];

		// function traverse(node: acorn.Node) {
		// 	if (node.type === 'ImportDeclaration') {
		// 	  imports.push(node);
		// 	}
		// 	for (const key in node) {
		// 	  if (node[key] && typeof node[key] === 'object') {
		// 		traverse(node[key]);
		// 	  }
		// 	}
		//   }
        // ast.body.forEach((node: Node) => {
        //     if (node.type === 'ImportDeclaration') {
		// 		imports.push(node);
		// 		(node as any).forEach((specifier: any) => {
		// 			console.log('specifier', specifier);	
		// 			// this.imports.set(specifier.local.name, {
		// 			// 	source: (node as any).source.value,
		// 			// 	imported: specifier.imported?.name || specifier.local.name
		// 			// });
		// 			// if (node[key] && typeof node[key] === 'object') {
		// 			// traverse(node[key]);
		// 			// }
		// 		});
        //         // (node as any).specifiers.forEach((specifier: any) => {
        //             // this.imports.set(specifier.local.name, {
        //             //     source: (node as any).source.value,
        //             //     imported: specifier.imported?.name || specifier.local.name
        //             // });
					
        //         // });
        //     }
        // });
		
		   // 使用 acorn-walk 简化遍历逻辑
		   walk.simple(ast, {
			ImportDeclaration: (node: any) => {
				imports.push(node);
				node.specifiers.forEach((specifier: any) => {
					this.imports.set(specifier.local.name, {
						source: node.source.value,
						imported: specifier.imported?.name || specifier.local.name
					});
				});
			}
		});
		console.log('imports', imports);
		return imports;
    }

    private findPanelComponents(ast: any) {
        let panelComponentsNode = ast.body.find((node: Node) => 
            (node.type === 'VariableDeclaration' && 
            (node as any).declarations?.[0]?.id?.name === 'panelComponents') ||
            (node.type === 'ExportNamedDeclaration' &&
            (node as any).declaration?.declarations?.[0]?.id?.name === 'panelComponents')
        );

        if (!panelComponentsNode) {
            return null;
        }

        // 处理export声明的情况
        if (panelComponentsNode.type === 'ExportNamedDeclaration') {
            panelComponentsNode = panelComponentsNode.declaration;
        }

        const nodeData = (panelComponentsNode as any).declarations[0].init.elements;
        return nodeData.map((node: any) => this.processNode(node));
    }

    private processNode(node: any) {
        const data = this.astObjectToData(node);
        // 处理可能的MemberExpression
       
        return data;
    }

    private resolveMemberExpression(node: any): any {
        if (node.type === 'MemberExpression') {
            const objectName = node.object.name;
            const propertyName = node.property.name;
			console.log('node', this.imports, propertyName);


            if (this.imports.has(objectName)) {
                const importInfo = this.imports.get(objectName);
                return {
                    module: importInfo!.source,
                    property: propertyName
                };
            }
            
            return `${objectName}.${propertyName}`;
        }
        return node;
    }

    private astObjectToData(node: any): any {
		// 处理基础类型
		if (node.type === 'Literal') {
	
			return node.value;
		}
	
		// 处理标识符（变量引用）
		if (node.type === 'Identifier') {
			return node.name;
		}
	
		// 处理数组表达式
		if (node.type === 'ArrayExpression') {
			return node.elements.map((element: any) => this.astObjectToData(element));
		}
		if (node.type === 'MemberExpression') {
			const result: any = {};
			console.log('node', node);	
			Object.keys(node).forEach(key => {
				// console.log('result---', key, node,  node[key]?.value);	
				// if (node[key] && typeof node[key] === 'object') {
				// 	result[key] = this.resolveMemberExpression(node[key]);
				// }
			});
			// console.log('result', result);	
			return result
			
		}
		// 处理对象表达式
		if (['ObjectExpression'].includes(node.type)) {
			const result: any = {};
			for (const property of node.properties) {
				const key = property.key.type === 'Identifier' 
					? property.key.name 
					: property.key.value;
				const value = this.astObjectToData(property.value);
				result[key] = value;
			}
			return result;
		}
	
		// 处理模板字面量
		if (node.type === 'TemplateLiteral') {
			// 简单处理，不考虑表达式插值
			return node.quasis[0].value.raw;
		}
	
		// 处理函数调用（比如 $$t 函数）
		if (node.type === 'CallExpression') {
			// 如果是 $$t 函数，返回第二个参数（默认文本）
			if (node.callee.type === 'Identifier' && node.callee.name === '$$t') {
				return this.astObjectToData(node.arguments[1]);
			}
			// 其他函数调用可以根据需要处理
			return undefined;
		}
	
		return undefined;
	}
}