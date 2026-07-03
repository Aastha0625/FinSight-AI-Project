const Groq = require('groq-sdk');
const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function extractSummary(documentContext) {
  const MAX_DOC_LENGTH = 25000;
  let contextStr = documentContext || "";
  if (contextStr.length > MAX_DOC_LENGTH) {
    contextStr = contextStr.substring(0, MAX_DOC_LENGTH) + "\n\n... [TRUNCATED]";
  }

  const prompt = `You are a financial data extraction AI. Extract the financial details from the following document into a strict JSON object. Do not wrap it in markdown block quotes (no \`\`\`json). Just return the raw JSON.
  
Required JSON Schema:
{
  "sips": [{"fundName": "string", "monthlyAmount": "number", "startDate": "string"}],
  "policies": [{"type": "string", "sumAssured": "number", "premium": "number", "maturityDate": "string"}],
  "loans": [{"type": "string", "emi": "number", "outstanding": "number", "interestRate": "number", "endDate": "string"}],
  "totalMonthlySIP": "number",
  "totalInsuranceCover": "number",
  "totalMonthlyEMI": "number"
}

If you cannot find any information for a category, use an empty array for lists and 0 for totals.

Document:
${contextStr}
`;

  try {
    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });
    
    const result = JSON.parse(response.choices[0].message.content);

    const parseNum = (val) => {
      if (!val) return 0;
      if (typeof val === 'number') return val;
      const parsed = Number(String(val).replace(/[^0-9.-]+/g, ""));
      return isNaN(parsed) ? 0 : parsed;
    };

    if ((!result.totalMonthlySIP || result.totalMonthlySIP === 0) && result.sips?.length > 0) {
      result.totalMonthlySIP = result.sips.reduce((sum, sip) => sum + parseNum(sip.monthlyAmount), 0);
    }
    if ((!result.totalInsuranceCover || result.totalInsuranceCover === 0) && result.policies?.length > 0) {
      result.totalInsuranceCover = result.policies.reduce((sum, pol) => sum + parseNum(pol.sumAssured), 0);
    }
    if ((!result.totalMonthlyEMI || result.totalMonthlyEMI === 0) && result.loans?.length > 0) {
      result.totalMonthlyEMI = result.loans.reduce((sum, loan) => sum + parseNum(loan.emi), 0);
    }

    return result;
  } catch (err) {
    console.error("Extraction error:", err);
    // fallback empty state
    return {
      sips: [], policies: [], loans: [],
      totalMonthlySIP: 0, totalInsuranceCover: 0, totalMonthlyEMI: 0
    };
  }
}

module.exports = { extractSummary };
