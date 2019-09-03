'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

const AvailableFormats: {[key: string]: vscode.QuickPickItem } = {
  ascii: {
    label: 'ASCII',
    description: 'Convert to ASCII Tree',
    picked: true,
  },
  latex: {
    label: 'LaTeX',
    description: 'Convert to LaTeX (DirTree)',
  }
};

export function activate(ctx: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('extension.fileTreeToText', (startDir) => {
    vscode.window.showQuickPick(Object.values(AvailableFormats)).then((selected) => {
      // tree root item
      let tree = '';

      // ASCII Tree
      if (selected && selected.label === AvailableFormats.ascii.label) {
        tree += `${path.basename(startDir.fsPath)}/<br/>${asciiTree(startDir.fsPath, 0)}`;
      }

      // LaTeX DirTree
      if (selected && selected.label === AvailableFormats.latex.label) {
        const pre = '\dirtree{%';
        const post = '}';
        tree += `${pre}<br/>  .1 ${path.basename(startDir.fsPath)}/<br/>${latexTree(startDir.fsPath, 0)}${post}`;
      }

      const vscodeWebViewOutputTab = vscode.window.createWebviewPanel(
        'text',
        `${selected ? selected.label : ''} File Tree`,
        { viewColumn: vscode.ViewColumn.Active },
        { enableScripts: true }
      );
      // rerplace the target placeholder with the generated tree
      vscodeWebViewOutputTab.webview.html = baseTemplate.replace('###TEXTTOREPLACE###', tree);

      ctx.subscriptions.push(disposable);
    });
  });
}

export function deactivate() {}

export function format(deps: number, pipe: string, name: string, indent = '┃ ') {
  return `${Array(deps + 1).join(indent)}${pipe}${name}<br>`;
}

// directory and file ditective function
export function asciiTree(targetPath: string, deps: number) {
  let text = '';
  if (!fs.existsSync(targetPath)) { return ''; }

  // order by directory > file
  const beforSortFiles = fs.readdirSync(targetPath);
  let paths: string[] = [];

  let tmp: string[] = [];
  beforSortFiles.forEach(el => {
    const fullPath = path.join(targetPath, el.toString());
    if (fs.statSync(fullPath).isDirectory()) {
      paths.push(el);
    } else {
      tmp.push(el);
    }
  });
  paths = paths.concat(tmp);

  paths.forEach(el => {
    const fullPath = path.join(targetPath, el.toString());
    const pipe = paths.indexOf(el) === paths.length - 1 ? '┗ ' : '┣ ';

    // add directories
    if (fs.statSync(fullPath).isDirectory()) {
      text += format(
        deps,
        pipe,
        `${el.toString()}/`
      );
      text += asciiTree(fullPath, deps + 1);
    } else { // add files
      text += format(
        deps,
        pipe,
        `${el.toString()}`
      );
    }
  });
  return text;
}

// directory and file ditective function
export function latexTree(targetPath: string, deps: number) {
  let text = '';
  if (!fs.existsSync(targetPath)) { return ''; }

  // order by directory > file
  const beforSortFiles = fs.readdirSync(targetPath);
  let paths: string[] = [];

  let tmp: string[] = [];
  beforSortFiles.forEach(el => {
    const fullPath = path.join(targetPath, el.toString());
    if (fs.statSync(fullPath).isDirectory()) {
      paths.push(el);
    } else {
      tmp.push(el);
    }
  });
  paths = paths.concat(tmp);

  paths.forEach(el => {
    const fullPath = path.join(targetPath, el.toString());
    const pipe = '  ';

    // add directories
    if (fs.statSync(fullPath).isDirectory()) {
      text += format(
        deps,
        pipe,
        `.${deps + 2} ${el.toString()}/ .`,
        ''
      );
      text += latexTree(fullPath, deps + 1);
    } else { // add files
      text += format(
        deps,
        pipe,
        `.${deps + 2} ${el.toString()} .`,
        ''
      );
    }
  });
  return text;
}

const baseTemplate = `
<!DOCTYPE html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>File Tree</title>
    <style>
    </style>
  </head>

  <body>
    <!--<form class="form">
      <label>Icons:</label>
      <fieldset class="icons" id="icons">
        <input type="radio" id="icons-on" name="Icons on" value="true">
        <label for="icons-on"> Icons on</label>
        <input type="radio" id="icons-off" name="Icons off" value="false">
        <label for="icons-off"> Icons off</label>
      </fieldset>

      <label>Output format:</label>
      <fieldset class="output-format">
        <select name="format" id="format" size="5">
          <option value="ascii">ASCII</option>
          <option value="latex">LaTeX (DirTree)</option>
        </select>
      </fieldset>
    </form>-->

    <pre id="tree-panel">###TEXTTOREPLACE###</pre>
  </body>
</html>
`;