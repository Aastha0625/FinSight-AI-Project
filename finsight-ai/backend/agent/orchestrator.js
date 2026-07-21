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
        required: []
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
        required: []
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
        required: []
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
        required: []
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
          currentPortfolioValue: { type: "number" },
          expectedReturn: { type: "number" }
        },
        required: []
      }
    }
  }
];

async function runAgent({ userQuestion, documentContext, conversationHistory = [], onContent }) {
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
  let toolsUsed = [];
  let maxIterations = 10;

  while (!isFinished && maxIterations-- > 0) {
    let stream;
    try {
      stream = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: messages,
        tools: tools,
        tool_choice: "auto",
        parallel_tool_calls: false,
        stream: true,
      });
    } catch (groqErr) {
      throw groqErr;
    }

    let chunkedContent = "";
    let toolCallsMap = {};

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (!delta) continue;

      if (delta.content) {
        chunkedContent += delta.content;
        if (onContent) {
          onContent(delta.content);
        }
      }

      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          if (!toolCallsMap[tc.index]) {
            toolCallsMap[tc.index] = { id: tc.id || "", type: "function", function: { name: "", arguments: "" } };
          }
          if (tc.id) toolCallsMap[tc.index].id += tc.id;
          if (tc.function?.name) toolCallsMap[tc.index].function.name += tc.function.name;
          if (tc.function?.arguments) toolCallsMap[tc.index].function.arguments += tc.function.arguments;
        }
      }
    }

    const assembledToolCalls = Object.values(toolCallsMap);

    if (assembledToolCalls.length > 0) {
      messages.push({
        role: "assistant",
        content: chunkedContent || null,
        tool_calls: assembledToolCalls
      });

      for (const toolCall of assembledToolCalls) {
        const functionName = toolCall.function.name;
        let functionArgs = {};
        try {
          functionArgs = JSON.parse(toolCall.function.arguments || "{}");
        } catch (e) {
          console.error("Failed to parse tool arguments:", toolCall.function.arguments);
        }

        let result;
        try {
          result = executeToolCall(functionName, functionArgs);
          toolsUsed.push({ name: functionName, result });
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
      continue; // loop to send tool result to model
    } else {
      isFinished = true;
      finalContent = chunkedContent;
    }
  }

  return { answer: finalContent, toolsUsed };
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
