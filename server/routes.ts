import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { registerChatRoutes } from "./replit_integrations/chat";
import OpenAI from "openai";
import { db } from "./db";
import { chronicConditions, alternativeMedicines, userAlternativeMedicineUsage } from "@shared/schema";
import { eq, sql, desc, and } from "drizzle-orm";

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

  app.get("/api/chronic-conditions", async (_req: Request, res: Response) => {
    try {
      const conditions = await db.select().from(chronicConditions).orderBy(chronicConditions.name);
      res.json(conditions);
    } catch (error) {
      console.error("Error fetching conditions:", error);
      res.status(500).json({ error: "Failed to fetch conditions" });
    }
  });

  app.get("/api/alternative-medicines", async (_req: Request, res: Response) => {
    try {
      const medicines = await db.select().from(alternativeMedicines).orderBy(alternativeMedicines.name);
      res.json(medicines);
    } catch (error) {
      console.error("Error fetching medicines:", error);
      res.status(500).json({ error: "Failed to fetch medicines" });
    }
  });

  app.get("/api/alternative-medicines/recommendations/:conditionId", async (req: Request, res: Response) => {
    try {
      const conditionId = parseInt(req.params.conditionId);
      const recommendations = await db
        .select({
          medicineId: userAlternativeMedicineUsage.medicineId,
          medicineName: alternativeMedicines.name,
          medicineType: alternativeMedicines.type,
          medicineDescription: alternativeMedicines.description,
          totalUsers: sql<number>`count(*)::int`,
          helpingCount: sql<number>`sum(case when ${userAlternativeMedicineUsage.isHelping} then 1 else 0 end)::int`,
        })
        .from(userAlternativeMedicineUsage)
        .innerJoin(alternativeMedicines, eq(userAlternativeMedicineUsage.medicineId, alternativeMedicines.id))
        .where(eq(userAlternativeMedicineUsage.conditionId, conditionId))
        .groupBy(userAlternativeMedicineUsage.medicineId, alternativeMedicines.name, alternativeMedicines.type, alternativeMedicines.description)
        .orderBy(desc(sql`count(*)`));

      const ranked = recommendations.map((rec, index) => ({
        ...rec,
        rank: index + 1,
        helpfulPercentage: rec.totalUsers > 0 ? Math.round((rec.helpingCount / rec.totalUsers) * 100) : 0,
      }));

      res.json(ranked);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ error: "Failed to fetch recommendations" });
    }
  });

  app.get("/api/user/:userId/alternative-medicines", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const usages = await db
        .select({
          id: userAlternativeMedicineUsage.id,
          conditionId: userAlternativeMedicineUsage.conditionId,
          conditionName: chronicConditions.name,
          medicineId: userAlternativeMedicineUsage.medicineId,
          medicineName: alternativeMedicines.name,
          medicineType: alternativeMedicines.type,
          isHelping: userAlternativeMedicineUsage.isHelping,
          dosage: userAlternativeMedicineUsage.dosage,
          frequency: userAlternativeMedicineUsage.frequency,
          notes: userAlternativeMedicineUsage.notes,
          startedAt: userAlternativeMedicineUsage.startedAt,
        })
        .from(userAlternativeMedicineUsage)
        .innerJoin(chronicConditions, eq(userAlternativeMedicineUsage.conditionId, chronicConditions.id))
        .innerJoin(alternativeMedicines, eq(userAlternativeMedicineUsage.medicineId, alternativeMedicines.id))
        .where(eq(userAlternativeMedicineUsage.userId, userId))
        .orderBy(desc(userAlternativeMedicineUsage.createdAt));

      res.json(usages);
    } catch (error) {
      console.error("Error fetching user medicines:", error);
      res.status(500).json({ error: "Failed to fetch user medicines" });
    }
  });

  app.post("/api/user/:userId/alternative-medicines", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { conditionId, medicineId, isHelping, dosage, frequency, notes } = req.body;

      const [usage] = await db.insert(userAlternativeMedicineUsage).values({
        userId,
        conditionId,
        medicineId,
        isHelping: isHelping || false,
        dosage,
        frequency,
        notes,
      }).returning();

      res.status(201).json(usage);
    } catch (error) {
      console.error("Error adding user medicine:", error);
      res.status(500).json({ error: "Failed to add medicine" });
    }
  });

  app.patch("/api/user/:userId/alternative-medicines/:usageId", async (req: Request, res: Response) => {
    try {
      const { usageId } = req.params;
      const { isHelping, dosage, frequency, notes } = req.body;

      const [updated] = await db
        .update(userAlternativeMedicineUsage)
        .set({ isHelping, dosage, frequency, notes })
        .where(eq(userAlternativeMedicineUsage.id, parseInt(usageId)))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("Error updating user medicine:", error);
      res.status(500).json({ error: "Failed to update medicine" });
    }
  });

  app.delete("/api/user/:userId/alternative-medicines/:usageId", async (req: Request, res: Response) => {
    try {
      const { usageId } = req.params;
      await db.delete(userAlternativeMedicineUsage).where(eq(userAlternativeMedicineUsage.id, parseInt(usageId)));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user medicine:", error);
      res.status(500).json({ error: "Failed to delete medicine" });
    }
  });

  app.post("/api/seed-alternative-medicine-data", async (_req: Request, res: Response) => {
    try {
      const existingConditions = await db.select().from(chronicConditions).limit(1);
      if (existingConditions.length > 0) {
        return res.json({ message: "Data already seeded" });
      }

      await db.insert(chronicConditions).values([
        { name: "Diabetes Type 2", category: "Metabolic", description: "Chronic condition affecting blood sugar regulation" },
        { name: "Hypertension", category: "Cardiovascular", description: "Chronic high blood pressure" },
        { name: "Arthritis", category: "Musculoskeletal", description: "Joint inflammation and pain" },
        { name: "Asthma", category: "Respiratory", description: "Chronic respiratory condition" },
        { name: "Migraine", category: "Neurological", description: "Recurring severe headaches" },
        { name: "Chronic Pain", category: "Pain Management", description: "Persistent pain lasting over 3 months" },
        { name: "Anxiety", category: "Mental Health", description: "Persistent anxiety disorder" },
        { name: "Depression", category: "Mental Health", description: "Major depressive disorder" },
        { name: "Insomnia", category: "Sleep", description: "Chronic difficulty sleeping" },
        { name: "IBS", category: "Digestive", description: "Irritable bowel syndrome" },
      ]);

      await db.insert(alternativeMedicines).values([
        { name: "Turmeric (Curcumin)", type: "Herbal", description: "Anti-inflammatory spice extract" },
        { name: "Ashwagandha", type: "Ayurvedic", description: "Adaptogenic herb for stress and vitality" },
        { name: "Cinnamon", type: "Herbal", description: "Helps regulate blood sugar levels" },
        { name: "Omega-3 Fish Oil", type: "Supplement", description: "Essential fatty acids for heart and brain health" },
        { name: "Ginger", type: "Herbal", description: "Anti-nausea and anti-inflammatory" },
        { name: "Magnesium", type: "Supplement", description: "Essential mineral for muscle and nerve function" },
        { name: "Probiotics", type: "Supplement", description: "Beneficial gut bacteria" },
        { name: "Valerian Root", type: "Herbal", description: "Natural sleep aid" },
        { name: "CBD Oil", type: "Cannabinoid", description: "Non-psychoactive cannabis extract for pain and anxiety" },
        { name: "Acupuncture", type: "Traditional Medicine", description: "Chinese medicine needle therapy" },
        { name: "Yoga", type: "Mind-Body", description: "Physical and mental practice for wellness" },
        { name: "Meditation", type: "Mind-Body", description: "Mental practice for stress reduction" },
        { name: "Glucosamine", type: "Supplement", description: "Joint health supplement" },
        { name: "Feverfew", type: "Herbal", description: "Traditional migraine prevention herb" },
        { name: "Berberine", type: "Herbal", description: "Plant compound for blood sugar and cholesterol" },
      ]);

      res.json({ message: "Data seeded successfully" });
    } catch (error) {
      console.error("Error seeding data:", error);
      res.status(500).json({ error: "Failed to seed data" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
