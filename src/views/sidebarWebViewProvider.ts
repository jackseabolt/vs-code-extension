import * as vscode from "vscode";
import { getNonce } from "../utils/nonceUtils";
import { fetchOpenAIStream } from "../api/chatGptApi";

export class SidebarWebViewProvider implements vscode.WebviewViewProvider {
  constructor(
    private readonly _extensionUri: vscode.Uri,
    public extensionContext: vscode.ExtensionContext
  ) {}

  view?: vscode.WebviewView;

  resolveWebviewView(webviewView: vscode.WebviewView) {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, "media")],
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    /**
     * Receives messages fired rom main.js
     * and acts upon them
     */
    webviewView.webview.onDidReceiveMessage(async (message) => {
      if (message.command === "fetchOpenAIStream") {
        await fetchOpenAIStream(message.text, this);
      } else if (message.command === "insertIntoEditor") {
        await this.insertTextIntoEditor(message.text);
      }
    });
  }

  /**
   * Inserts text from the ChatGPT response into
   * the code editor for user manipulation
   */
  private async insertTextIntoEditor(text: string) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage("No active editor found");
      return;
    }

    if (!text.trim()) {
      vscode.window.showErrorMessage("No text to insert");
      return;
    }

    await editor.edit((editBuilder) => {
      editBuilder.insert(editor.selection.active, text);
    });

    vscode.window.showInformationMessage("Text inserted into editor");
  }

  /**
   * Sends a message to activate loading display
   */
  public setLoading(isActive: boolean) {
    if (this.view) {
      this.view.webview.postMessage({
        command: "setLoading",
        value: isActive,
      });
    }
  }

  /**
   * Takes highlighted text from the open
   * text editor and sends a message received
   * by main.js
   */
  public sendTextToSidebar(text: string) {
    if (this.view) {
      this.view.webview.postMessage({
        command: "insertText",
        text: text,
      });

      vscode.window.showInformationMessage("Text copied to sidebar");
    }
  }

  /**
   * Clears the input area
   */
  public clearInput() {
    if (this.view) {
      this.view.webview.postMessage({
        command: "clearInput",
      });
    }
  }

  /**
   * Send chunk of ChatGPT response stream
   * to main.js to be appended in the UI
   */
  public sendResponseChunkToWebview(chunk: string) {
    if (this.view) {
      if (chunk === "[ERROR]") {
        vscode.window.showErrorMessage("There was a network error");
      }

      this.view.webview.postMessage({
        command: "streamUpdate",
        text: chunk,
      });
    }
  }

  /**
   * Renders the UI of the sidebar
   */
  private getHtmlForWebview(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "main.js")
    );

    const stylesMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "index.css")
    );

    const nonce = getNonce();

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          
          <meta http-equiv="Content-Security-Policy" content="
              default-src 'none';
              style-src ${webview.cspSource} 'unsafe-inline';
              script-src 'nonce-${nonce}';
              img-src ${webview.cspSource} https:;
              connect-src https://api.openai.com;
          ">

          <title>Chat GPT</title>

          <link href="${stylesMainUri}" rel="stylesheet">
      </head>
      <body>
        <div id="view-container">
            <main id="response-display">
                <div id="loader"></div>
                <p id="prompt-output"></p>
                <button id="copy-btn">
                  <img src="${webview.asWebviewUri(
                    vscode.Uri.joinPath(this._extensionUri, "media", "copy.svg")
                  )}" alt="Copy">
                </button>
            </main>
            <section id="form-section">
              <form id="prompt-form">
                  <textarea id="prompt-input" placeholder="Ask a question"></textarea>
                  <button id="submit-btn" type="submit">Submit</button>
              </form>
            </section>
        </div>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>`;
  }
}
