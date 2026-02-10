import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { registerChatRoutes } from "./replit_integrations/chat";
import OpenAI from "openai";
import { db } from "./db";
import { chronicConditions, alternativeMedicines, userAlternativeMedicineUsage, wearableReadings, healthReports, visualAssessments } from "@shared/schema";
import { eq, sql, desc, and, gte, lte } from "drizzle-orm";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const sarvam = new OpenAI({
  apiKey: process.env.SARVAM_API_KEY,
  baseURL: "https://api.sarvam.ai/v1",
});

async function seedAlternativeMedicineData() {
  try {
    const existingConditions = await db.select().from(chronicConditions).limit(1);
    if (existingConditions.length > 0) {
      return;
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

    console.log("Alternative medicine data seeded successfully");
  } catch (error) {
    console.error("Error seeding alternative medicine data:", error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  registerChatRoutes(app);

  await seedAlternativeMedicineData();

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

      const stream = await sarvam.chat.completions.create({
        model: "sarvam-m",
        messages: chatMessages,
        stream: true,
        max_tokens: 2048,
        temperature: 0.7,
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
            lowerContent.includes("life-threatening") ||
            lowerContent.includes("call 112") ||
            lowerContent.includes("call 108")
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

  app.get("/api/user/:userId/wearable-readings", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { limit = "30", period } = req.query;

      let startDate: Date | undefined;
      if (period === "day") {
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
      } else if (period === "week") {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
      } else if (period === "month") {
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
      } else if (period === "quarter") {
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3);
      } else if (period === "year") {
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
      }

      let readings;
      if (startDate) {
        readings = await db
          .select()
          .from(wearableReadings)
          .where(and(eq(wearableReadings.userId, userId), gte(wearableReadings.recordedAt, startDate)))
          .orderBy(desc(wearableReadings.recordedAt))
          .limit(parseInt(limit as string));
      } else {
        readings = await db
          .select()
          .from(wearableReadings)
          .where(eq(wearableReadings.userId, userId))
          .orderBy(desc(wearableReadings.recordedAt))
          .limit(parseInt(limit as string));
      }

      res.json(readings);
    } catch (error) {
      console.error("Error fetching wearable readings:", error);
      res.status(500).json({ error: "Failed to fetch wearable readings" });
    }
  });

  app.post("/api/user/:userId/wearable-readings", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const readingData = req.body;

      const [reading] = await db.insert(wearableReadings).values({
        userId,
        ...readingData,
      }).returning();

      res.status(201).json(reading);
    } catch (error) {
      console.error("Error adding wearable reading:", error);
      res.status(500).json({ error: "Failed to add wearable reading" });
    }
  });

  app.get("/api/user/:userId/health-reports", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { reportType } = req.query;

      let reports;
      if (reportType) {
        reports = await db
          .select()
          .from(healthReports)
          .where(and(eq(healthReports.userId, userId), eq(healthReports.reportType, reportType as string)))
          .orderBy(desc(healthReports.createdAt))
          .limit(10);
      } else {
        reports = await db
          .select()
          .from(healthReports)
          .where(eq(healthReports.userId, userId))
          .orderBy(desc(healthReports.createdAt))
          .limit(10);
      }

      res.json(reports);
    } catch (error) {
      console.error("Error fetching health reports:", error);
      res.status(500).json({ error: "Failed to fetch health reports" });
    }
  });

  app.post("/api/user/:userId/health-reports/generate", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { reportType = "daily" } = req.body;

      let startDate = new Date();
      if (reportType === "daily" || reportType === "hourly") {
        startDate.setDate(startDate.getDate() - 1);
      } else if (reportType === "weekly") {
        startDate.setDate(startDate.getDate() - 7);
      } else if (reportType === "monthly") {
        startDate.setMonth(startDate.getMonth() - 1);
      } else if (reportType === "quarterly") {
        startDate.setMonth(startDate.getMonth() - 3);
      } else if (reportType === "yearly") {
        startDate.setFullYear(startDate.getFullYear() - 1);
      }

      const readings = await db
        .select()
        .from(wearableReadings)
        .where(and(eq(wearableReadings.userId, userId), gte(wearableReadings.recordedAt, startDate)))
        .orderBy(desc(wearableReadings.recordedAt));

      if (readings.length === 0) {
        return res.status(400).json({ error: "No wearable data found for the specified period" });
      }

      const avgHeartRate = readings.filter(r => r.heartRate).reduce((sum, r) => sum + (r.heartRate || 0), 0) / readings.filter(r => r.heartRate).length || 0;
      const avgHRV = readings.filter(r => r.heartRateVariability).reduce((sum, r) => sum + (r.heartRateVariability || 0), 0) / readings.filter(r => r.heartRateVariability).length || 0;
      const avgSpO2 = readings.filter(r => r.bloodOxygenSaturation).reduce((sum, r) => sum + (r.bloodOxygenSaturation || 0), 0) / readings.filter(r => r.bloodOxygenSaturation).length || 0;
      const totalSteps = readings.reduce((sum, r) => sum + (r.steps || 0), 0);
      const avgSleepDuration = readings.filter(r => r.sleepDuration).reduce((sum, r) => sum + (r.sleepDuration || 0), 0) / readings.filter(r => r.sleepDuration).length || 0;
      const avgSleepQuality = readings.filter(r => r.sleepQuality).reduce((sum, r) => sum + (r.sleepQuality || 0), 0) / readings.filter(r => r.sleepQuality).length || 0;
      const avgStressLevel = readings.filter(r => r.stressLevel).reduce((sum, r) => sum + (r.stressLevel || 0), 0) / readings.filter(r => r.stressLevel).length || 0;
      const avgVO2Max = readings.filter(r => r.vo2Max).reduce((sum, r) => sum + (r.vo2Max || 0), 0) / readings.filter(r => r.vo2Max).length || 0;
      const avgRecoveryScore = readings.filter(r => r.recoveryScore).reduce((sum, r) => sum + (r.recoveryScore || 0), 0) / readings.filter(r => r.recoveryScore).length || 0;
      const avgRespiratoryRate = readings.filter(r => r.respiratoryRate).reduce((sum, r) => sum + (r.respiratoryRate || 0), 0) / readings.filter(r => r.respiratoryRate).length || 0;
      const avgBodyTemp = readings.filter(r => r.bodyTemperature).reduce((sum, r) => sum + (r.bodyTemperature || 0), 0) / readings.filter(r => r.bodyTemperature).length || 0;
      const avgActiveMinutes = readings.reduce((sum, r) => sum + (r.activeMinutes || 0), 0);
      const avgCalories = readings.reduce((sum, r) => sum + (r.caloriesBurned || 0), 0);
      const afibDetections = readings.filter(r => r.afibDetected).length;
      const fallDetections = readings.filter(r => r.fallDetected).length;

      const healthDataSummary = `
WEARABLE HEALTH DATA ANALYSIS (${reportType} report, ${readings.length} data points)

HEART & CIRCULATION:
- Average Heart Rate: ${avgHeartRate.toFixed(1)} bpm
- Average HRV: ${avgHRV.toFixed(1)} ms
- Average Resting Heart Rate: ${readings.filter(r => r.restingHeartRate).length > 0 ? (readings.filter(r => r.restingHeartRate).reduce((sum, r) => sum + (r.restingHeartRate || 0), 0) / readings.filter(r => r.restingHeartRate).length).toFixed(1) : 'N/A'} bpm
- AFib Detections: ${afibDetections}

BLOOD METRICS:
- Average SpO2: ${avgSpO2.toFixed(1)}%
- Average Blood Pressure: ${readings.filter(r => r.bloodPressureSystolic).length > 0 ? `${(readings.filter(r => r.bloodPressureSystolic).reduce((sum, r) => sum + (r.bloodPressureSystolic || 0), 0) / readings.filter(r => r.bloodPressureSystolic).length).toFixed(0)}/${(readings.filter(r => r.bloodPressureDiastolic).reduce((sum, r) => sum + (r.bloodPressureDiastolic || 0), 0) / readings.filter(r => r.bloodPressureDiastolic).length).toFixed(0)}` : 'N/A'} mmHg

BREATHING & RESPIRATION:
- Average Respiratory Rate: ${avgRespiratoryRate.toFixed(1)} breaths/min

BODY TEMPERATURE:
- Average Body Temperature: ${avgBodyTemp > 0 ? avgBodyTemp.toFixed(1) : 'N/A'} F

ACTIVITY & MOVEMENT:
- Total Steps: ${totalSteps}
- Total Active Minutes: ${avgActiveMinutes}
- Total Calories Burned: ${avgCalories}
- VO2 Max: ${avgVO2Max > 0 ? avgVO2Max.toFixed(1) : 'N/A'}

SLEEP & RECOVERY:
- Average Sleep Duration: ${(avgSleepDuration / 60).toFixed(1)} hours
- Average Sleep Quality: ${avgSleepQuality.toFixed(0)}/100
- Average Recovery Score: ${avgRecoveryScore.toFixed(0)}/100

STRESS & NERVOUS SYSTEM:
- Average Stress Level: ${avgStressLevel.toFixed(0)}/100

SAFETY ALERTS:
- Fall Detections: ${fallDetections}
`;

      const aiPrompt = `You are a medical AI health analyst for ErPrana, a personalized health assistant app. Analyze the following wearable device data and provide a comprehensive, personalized health report.

${healthDataSummary}

Please provide:
1. SUMMARY: A brief 2-3 sentence overall health assessment
2. KEY INSIGHTS: 3-5 specific observations about the user's health based on the data
3. RECOMMENDATIONS: 3-5 actionable health recommendations
4. RISK FACTORS: Any potential health concerns based on the data (if applicable)
5. TRENDS: Notable patterns in the data (improvements or declines)
6. SCORES: Rate each category from 0-100:
   - Overall Health Score
   - Heart Health Score
   - Sleep Score
   - Activity Score
   - Stress Score (lower stress = higher score)

Format your response as JSON with the following structure:
{
  "summary": "Overall health assessment...",
  "insights": ["insight 1", "insight 2", ...],
  "recommendations": ["recommendation 1", "recommendation 2", ...],
  "riskFactors": ["risk 1", "risk 2", ...] or [],
  "trends": ["trend 1", "trend 2", ...],
  "overallScore": 75,
  "heartHealthScore": 80,
  "sleepScore": 70,
  "activityScore": 65,
  "stressScore": 60
}

Be encouraging but honest. Focus on actionable advice. If any metric is concerning (e.g., very low SpO2, AFib detection), flag it prominently.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: aiPrompt }],
        response_format: { type: "json_object" },
        max_completion_tokens: 2048,
      });

      const aiAnalysis = JSON.parse(response.choices[0].message.content || "{}");

      const [report] = await db.insert(healthReports).values({
        userId,
        reportType,
        periodStart: startDate,
        periodEnd: new Date(),
        summary: aiAnalysis.summary || "Health report generated",
        insights: aiAnalysis.insights || [],
        recommendations: aiAnalysis.recommendations || [],
        riskFactors: aiAnalysis.riskFactors || [],
        trends: aiAnalysis.trends || [],
        overallScore: aiAnalysis.overallScore || 0,
        heartHealthScore: aiAnalysis.heartHealthScore || 0,
        sleepScore: aiAnalysis.sleepScore || 0,
        activityScore: aiAnalysis.activityScore || 0,
        stressScore: aiAnalysis.stressScore || 0,
      }).returning();

      res.status(201).json(report);
    } catch (error) {
      console.error("Error generating health report:", error);
      res.status(500).json({ error: "Failed to generate health report" });
    }
  });

  // Visual Assessment endpoints
  app.post("/api/user/:userId/visual-assessments/analyze", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { imageBase64 } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: "Image data is required" });
      }

      const visionPrompt = `You are a medical AI visual assessment assistant for ErPrana health app. Analyze this image of a patient and provide a comprehensive visual assessment.

Please analyze the following aspects:

1. CONSCIOUSNESS LEVEL: Assess the patient's apparent consciousness state (alert, drowsy, lethargic, unresponsive, cannot determine)

2. FACIAL EXPRESSION / PAIN INDICATORS: Analyze facial expression for:
   - Pain signs (grimacing, furrowed brow, clenched jaw)
   - Emotional state (calm, anxious, distressed, agitated)
   - Discomfort level (none, mild, moderate, severe)

3. SKIN CONDITION: Assess visible skin for:
   - Color (normal, pale, flushed, cyanotic/blue, jaundiced/yellow)
   - Moisture (dry, normal, diaphoretic/sweaty)
   - Any visible rashes, lesions, or abnormalities

4. BODY POSITION: Describe:
   - Current position (sitting, lying, standing)
   - Posture (relaxed, guarding, rigid, asymmetric)
   - Any visible limb positioning concerns

5. VISIBLE INJURIES: Identify any visible:
   - Bleeding, bruising, swelling
   - Wounds, cuts, abrasions
   - Burns or trauma signs
   - Location and apparent severity

6. ENVIRONMENT NOTES: Describe relevant environmental factors if visible:
   - Medical equipment present
   - Setting (home, medical facility, outdoor)
   - Any safety concerns

7. INTERVENTIONS DETECTED: Note any visible medical interventions:
   - IV lines, oxygen equipment
   - Bandages, splints, braces
   - Monitoring devices

8. OVERALL ASSESSMENT: Provide a summary of findings

9. URGENCY LEVEL: Rate the apparent urgency (routine, concerning, urgent, emergency)

10. RECOMMENDATIONS: List 2-3 immediate recommendations

Format your response as JSON:
{
  "consciousnessLevel": "alert/drowsy/lethargic/unresponsive/cannot_determine",
  "painIndicators": {
    "painSigns": ["list of observed pain signs"],
    "emotionalState": "calm/anxious/distressed/agitated",
    "discomfortLevel": "none/mild/moderate/severe"
  },
  "facialExpression": "description of facial expression",
  "skinCondition": "description of skin condition",
  "bodyPosition": "description of body position",
  "visibleInjuries": ["list of observed injuries with locations"],
  "environmentNotes": "description of environment",
  "interventionsDetected": ["list of medical interventions observed"],
  "overallAssessment": "comprehensive summary",
  "urgencyLevel": "routine/concerning/urgent/emergency",
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}

If you cannot determine certain aspects from the image, indicate "cannot determine" or "not visible" for those fields.
Be thorough but avoid making assumptions beyond what is clearly visible.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: visionPrompt },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
                  detail: "high",
                },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 2048,
      });

      const analysis = JSON.parse(response.choices[0].message.content || "{}");

      const [assessment] = await db.insert(visualAssessments).values({
        userId,
        imageBase64: imageBase64.substring(0, 100) + "...", // Store truncated for reference
        consciousnessLevel: analysis.consciousnessLevel,
        painIndicators: analysis.painIndicators,
        facialExpression: analysis.facialExpression,
        skinCondition: analysis.skinCondition,
        bodyPosition: analysis.bodyPosition,
        visibleInjuries: analysis.visibleInjuries,
        environmentNotes: analysis.environmentNotes,
        interventionsDetected: analysis.interventionsDetected,
        overallAssessment: analysis.overallAssessment,
        urgencyLevel: analysis.urgencyLevel,
        recommendations: analysis.recommendations,
        rawAnalysis: response.choices[0].message.content,
      }).returning();

      res.status(201).json({
        ...assessment,
        analysis,
      });
    } catch (error) {
      console.error("Error analyzing visual assessment:", error);
      res.status(500).json({ error: "Failed to analyze image" });
    }
  });

  app.get("/api/user/:userId/visual-assessments", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { limit = "20" } = req.query;

      const assessments = await db
        .select()
        .from(visualAssessments)
        .where(eq(visualAssessments.userId, userId))
        .orderBy(desc(visualAssessments.createdAt))
        .limit(parseInt(limit as string));

      res.json(assessments);
    } catch (error) {
      console.error("Error fetching visual assessments:", error);
      res.status(500).json({ error: "Failed to fetch assessments" });
    }
  });

  app.get("/api/user/:userId/visual-assessments/:assessmentId", async (req: Request, res: Response) => {
    try {
      const { assessmentId } = req.params;

      const [assessment] = await db
        .select()
        .from(visualAssessments)
        .where(eq(visualAssessments.id, parseInt(assessmentId)));

      if (!assessment) {
        return res.status(404).json({ error: "Assessment not found" });
      }

      res.json(assessment);
    } catch (error) {
      console.error("Error fetching visual assessment:", error);
      res.status(500).json({ error: "Failed to fetch assessment" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
