'use client';

import { useState } from 'react';
import AddExpense from '@/components/AddExpense';
import AddParticipant from '@/components/AddParticipant';
import BillSummary from '@/components/BillSummary';
import { Expense, Participant } from '@/types';

function Home() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const addParticipant = (participant: Participant) => {
    setParticipants([...participants, participant]);
  };

  const addExpense = (expense: Expense) => {
    setExpenses([...expenses, expense]);
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-blue-600">Split Bill</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">Add Participants</h2>
              <AddParticipant onAdd={addParticipant} />
              
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Participants List</h3>
                <ul className="space-y-2">
                  {participants.map((participant, index) => (
                    <li key={participant.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span>{participant.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">Add Expenses</h2>
              <AddExpense onAdd={addExpense} participants={participants} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Bill Summary</h2>
            <BillSummary expenses={expenses} participants={participants} />
          </div>
        </div>
      </div>
    </main>
  );
}

export default Home; 