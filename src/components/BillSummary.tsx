'use client';

import { useMemo } from 'react';
import { Expense, Participant } from '@/types';

interface BillSummaryProps {
  expenses: Expense[];
  participants: Participant[];
}

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export default function BillSummary({ expenses, participants }: BillSummaryProps) {
  const settlements = useMemo(() => {
    // Calculate how much each person has paid
    const totalPaid: Record<string, number> = {};
    participants.forEach((p) => {
      totalPaid[p.id] = 0;
    });

    // Calculate total paid by each person
    expenses.forEach((expense) => {
      totalPaid[expense.paidBy] += expense.amount;
    });

    // Calculate how much each person owes
    const totalOwed: Record<string, number> = {};
    participants.forEach((p) => {
      totalOwed[p.id] = 0;
    });

    // Calculate shares for each expense
    expenses.forEach((expense) => {
      const shareAmount = expense.amount / expense.splitAmong.length;
      expense.splitAmong.forEach((participantId) => {
        totalOwed[participantId] += shareAmount;
      });
    });

    // Calculate net amounts (positive means they are owed money)
    const netAmounts: Record<string, number> = {};
    participants.forEach((p) => {
      netAmounts[p.id] = totalPaid[p.id] - totalOwed[p.id];
    });

    // Calculate settlements
    const settlements: Settlement[] = [];
    const debtors = participants
      .filter((p) => netAmounts[p.id] < 0)
      .sort((a, b) => netAmounts[a.id] - netAmounts[b.id]);
    const creditors = participants
      .filter((p) => netAmounts[p.id] > 0)
      .sort((a, b) => netAmounts[b.id] - netAmounts[a.id]);

    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      
      const debtAmount = Math.abs(netAmounts[debtor.id]);
      const creditAmount = netAmounts[creditor.id];
      
      const settlementAmount = Math.min(debtAmount, creditAmount);
      
      if (settlementAmount > 0.01) { // Ignore tiny amounts due to floating point
        settlements.push({
          from: debtor.id,
          to: creditor.id,
          amount: Number(settlementAmount.toFixed(2)),
        });
      }

      netAmounts[debtor.id] += settlementAmount;
      netAmounts[creditor.id] -= settlementAmount;

      if (Math.abs(netAmounts[debtor.id]) < 0.01) i++;
      if (Math.abs(netAmounts[creditor.id]) < 0.01) j++;
    }

    return settlements;
  }, [expenses, participants]);

  const getParticipantName = (id: string) => {
    return participants.find((p) => p.id === id)?.name || 'Unknown';
  };

  if (expenses.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        No expenses added yet. Add some expenses to see the summary.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Expenses Summary</h3>
        <ul className="space-y-2">
          {expenses.map((expense) => (
            <li key={expense.id} className="bg-gray-50 p-3 rounded">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{expense.description}</p>
                  <p className="text-sm text-gray-600">
                    Paid by {getParticipantName(expense.paidBy)}
                  </p>
                </div>
                <span className="font-medium">${expense.amount.toFixed(2)}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-2">Settlements</h3>
        {settlements.length > 0 ? (
          <ul className="space-y-2">
            {settlements.map((settlement, index) => (
              <li key={index} className="bg-green-50 p-3 rounded">
                <div className="flex justify-between items-center">
                  <span>
                    {getParticipantName(settlement.from)} pays{' '}
                    {getParticipantName(settlement.to)}
                  </span>
                  <span className="font-medium">${settlement.amount.toFixed(2)}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No settlements needed.</p>
        )}
      </div>
    </div>
  );
} 