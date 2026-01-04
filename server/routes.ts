import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { registerChatRoutes } from "./replit_integrations/chat";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(app: Express): Promise<Server> {
  registerChatRoutes(app);

  app.post("/api/arya/chat", async (req: Request, res: Response) => {
    try {
      const { messages, systemPrompt, userContext } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array is required" });
      }

      let enhancedSystemPrompt = systemPrompt || "";
      if (userContext) {
        enhancedSystemPrompt += `\n\nUser Context:
- Name: ${userContext.name || "Unknown"}
- Role: ${userContext.role || "layperson"}
- Known conditions: ${userContext.conditions?.join(", ") || "None recorded"}
- Known allergies: ${userContext.allergies?.join(", ") || "None recorded"}`;
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const chatMessages = [
        { role: "system" as const, content: enhancedSystemPrompt },
        ...messages.slice(1).map((m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: chatMessages,
        stream: true,
        max_completion_tokens: 2048,
      });

      let fullResponse = "";

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);

          const lowerContent = fullResponse.toLowerCase();
          if (
            lowerContent.includes("call 911") ||
            lowerContent.includes("emergency room") ||
            lowerContent.includes("seek immediate") ||
            lowerContent.includes("life-threatening")
          ) {
            res.write(`data: ${JSON.stringify({ emergency: true })}\n\n`);
          }
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error in ARYA chat:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to get response" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to process chat request" });
      }
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
