import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { TrialExtractionSchema, type TrialExtraction } from "./schema.js";
import { EXTRACTION_PROMPT } from "./prompt.js";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export function preprocessHtml(html: string): string {
  let processed = html;
  processed = processed.replace(/<script[\s\S]*?<\/script>/gi, "");
  processed = processed.replace(/<style[\s\S]*?<\/style>/gi, "");
  processed = processed.replace(/<nav[\s\S]*?<\/nav>/gi, "");
  processed = processed.replace(/<header[\s\S]*?<\/header>/gi, "");
  processed = processed.replace(/<footer[\s\S]*?<\/footer>/gi, "");
  processed = processed.replace(/<!--[\s\S]*?-->/g, "");
  processed = processed.replace(/<img[^>]*>/gi, "");
  processed = processed.replace(/<svg[\s\S]*?<\/svg>/gi, "");
  processed = processed.replace(/\s+/g, " ");
  return processed.trim();
}

export async function extractTrials(
  html: string,
  sourceName: string
): Promise<{ trials: TrialExtraction[]; tokensUsed: number }> {
  const preprocessed = preprocessHtml(html);

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 16384,
    messages: [
      {
        role: "user",
        content: `Extract all veterinary clinical trials from this ${sourceName} webpage HTML into a JSON array.\n\n${EXTRACTION_PROMPT}\n\nHTML:\n${preprocessed}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  const tokensUsed =
    (response.usage.input_tokens || 0) + (response.usage.output_tokens || 0);

  // Strip any markdown code fences if present
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      `Claude returned invalid JSON for ${sourceName}: ${cleaned.slice(0, 200)}`
    );
  }

  if (!Array.isArray(parsed)) {
    // Sometimes Claude wraps in an object
    if (parsed && typeof parsed === "object" && "trials" in parsed) {
      parsed = (parsed as Record<string, unknown>).trials;
    } else {
      throw new Error(
        `Claude returned non-array for ${sourceName}: ${typeof parsed}`
      );
    }
  }

  // Coerce common Claude output issues before Zod validation
  const coerced = (parsed as Record<string, unknown>[]).map((trial) => ({
    ...trial,
    species: Array.isArray(trial.species) ? trial.species : trial.species ? [trial.species] : ["dog"],
    condition_category: trial.condition_category || "other",
    enrollment_status: trial.enrollment_status || "unknown",
  }));

  const validated = z.array(TrialExtractionSchema).parse(coerced);
  return { trials: validated, tokensUsed };
}
