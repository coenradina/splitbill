'use client';

import { useState } from 'react';
import { Expense, Participant } from '@/types';

interface AddExpenseProps {
  onAdd: (expense: Expense) => void;
  participants: Participant[];
}

export default function AddExpense({ onAdd, participants }: AddExpenseProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitAmong, setSplitAmong] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || !paidBy || splitAmong.length === 0) return;

    const newExpense: Expense = {
      id: crypto.randomUUID(),
      description: description.trim(),
      amount: parseFloat(amount),
      paidBy,
      splitAmong,
    };

    onAdd(newExpense);
    setDescription('');
    setAmount('');
    setPaidBy('');
    setSplitAmong([]);
  };

  const handleSplitAmongChange = (participantId: string) => {
    setSplitAmong((prev) =>
      prev.includes(participantId)
        ? prev.filter((id) => id !== participantId)
        : [...prev, participantId]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <input
          type="text"
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholder="Enter expense description"
        />
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
          Amount
        </label>
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholder="Enter amount"
          min="0"
          step="0.01"
        />
      </div>

      <div>
        <label htmlFor="paidBy" className="block text-sm font-medium text-gray-700">
          Paid By
        </label>
        <select
          id="paidBy"
          value={paidBy}
          onChange={(e) => setPaidBy(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="">Select who paid</option>
          {participants.map((participant) => (
            <option key={participant.id} value={participant.id}>
              {participant.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Split Among</label>
        <div className="mt-2 space-y-2">
          {participants.map((participant) => (
            <label key={participant.id} className="inline-flex items-center mr-4">
              <input
                type="checkbox"
                checked={splitAmong.includes(participant.id)}
                onChange={() => handleSplitAmongChange(participant.id)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">{participant.name}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Add Expense
      </button>
    </form>
  );
} 