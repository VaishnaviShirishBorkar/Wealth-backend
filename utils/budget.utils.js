import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import { sendBudgetExceededEmail } from "./email.utils.js";

const getMonthRange = () => {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setMonth(end.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

export const checkBudgetAndNotify = async (account, userEmail, userId) => {
  console.log('account.monthlySavingGoal ', account.monthlySavingGoal);
  
  if (!account.monthlySavingGoal) return;

  const { start, end } = getMonthRange();

  const result = await Transaction.aggregate([
    {
      $match: {
        // accountId: account._id,
        // userId,
        accountId: new mongoose.Types.ObjectId(account._id),
        userId: new mongoose.Types.ObjectId(userId), // 🔥 FIX
        type: "expense",
        date: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" }
      }
    }
  ]);

  const spent = result[0]?.total || 0;
  const budget = account.monthlySavingGoal;

  const spentPercent = (spent / budget) * 100;
  console.log('budget ', budget);
  

  console.log("📊 Budget check:", {
    accountId: account._id,
    spent,
    budget,
    percent: spentPercent,
    userId,
    userEmail
  });

  const alreadyNotifiedThisMonth =
    account.budgetWarningNotifiedAt &&
    account.budgetWarningNotifiedAt >= start;

  // 🔥 ONE condition ONLY
  if (spent > budget) {
    console.log('budget utils sending email');
    
    await sendBudgetExceededEmail(userEmail, spent, budget);

    account.budgetWarningNotifiedAt = new Date();
    await account.save();
  }
};
