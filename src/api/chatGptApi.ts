import axios from "axios";
import { config } from "dotenv";
import * as path from "path";
import { SidebarWebViewProvider } from "../views/sidebarWebViewProvider";

config({ path: path.join(__dirname, "../..", ".env") });

/**
 * Handles the fetching of ChatGPT
 * queries and sends each chunch as a message
 * to main.js
 */
export async function fetchOpenAIStream(
  prompt: string,
  provider: SidebarWebViewProvider
) {
  try {
    provider.setLoading(true);

    const apiKey = process.env.CHAT_GPT_API_KEY;

    const res = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        stream: true,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        responseType: "stream",
      }
    );

    provider.clearInput();
    provider.setLoading(false);

    let partialData = "";

    res.data.on("data", (chunk: Buffer) => {
      partialData += chunk.toString();

      const lines = partialData.split("\n");
      partialData = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const jsonStr = line.replace("data: ", "").trim();

          if (jsonStr === "[DONE]") {
            provider.sendResponseChunkToWebview("[DONE]");
            return;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const textChunk = parsed.choices?.[0]?.delta?.content;

            if (textChunk) {
              provider.sendResponseChunkToWebview(textChunk);
            }
          } catch (err) {
            provider.sendResponseChunkToWebview("[ERROR]");
          }
        }
      }
    });

    res.data.on("end", () => {
      provider.sendResponseChunkToWebview("[DONE]");
    });

    res.data.on("error", (err: Error) => {
      provider.sendResponseChunkToWebview("[ERROR]");
    });
  } catch (error) {
    console.error("error", error);
    provider.sendResponseChunkToWebview("[ERROR]");
  }
}
