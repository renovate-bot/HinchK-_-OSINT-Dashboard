import { InvestigationState } from "../types";

export async function processInvestigationUpdate(
  currentState: InvestigationState,
  chatHistory: { role: string; content: string }[],
  userInput: string
): Promise<{ state: InvestigationState; chatResponse: string }> {
  try {
    const response = await fetch("/api/investigate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        currentState,
        chatHistory,
        userInput,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to communicate with Sentinel_OS");
    }

    return await response.json();
  } catch (error) {
    console.error("OSINT Interface Error:", error);
    throw error;
  }
}
