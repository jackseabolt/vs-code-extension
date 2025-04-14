import "./App.css";
import { useEffect, useState } from "react";
import { vscode } from "./vscode-api";

function App() {
  const [text, setText] = useState("");

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.command === "insertReactText") {
        setText(message.text);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleClick = () => {
    vscode.postMessage({
      command: "sendToSidebar",
      text: `React sent: ${text}`,
    });
  };

  return (
    <>
      <h2>Hello from React!</h2>
      <p>Text: {text}</p>
      <button onClick={handleClick}>Send Text to Sidebar</button>
    </>
  );
}

export default App;
