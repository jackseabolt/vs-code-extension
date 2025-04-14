import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { SidebarWebViewProvider } from "./views/sidebarWebViewProvider";

export function activate(context: vscode.ExtensionContext) {
  const provider = new SidebarWebViewProvider(context.extensionUri, context);

  let panel: vscode.WebviewPanel | undefined;

  /**
   * Registers the sidebar view
   */
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("cognichip-sidebar", provider)
  );

  /**
   * Registers the main panel
   */
  context.subscriptions.push(
    vscode.commands.registerCommand("viteReactWebview.showPanel", () => {
      panel = vscode.window.createWebviewPanel(
        "viteReactWebview",
        "Vite React Webview",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
        }
      );

      const htmlPath = path.join(
        context.extensionPath,
        "reactBuild",
        "index.html"
      );
      let html = fs.readFileSync(htmlPath, "utf8");

      // Fix the paths for JS/CSS so they load properly in the webview
      html = html.replace(/(href|src)="(.+?)"/g, (match, p1, p2) => {
        const fullPath = vscode.Uri.file(
          path.join(context.extensionPath, "reactBuild", p2)
        );
        const webviewUri = panel!.webview.asWebviewUri(fullPath);
        return `${p1}="${webviewUri}"`;
      });

      panel.webview.html = html;

      /**
       * Wires up the sidebar to recieve messages from the
       * react view
       */
      panel.webview.onDidReceiveMessage((message) => {
        if (message.command === "sendToSidebar") {
          provider.sendTextToSidebar(message.text);
        }
      });
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

  /**
   * Listen for messages FROM the sidebar, and forward them TO the panel
   */
  provider.onDidReceiveMessage((message: any) => {
    if (message.command === "insertReactText" && panel) {
      panel.webview.postMessage({
        command: "insertReactText",
        text: message.text,
      });
    }
  });
}
