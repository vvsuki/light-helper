import { CompletionItem, CompletionItemKind, SnippetString, Range } from "vscode";
import { CompletionItemInfo } from "../types";

// 生成完整的补全数据
export function getComponentCompletionItems(completionItemInfo: CompletionItemInfo[], range: Range ):CompletionItem[] {
    const completionItems:CompletionItem[] = [];
    completionItemInfo.forEach((item) => {
        const completionItem = new CompletionItem(item.label, CompletionItemKind.Snippet);
        completionItem.insertText = new SnippetString(item.snippetString);
        completionItem.detail = item.detail;
        completionItem.range = range;
        console.log('range3', completionItem)

        completionItems.push(completionItem)
    })
    return completionItems;
}