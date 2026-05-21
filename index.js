const express = require("express");
const Anthropic = require("@anthropic-ai/sdk");

const app = express();
app.use(express.json());

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

app.post("/api/analyze-review", async (req, res) => {
  const { review_text, star_rating, platform } = req.body;
  if (!review_text) {
    return res.status(400).json({ error: "review_text is required" });
  }
  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: `You are an expert e-commerce review analyst. Respond ONLY with a valid JSON object. No extra text.`,
      messages: [{
        role: "user",
        content: `Analyze this review and respond with ONLY this JSON:
        {
          "sentiment": "Positive" or "Negative" or "Neutral",
          "summary": "one sentence summary",
          "key_themes": ["theme1", "theme2"],
          "urgency_level": "Low" or "Medium" or "High",
          "recommended_action": "what the store owner should do"
        }
        Review: "${review_text}"
        Star Rating: ${star_rating}/5
        Platform: ${platform}`
      }]
    });
    const parsed = JSON.parse(message.content[0].text);
    return res.status(200).json({ success: true, analysis: parsed });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/generate-response", async (req, res) => {
  const { review_text, star_rating, store_name, store_tone } = req.body;
  if (!review_text) {
    return res.status(400).json({ error: "review_text is required" });
  }
  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: `You are an expert e-commerce copywriter. Respond ONLY with a valid JSON object. No extra text.`,
      messages: [{
        role: "user",
        content: `Write a response to this customer review.
        Respond with ONLY this JSON:
        {
          "response_text": "the full response to post publicly",
          "tone_used": "the tone applied",
          "word_count": number
        }
        Store Name: ${store_name}
        Store Tone: ${store_tone || "Professional and friendly"}
        Star Rating: ${star_rating}/5
        Review: "${review_text}"`
      }]
    });
    const parsed = JSON.parse(message.content[0].text);
    return res.status(200).json({ success: true, response: parsed });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "operational", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`ReviewAI Backend running on port ${PORT}`);
});
