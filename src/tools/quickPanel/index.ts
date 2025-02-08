import { SnippetString, CompletionItemKind, languages, Range, ProviderResult, TextDocument, Position, CancellationToken, CompletionContext, CompletionItem, CompletionList } from "vscode";
import { SnippetStringMap } from './panel'
const vscode = require('vscode');
/**
 * 快捷生成panel信息
 * 
 */

export const quickPanelProvider = languages.registerCompletionItemProvider(
    'javascript',
    {
        provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): ProviderResult<CompletionItem[] | CompletionList> {
        const linePrefix = document.lineAt(position).text.substr(0, position.character);
      
        for (const prefix in SnippetStringMap) {
          if (linePrefix.endsWith(prefix)) {
            const snippet = SnippetStringMap[prefix]  
            console.log('prefix', prefix)

            const completionItem = new CompletionItem(prefix, CompletionItemKind.Snippet);
            completionItem.insertText = new SnippetString(snippet);
            // 计算替换范围
            // range 的起始和结束位置，确保该范围覆盖的文本长度与 label 一致， 否则 不生效
            const startPos = new Position(position.line, linePrefix.length - prefix.length);
            const endPos = position;
            const range = new Range(startPos, endPos);
            completionItem.range = range;
            completionItem.detail = ` 将${prefix} 替换为输入组件的配置`;

            return [completionItem]
          }
        }
      }
    },
    ',', '.', ' '
  );
