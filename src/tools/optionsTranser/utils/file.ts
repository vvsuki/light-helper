import * as path from 'path';
import * as fs from 'fs';

/**
 * 将源代码中的路径别名转换为真实路径
 * @param source 原始路径字符串（可能包含别名）
 * @param pathAliases 路径别名映射表（key: 别名，value: 对应真实路径）
 * @returns 处理后的真实路径
 */
export function filePathTransAlias(source: string, pathAliases: Record<string, string>) {
	// 处理别名
   const matchedAlias = Object.entries(pathAliases).find(
	   ([alias]) => source.startsWith(alias)
   );
   if (matchedAlias) {
	   // 解构获取匹配的别名和对应路径
	   const [alias, aliasPath] = matchedAlias;
	   // 替换原始路径中的别名部分
	   const relativePath = source.replace(`${alias}`, '');
	   // 拼接真实路径
	   return path.join(aliasPath, relativePath);
   }
   return ''
  
}

export function getTransformedBase (originalPath: string, fileDir:string)  {
   // 将路径解析为绝对路径后获取相对于项目根目录的路径
   const absolutePath =  path.resolve(fileDir, originalPath) 
   const relativePath = path.relative(fileDir, absolutePath)
   .replace(/^(\.\.?[\/\\])+/g, '')  // 修改正则匹配任意层级的相对路径
   .replace(/\.[^.]+$/, '');    // 去除文件扩展名
   const normalized = relativePath
	   .split(path.sep)
	   .join('_');
	console.log('absolutePath',`transpiled_${normalized}`)
   return `transpiled_${normalized}`
};

// 拓展名添加
export function addExtensionIfNeeded(filePath: string): string {
	    // 优先检查目录中的 index 文件
		if (fs.existsSync(filePath)) {
			const stat = fs.statSync(filePath);
			if (stat.isDirectory()) {
				const indexFiles = ['index.js', 'index.ts', 'index.json'];
				for (const file of indexFiles) {
					const candidate = path.join(filePath, file);
					if (fs.existsSync(candidate)) {
						return candidate;
					}
				}
			}
		}
	
		// 原始扩展名检查逻辑
		const extensions = ['', '.js', '.ts', '.json'];
		for (const ext of extensions) {
			const candidate = filePath + ext;
			if (fs.existsSync(candidate)) {
				return candidate;
			}
		}
	
		// 新增：处理目录路径但缺少index文件的情况
		return filePath;
	
}
// 目录删除功能

export function deleteFolder(folderPath: string) {
    if (fs.existsSync(folderPath)) {
		// fs.rmSync的recursive和force参数设置为true时，会递归删除目录中的所有文件和子目录
        fs.rmSync(folderPath, {
            recursive: true,
            force: true
        });
        console.log(`已删除目录: ${folderPath}`);
    }
}