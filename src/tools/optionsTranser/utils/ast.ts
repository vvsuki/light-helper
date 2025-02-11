// 将 AST 中的 ObjectExpression 节点转换为实际的 JavaScript 对象
export function astObjectToData(node: any): any {
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
        return node.elements.map((element: any) => astObjectToData(element));
    }

    // 处理对象表达式
    if (node.type === 'ObjectExpression') {
        const result: any = {};
        for (const property of node.properties) {
            const key = property.key.type === 'Identifier' 
                ? property.key.name 
                : property.key.value;
            const value = astObjectToData(property.value);
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
            return astObjectToData(node.arguments[1]);
        }
        // 其他函数调用可以根据需要处理
        return undefined;
    }

    return undefined;
}