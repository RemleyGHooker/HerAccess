import { Groq } from "groq-sdk";
import type { NewNewsUpdate } from "@db/schema";

const STATES = ['IN', 'IL'];

export async function scrapeNewsUpdates(state: string): Promise<NewNewsUpdate[]> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY environment variable is not set");
  }

  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
  });

  try {
    console.log(`Fetching news updates for ${state}`);

    const prompt = `As a reproductive healthcare policy expert, analyze and summarize the most recent reproductive healthcare news, laws, and policy updates for ${state} state. Format your response as JSON with the following structure for each update:
    {
      "updates": [
        {
          "title": "Brief, informative title",
          "content": "Detailed summary of the update (2-3 sentences)",
          "sourceUrl": "URL of a reliable source covering this update",
          "sourceName": "Name of the source organization",
          "category": "One of: Policy, Access, Legal, Healthcare, Education",
          "publishedAt": "YYYY-MM-DD format date"
        }
      ]
    }

    Focus on factual, verified information from reliable sources like state health departments, major news outlets, and healthcare organizations. Include relative source URLs.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a reproductive healthcare policy expert focused on providing accurate, up-to-date information about healthcare access and policies."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "mixtral-8x7b-32768",
      temperature: 0.5,
      max_tokens: 2048,
      response_format: { type: "json_object" }
    });

    const response = JSON.parse(completion.choices[0]?.message?.content || "{}");

    if (!response.updates || !Array.isArray(response.updates)) {
      console.error("Invalid response format from Groq AI");
      return [];
    }

    const newsUpdates: NewNewsUpdate[] = response.updates.map((update: any) => ({
      title: update.title,
      content: update.content,
      sourceUrl: update.sourceUrl,
      sourceName: update.sourceName,
      state,
      category: update.category,
      publishedAt: new Date(update.publishedAt),
      createdAt: new Date(),
      relevanceScore: 1.0 // Default score, could be enhanced with sentiment analysis
    }));

    console.log(`Found ${newsUpdates.length} updates for ${state}`);
    return newsUpdates;
  } catch (error) {
    console.error(`Error fetching news updates for ${state}:`, error);
    return [];
  }
}