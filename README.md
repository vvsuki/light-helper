# light-helper README

This is the README for your extension "light-helper". After writing up a brief description, we recommend including the following sections.

## 插件说明

Light Helper 是一个 VSCode 插件，用于帮助使用 Light 低代码平台的开发者快速生成 panel， 并将 panel 转换 Light 组件的 options 配置。

## 功能特性

1. quickPanel 快速生成 panel 
2. optionsTranser 将 panel 转换 Light 组件的 options 配置	

## 使用说明

1. 使用`lightbase.*`（组件名称 | input | select | checkbox |... ）,  快速生成对应的 panel 配置
2. 右键命令 - `生成LightOptions`  将 panel 转换 Light 组件的 options 配置	

## 效果展示

![quickPanel](images/quickPanel.gif)
![optionsTranser](images/optionsTranser.gif)

## Requirements

因为公司的node版本是14.x， 所以如果要新准备一个vscode插件开发时，新建项目需要使用1.4.18版本的generator-code， 否则会报错。

> Tip: npm install -g yo@4.3.1 generator-code@1.4.18

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: enable/disable this extension
* `myExtension.thing`: set to `blah` to do something

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

-----------------------------------------------------------------------------------------------------------
## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

**Note:** You can author your README using Visual Studio Code.  Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux)
* Toggle preview (`Shift+CMD+V` on macOS or `Shift+Ctrl+V` on Windows and Linux)
* Press `Ctrl+Space` (Windows, Linux) or `Cmd+Space` (macOS) to see a list of Markdown snippets

### For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
