import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { SidebarWebViewProvider } from "./views/sidebarWebViewProvider";

export function activate(context: vscode.ExtensionContext) {
  const provider = new SidebarWebViewProvider(context.extensionUri, context);

  /**
   * Registers the sidebar view
   */
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("cognichip-sidebar", provider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("viteReactWebview.showPanel", () => {
      const panel = vscode.window.createWebviewPanel(
        "viteReactWebview",
        "Vite React Webview",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
        }
      );

      const htmlPath = path.join(
        context.extensionPath,
        "react-media",
        "index.html"
      );
      let html = fs.readFileSync(htmlPath, "utf8");

      // Fix the paths for JS/CSS so they load properly in the webview
      html = html.replace(/(href|src)="(.+?)"/g, (match, p1, p2) => {
        const fullPath = vscode.Uri.file(
          path.join(context.extensionPath, "react-media", p2)
        );
        const webviewUri = panel.webview.asWebviewUri(fullPath);
        return `${p1}="${webviewUri}"`;
      });

      panel.webview.html = html;
    })
  );

  /**
   * Registers the right-click command to copy text
   * from the open code editor to the input of the
   * sidebar
   */
  context.subscriptions.push(
    vscode.commands.registerCommand("extension.sendTextToSidebar", () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const selection = editor.selection;
        const text = editor.document.getText(selection);

        if (text.trim() !== "") {
          provider.sendTextToSidebar(text);
        } else {
          vscode.window.showWarningMessage("No text selected.");
        }
      }
    })
  );
}
