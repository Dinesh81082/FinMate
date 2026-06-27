import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.ts';
import { GoogleGenAI } from '@google/genai';
import { memoryTransactions, queryTransactions } from '../models/transactionModel.ts';
import { fetchUserBudgets } from '../models/budgetModel.ts';

/**
 * Lazy initialization of GoogleGenAI client
 */
let genAiClient: GoogleGenAI | null = null;
function getGenAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!genAiClient) {
    genAiClient = new GoogleGenAI({ apiKey });
  }
  return genAiClient;
}

/**
 * POST /api/v1/ai/chat
 */
export const aiChatHandler = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user_id = req.user?.id || 'usr_mock_01';
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ status: 'error', message: 'Message prompt is required.' });
      return;
    }

    // Fetch user context
    let transactions: any[] = [];
    try {
      const txRes = await queryTransactions({ user_id, limit: 50 });
      transactions = txRes?.data || [];
    } catch {
      transactions = memoryTransactions.filter(tx => tx.user_id === user_id || user_id === 'usr_mock_01');
    }

    let budgetsData: any = { budgets: [], summary: {} };
    try {
      budgetsData = await fetchUserBudgets(user_id);
    } catch {
      // fallback
    }

    const txSummary = transactions.slice(0, 25).map(t => `- ${t.date}: ${t.merchant} (${t.category}) | $${t.amount} [${t.type}]`).join('\n');
    const budgetSummary = budgetsData.budgets?.map((b: any) => `- ${b.category}: $${b.spent} spent of $${b.amount} budget (${b.percentage}%)`).join('\n') || 'No budget records.';

    const systemInstruction = `You are FinMate AI, an intelligent personal finance assistant built into the FinMate dashboard.
You help users analyze their expenses, track budgets, and discover savings tips.

Here is the user's live financial context:

### MONTHLY BUDGET PLAN
${budgetSummary}

### RECENT TRANSACTIONS (Top 25)
${txSummary || 'No recent transactions found.'}

### GUIDELINES:
- Give clear, helpful, and concise financial advice.
- Use Markdown formatting (bullet points, bold highlights, tables if appropriate) for high scannability.
- When answering "Where did I spend the most?", aggregate the expenses by merchant or category from the transactions provided.
- If asking for savings tips, identify categories with high spending or exceeded budgets and suggest concrete action items.`;

    const ai = getGenAiClient();

    // If Gemini API key is not configured or in sandbox offline mode
    if (!ai) {
      const fallbackReply = generateSimulatedAiReply(message, transactions, budgetsData.budgets || []);
      res.status(200).json({
        status: 'success',
        reply: fallbackReply,
        isSimulated: true
      });
      return;
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: message,
        config: {
          systemInstruction,
          temperature: 0.7
        }
      });

      res.status(200).json({
        status: 'success',
        reply: response.text || 'I analyzed your finances, but could not generate a response.'
      });
    } catch (apiErr: any) {
      console.log('ℹ️ Gemini API live call unavailable in sandbox, switching seamlessly to simulated analysis.');
      const fallbackReply = generateSimulatedAiReply(message, transactions, budgetsData.budgets || []);
      res.status(200).json({
        status: 'success',
        reply: fallbackReply,
        isSimulated: true
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Smart simulated fallback reply when API key is missing or offline
 */
function generateSimulatedAiReply(prompt: string, txs: any[], budgets: any[]): string {
  const lower = prompt.toLowerCase();
  const expenses = txs.filter(t => t.type === 'Expense');
  const totalSpent = expenses.reduce((sum, t) => sum + Number(t.amount || 0), 0);

  if (lower.includes('where') || lower.includes('most') || lower.includes('highest')) {
    // find highest category
    const catMap: Record<string, number> = {};
    expenses.forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount); });
    const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    const topCat = sorted[0] || ['Other', 0];

    return `### 📊 Spending Breakdown Analysis\n\nBased on your recent transactions, your highest spending category is **${topCat[0]}** with a total of **$${topCat[1].toFixed(2)}**.\n\n**Top Categories:**\n` +
      sorted.slice(0, 4).map(([cat, amt]) => `- **${cat}**: $${amt.toFixed(2)} (${totalSpent > 0 ? ((amt/totalSpent)*100).toFixed(0) : 0}%)`).join('\n') +
      `\n\n💡 *Tip: Consider setting a stricter monthly cap on ${topCat[0]} in your Budget Planner.*`;
  }

  if (lower.includes('tip') || lower.includes('saving') || lower.includes('reduce')) {
    const exceeded = budgets.filter(b => b.isExceeded);
    let alertMsg = exceeded.length > 0
      ? `⚠️ You have exceeded your budget in **${exceeded.map(b => b.category).join(', ')}**.`
      : `✅ Your budget categories are currently on track.`;

    return `### 💡 Personalized Savings Suggestions\n\n${alertMsg}\n\nHere are 3 actionable tips based on your spending profile:\n\n1. **Automate 20% to Savings**: Schedule an automatic transfer right after payday before discretionary spending occurs.\n2. **Audit Recurring Subscriptions**: Check your SaaS and entertainment charges. Eliminating just one unused subscription saves ~$15/month.\n3. **Grocery Meal Planning**: Your grocery and dining expenses can be optimized by prepping meals ahead of busy weekdays.`;
  }

  if (lower.includes('budget') || lower.includes('create')) {
    return `### 📋 Monthly Budget Framework (50/30/20 Rule)\n\nTo optimize your cash flow based on your recent activity, here is a recommended allocation:\n\n| Category | Recommended Allocation | Target Amount |\n|---|---|---|\n| **Needs** (Housing, Utilities) | 50% | $2,100 |\n| **Wants** (Dining, Entertainment) | 30% | $1,260 |\n| **Savings & Debt** | 20% | $840 |\n\nHead over to the **Budget Planner** tab to adjust your category targets directly!`;
  }

  return `### 🤖 FinMate Financial Summary\n\nYou have logged **${txs.length} transactions** recently with total expenses of **$${totalSpent.toFixed(2)}** across **${budgets.length} budget categories**.\n\nHow else can I assist you today? You can ask me to:\n- Analyze where you spent the most\n- Provide personalized saving tips\n- Review your budget progress`;
}
