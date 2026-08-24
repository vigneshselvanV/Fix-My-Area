import { DEFAULT_OPENROUTER_KEY, DEFAULT_OPENROUTER_MODEL } from './riskAssessment';

export interface ChatbotResponse {
  reply: string;
  success: boolean;
}

const STATIC_FAQ_BLOCK = `FixMyArea Application Knowledge Base:
- Purpose: Civic issue reporting and municipal dispatch platform for citizens.
- Allowed Categories: Pothole, Garbage, Streetlight, Water Leak, Drainage, Stray Animal.
- Status Lifecycle: Reported (newly submitted) -> Acknowledged (verified by department) -> In Progress (field team dispatched) -> Resolved (hazard fixed).
- Risk Levels: Low (routine maintenance), Medium (scheduled in 48h), High (urgent dispatch), Critical (emergency safety hazard).
- How to Report: Tap the central '+' button or navigate to /report/new, select category, upload a photo, set GPS location, and submit.
- Duplicate Detection: Uses 50-meter Haversine GPS proximity check to link duplicate reports and aggregate community upvotes.
- Upvoting & Verification: Citizens upvote reports to elevate civic priority. Flagging alerts administrators for spam or duplicate reviews.`;

const SYSTEM_INSTRUCTION = `You are the FixMyArea citizen assistant, a friendly civic-app helper. Only answer questions about FixMyArea: reporting civic issues, report statuses, risk levels, categories, duplicate detection, and upvoting. If asked about anything unrelated to FixMyArea (general knowledge, other topics, personal advice), politely decline and redirect to what you can help with. Keep answers under 60 words, plain language, no markdown formatting, no code blocks. If you don't have enough information to answer (e.g. you don't have the user's report data), say so honestly instead of guessing.`;

// Quick offline heuristic fallback for common FixMyArea inquiries when offline or on failure
function getQuickHeuristicAnswer(query: string, userReportsSummary?: string): string | null {
  const lower = query.toLowerCase();

  if (lower.includes('how do i report') || lower.includes('how to report') || lower.includes('file a report')) {
    return 'To report an issue, tap the "+" button or go to Report Issue. Choose a category (like Pothole or Garbage), add a photo, confirm your GPS pin, and click Submit Report!';
  }

  if (lower.includes('category') || lower.includes('categories') || lower.includes('what can i report')) {
    return 'You can report 6 categories: Pothole, Garbage, Streetlight, Water Leak, Drainage, and Stray Animal. Each report is automatically triaged for municipal action.';
  }

  if (lower.includes('risk') || lower.includes('priority') || lower.includes('scoring')) {
    return 'Risk scoring ranges from Low (routine work) to Critical (immediate danger). Our AI and municipal rules assess category severity, photo evidence, and nearby duplicate counts.';
  }

  if (lower.includes('duplicate') || lower.includes('same issue')) {
    return 'Our system automatically detects reports within 50 meters in the same category. Duplicates are merged so upvotes combine without creating redundant municipal work orders.';
  }

  if (lower.includes('upvote') || lower.includes('vote') || lower.includes('flag')) {
    return 'Upvoting verifies that an issue is genuine and elevates its priority queue for city workers. Flagging alerts municipal officers if a report is spam or invalid.';
  }

  if ((lower.includes('my report') || lower.includes('status') || lower.includes('check report')) && userReportsSummary) {
    return `Here is your recent report update:\n${userReportsSummary}`;
  }

  return null;
}

export async function askAssistant(
  userMessage: string,
  userReportsContext?: string
): Promise<ChatbotResponse> {
  const openRouterApiKey =
    localStorage.getItem('fixmyarea_openrouter_key') ||
    (import.meta as any).env?.VITE_OPENROUTER_API_KEY ||
    DEFAULT_OPENROUTER_KEY;

  const preferredModel =
    localStorage.getItem('fixmyarea_openrouter_model') ||
    DEFAULT_OPENROUTER_MODEL;

  // Build the structured user turn
  let fullPromptContent = `${STATIC_FAQ_BLOCK}\n\n`;

  if (userReportsContext && userReportsContext.trim().length > 0) {
    fullPromptContent += `Citizen's Recent Filed Reports:\n${userReportsContext}\n\n`;
  } else {
    fullPromptContent += `Citizen's Recent Filed Reports: None found or not signed in.\n\n`;
  }

  fullPromptContent += `Citizen Question: ${userMessage.trim()}`;

  // Call OpenRouter with a strict 5-second timeout
  if (openRouterApiKey && openRouterApiKey.startsWith('sk-or-')) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const modelsToTry = [
      preferredModel,
      'deepseek/deepseek-chat',
      'meta-llama/llama-3.3-70b-instruct:free',
      'google/gemini-2.0-flash-exp:free',
      'openrouter/auto',
    ];

    // Remove duplicates while preserving priority order
    const uniqueModels = Array.from(new Set(modelsToTry));

    for (const model of uniqueModels) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openRouterApiKey}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'FixMyArea Citizen Assistant',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: SYSTEM_INSTRUCTION },
              { role: 'user', content: fullPromptContent },
            ],
            temperature: 0.3,
            max_tokens: 150,
          }),
          signal: controller.signal,
        });

        if (response.ok) {
          clearTimeout(timeoutId);
          const data = await response.json();
          const reply = data?.choices?.[0]?.message?.content?.trim();
          if (reply && reply.length > 0) {
            // Clean any potential markdown fences or backticks
            const cleanedReply = reply.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();
            return {
              reply: cleanedReply,
              success: true,
            };
          }
        }
      } catch (err: any) {
        // Continue to try next model or fallback
      }
    }

    clearTimeout(timeoutId);
  }

  // If OpenRouter times out, fails, or is offline: check heuristic fallback or friendly polite message
  const heuristic = getQuickHeuristicAnswer(userMessage, userReportsContext);
  if (heuristic) {
    return {
      reply: heuristic,
      success: true,
    };
  }

  return {
    reply: "Sorry, I'm having trouble connecting right now — please try again in a moment.",
    success: false,
  };
}
