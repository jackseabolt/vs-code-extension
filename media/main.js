(function () {
  const vscode = acquireVsCodeApi();

  const promptInput = document.getElementById("prompt-input");
  const promptOutput = document.getElementById("prompt-output");
  const promptForm = document.getElementById("prompt-form");
  const copyButton = document.getElementById("copy-btn");
  const loader = document.getElementById("loader");

  /**
   * Receives messages sent from other areas
   * of the extension and processes them in the UI
   */
  window.addEventListener("message", (event) => {
    const message = event.data;

    switch (message.command) {
      /**
       * Handles text being copied from the
       * open code editor into the ChatGPT
       * prompt input
       */
      case "insertText":
        promptInput.value = message.text;
        break;

      /**
       * Handles the response from OpenAPI
       * queries streaming from extension.js
       */
      case "streamUpdate":
        if (message.text === "[ERROR]") {
          copyButton.style.display = "none";
          loader.style.display = "none";
          break;
        }

        if (message.text === "[DONE]") {
          copyButton.style.display = "block";
          break;
        }

        promptOutput.textContent += message.text;
        break;

      /**
       * Handles the display of the loader
       * and copy icon during ChatGPT requests
       */
      case "setLoading":
        if (message.value) {
          promptInput.value = "";
          promptOutput.textContent = "";
          loader.style.display = "block";
          copyButton.style.display = "none";
        } else {
          loader.style.display = "none";
          copyButton.style.display = "block";
        }
        break;

      /**
       * Clears input. Used when a second
       * query is submitted by the user
       */
      case "clearInput":
        promptInput.value = "";
        break;

      default:
        console.warn(`Unhandled command: ${message.command}`);
    }
  });

  /**
   * Sends a message to submit a query
   * to ChatGPT
   */
  promptForm.addEventListener("submit", (e) => {
    e.preventDefault();

    vscode.postMessage({
      command: "fetchOpenAIStream",
      text: promptInput.value,
    });
  });

  /**
   * Sends a message to trigger functionality that
   * inserts the copied response into the
   * code open in the editor
   */
  copyButton.addEventListener("click", () => {
    vscode.postMessage({
      command: "insertIntoEditor",
      text: promptOutput.textContent,
    });
  });

  /**
   * Sends a message to submit the form when the user
   * the "Enter" key
   */
  promptInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault(); // Prevent new line
      promptForm.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true })
      );
    }
  });
})();
