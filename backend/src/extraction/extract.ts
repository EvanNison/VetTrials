import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { TrialExtractionSchema, type TrialExtraction } from "./schema.js";
import { EXTRACTION_PROMPT } from "./prompt.js";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Max ~50K tokens (~200K chars) to stay safely within Haiku's context window
// (model limit is 200K tokens; we need room for the prompt + output tokens)
const MAX_PREPROCESSED_LENGTH = 200_000;

export function preprocessHtml(html: string): string {
  let processed = html;

  // Phase 0: If page has a <main> tag, extract just that content to avoid nav/sidebar bloat
  const mainMatch = processed.match(/<main[\s\S]*?>([\s\S]*)<\/main>/i);
  if (mainMatch) {
    processed = mainMatch[1];
  }

  // Phase 1: Strip non-content elements
  processed = processed.replace(/<script[\s\S]*?<\/script>/gi, "");
  processed = processed.replace(/<style[\s\S]*?<\/style>/gi, "");
  processed = processed.replace(/<nav[\s\S]*?<\/nav>/gi, "");
  processed = processed.replace(/<header[\s\S]*?<\/header>/gi, "");
  processed = processed.replace(/<footer[\s\S]*?<\/footer>/gi, "");
  processed = processed.replace(/<aside[\s\S]*?<\/aside>/gi, "");
  processed = processed.replace(/<noscript[\s\S]*?<\/noscript>/gi, "");
  processed = processed.replace(/<iframe[\s\S]*?<\/iframe>/gi, "");
  processed = processed.replace(/<!--[\s\S]*?-->/g, "");
  processed = processed.replace(/<img[^>]*>/gi, "");
  processed = processed.replace(/<svg[\s\S]*?<\/svg>/gi, "");
  processed = processed.replace(/<link[^>]*>/gi, "");
  processed = processed.replace(/<meta[^>]*>/gi, "");
  processed = processed.replace(/\s+/g, " ");
  processed = processed.trim();

  // Phase 2: If still too large, strip HTML attributes (keep href only) and form elements
  if (processed.length > MAX_PREPROCESSED_LENGTH) {
    processed = processed.replace(/<form[\s\S]*?<\/form>/gi, "");
    processed = processed.replace(/<input[^>]*>/gi, "");
    processed = processed.replace(/<select[\s\S]*?<\/select>/gi, "");
    // Strip attributes except href
    processed = processed.replace(/<([a-z][a-z0-9]*)\s+(?![^>]*href)[^>]*>/gi, "<$1>");
    processed = processed.replace(/\s+/g, " ").trim();
  }

  // Phase 3: If STILL too large, strip all HTML tags and keep just text + links
  if (processed.length > MAX_PREPROCESSED_LENGTH) {
    // Preserve links as [url] markers
    processed = processed.replace(/<a\s[^>]*href="([^"]*?)"[^>]*>/gi, "[$1] ");
    processed = processed.replace(/<\/a>/gi, "");
    processed = processed.replace(/<[^>]+>/g, " ");
    processed = processed.replace(/&nbsp;/gi, " ");
    processed = processed.replace(/&amp;/gi, "&");
    processed = processed.replace(/\s+/g, " ").trim();
  }

  // Phase 4: Hard truncate as last resort
  if (processed.length > MAX_PREPROCESSED_LENGTH) {
    processed = processed.slice(0, MAX_PREPROCESSED_LENGTH);
  }

  return processed;
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
