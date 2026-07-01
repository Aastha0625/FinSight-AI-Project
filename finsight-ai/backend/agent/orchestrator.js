const Groq = require('groq-sdk');
const { SYSTEM_PROMPT } = require('./systemPrompt');
const toolsIndex = require('../tools/index');

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const tools = [
  {
    type: "function",
    function: {
      name: "calculate_sip_maturity",
      description: "Calculates the maturity value of a Systematic Investment Plan (SIP).",
      parameters: {
        type: "object",
        properties: {
          monthlyAmount: { type: "number", description: "Monthly SIP amount" },
          annualReturnPercent: { type: "number", description: "Expected annual return percentage" },
          years: { type: "number", description: "Number of years for investment" }
        },
        required: ["monthlyAmount", "annualReturnPercent", "years"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "check_insurance_adequacy",
      description: "Checks if the current insurance cover is adequate based on income and dependents.",
      parameters: {
        type: "object",
        properties: {
          annualIncome: { type: "number", description: "Annual income" },
          currentCover: { type: "number", description: "Current insurance cover amount" },
          yearsToRetirement: { type: "number", description: "Years left until retirement" },
          dependents: { type: "number", description: "Number of dependents" }
        },
        required: ["annualIncome", "currentCover", "yearsToRetirement", "dependents"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "compare_loan_vs_invest",
      description: "Compares prepaying a loan versus investing the amount.",
      parameters: {
        type: "object",
        properties: {
          loanOutstanding: { type: "number" },
          loanInterestRate: { type: "number" },
          investmentAmount: { type: "number" },
          expectedReturnRate: { type: "number" },
          years: { type: "number" }
        },
        required: ["loanOutstanding", "loanInterestRate", "investmentAmount", "expectedReturnRate", "years"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "plan_monthly_cashflow",
      description: "Analyzes monthly cashflow to determine if commitments are healthy or stressed.",
      parameters: {
        type: "object",
        properties: {
          monthlyIncome: { type: "number" },
          emis: { type: "array", items: { type: "number" } },
          sipAmounts: { type: "array", items: { type: "number" } },
          insurancePremiums: { type: "array", items: { type: "number" } }
        },
        required: ["monthlyIncome", "emis", "sipAmounts", "insurancePremiums"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "analyse_goal_gap",
      description: "Analyzes the gap for a specific financial goal and suggests additional SIP needed.",
      parameters: {
        type: "object",
        properties: {
          goalName: { type: "string" },
          targetAmount: { type: "number" },
          targetYear: { type: "number" },
          currentSIPAmount: { type: "number" },
          expectedReturn: { type: "number" }
        },
        required: ["goalName", "targetAmount", "targetYear", "currentSIPAmount", "expectedReturn"]
      }
    }
  }
];

async function runAgent({ userQuestion, documentContext, conversationHistory = [] }) {
  const MAX_DOC_LENGTH = 25000;

  let promptText = "";
  if (documentContext && documentContext.trim().length > 0) {
    let contextStr = documentContext.trim();
    if (contextStr.length > MAX_DOC_LENGTH) {
      contextStr = contextStr.substring(0, MAX_DOC_LENGTH) + "\n\n... [DOCUMENT TRUNCATED DUE TO SIZE LIMIT]";
    }
    promptText += `[DOCUMENTS]\n${contextStr}\n[/DOCUMENTS]\n\n`;
  }
  promptText += userQuestion;

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...conversationHistory.slice(-6),
    { role: "user", content: promptText }
  ];

  let isFinished = false;
  let finalContent = "";
  let maxIterations = 10;

  while (!isFinished && maxIterations-- > 0) {
    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: messages,
      tools: tools,
      tool_choice: "auto",
    });

    const choice = response.choices[0];
    const responseMessage = choice.message;
    const finishReason = choice.finish_reason;

    // ── Case 1: proper API-level tool_calls ──────────────────────────────
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      messages.push(responseMessage);

      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        let result;
        try {
          result = executeToolCall(functionName, functionArgs);
        } catch (err) {
          result = { error: err.message };
        }

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          name: functionName,
          content: JSON.stringify(result),
        });
      }
      continue; // loop again for the model's final answer
    }

    // ── Case 2: model returned a JSON tool-call string in content (fallback) ──
    const contentStr = (responseMessage.content || "").trim();
    let parsedToolCall = null;
    if (contentStr.startsWith("{") && contentStr.includes("\"type\"") && contentStr.includes("\"name\"")) {
      try {
        parsedToolCall = JSON.parse(contentStr);
      } catch (_) { /* not valid JSON, ignore */ }
    }

    if (parsedToolCall && parsedToolCall.name && (parsedToolCall.parameters || parsedToolCall.arguments)) {
      const functionName = parsedToolCall.name;
      const functionArgs = parsedToolCall.parameters || parsedToolCall.arguments || {};
      // Coerce string numbers to actual numbers
      const coercedArgs = {};
      for (const [k, v] of Object.entries(functionArgs)) {
        coercedArgs[k] = isNaN(v) ? v : Number(v);
      }

      let result;
      try {
        result = executeToolCall(functionName, coercedArgs);
      } catch (err) {
        result = { error: err.message };
      }

      // Inject the tool result as a user message and loop again
      messages.push({ role: "assistant", content: contentStr });
      messages.push({
        role: "user",
        content: `Tool "${functionName}" returned this result: ${JSON.stringify(result)}\n\nPlease now provide a clear financial analysis using this data.`,
      });
      continue;
    }

    // ── Case 3: normal text answer — done ───────────────────────────────
    isFinished = true;
    finalContent = responseMessage.content;
  }

  return finalContent;
}

function executeToolCall(name, args) {
  switch (name) {
    case 'calculate_sip_maturity':      return toolsIndex.calculateSIPMaturity(args);
    case 'check_insurance_adequacy':    return toolsIndex.checkInsuranceAdequacy(args);
    case 'compare_loan_vs_invest':      return toolsIndex.compareLoanVsInvest(args);
    case 'plan_monthly_cashflow':       return toolsIndex.planMonthlyCashflow(args);
    case 'analyse_goal_gap':            return toolsIndex.analyseGoalGap(args);
    default: throw new Error(`Tool "${name}" not found`);
  }
}

module.exports = { runAgent };
