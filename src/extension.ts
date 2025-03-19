import * as vscode from "vscode";
import { SidebarWebViewProvider } from "./views/sidebarWebViewProvider";

export function activate(context: vscode.ExtensionContext) {
  const provider = new SidebarWebViewProvider(context.extensionUri, context);

  /**
   * Registers the sidebar view
   */
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("cognichip-sidebar", provider)
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
