import {
	window, 
	commands, 
	Disposable, 
	ExtensionContext, 
	StatusBarAlignment, 
	StatusBarItem, TextDocument
} from 'vscode';


// 字数统计器
export class WordCounter {
	// 注册并声明一个状态栏项
	private _statusBarItem: StatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
	// 计算函数
	public updateWordCount() {
		// 当前编辑器
		let editor = window.activeTextEditor;
		if (!editor) {
			this._statusBarItem.hide();
			return;
		}
		let doc = editor.document;
		// 限制文件类型
		if (doc.languageId === 'markdown') {
			this._statusBarItem.text = `helper 统计了 ${this._getWordCount(doc)} 个字`;
			this._statusBarItem.show();
		}
	}
	// 获取文件字数
	public _getWordCount(doc:TextDocument): number {

		let docContent = doc.getText() //文本字数
		let wordCount = 0
		if (docContent !== "") {
            wordCount = docContent.length;
        }
        console.log('update',wordCount)

        return wordCount;
	}
	// 卸载插件被释放时调用
	dispose() {
        this._statusBarItem.dispose();
    }
}


/***
 * 订阅事件
 */
export class WordCounterController {
	private _wordCounter: WordCounter; // 字数统计器
	private _disposable: Disposable; // 释放器

	constructor(wordCountor: WordCounter) {
		this._wordCounter = wordCountor;
		// 收集所有事件的Disposable， 统一释放
		let subscriptions: Disposable[] = [];
		
		// 订阅编辑器改变事件
        
        //激活编辑器（打开的编辑器）切换的时候触发
		window.onDidChangeActiveTextEditor(this._onEvents, this, subscriptions)
         //鼠标位置变动时触发
        window.onDidChangeTextEditorSelection(this._onEvents, this, subscriptions);
		this._wordCounter.updateWordCount();

        // 把两个事件订阅器整合成一个临时容器
        this._disposable = Disposable.from(...subscriptions);
	}
    _onEvents(){
       this._wordCounter.updateWordCount()
    }
    
    dispose() {
        this._disposable.dispose();
    }
}