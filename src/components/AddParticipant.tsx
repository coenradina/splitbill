'use client';

import { useState } from 'react';
import { Participant } from '@/types';

interface AddParticipantProps {
  onAdd: (participant: Participant) => void;
}

export default function AddParticipant({ onAdd }: AddParticipantProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newParticipant: Participant = {
      id: crypto.randomUUID(),
      name: name.trim(),
    };

    onAdd(newParticipant);
    setName('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Participant Name
        </label>
        <div className="mt-1 flex rounded-md shadow-sm">
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Enter name"
          />
        </div>
      </div>
      <button
        type="submit"
        className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Add Participant
      </button>
    </form>
  );
} 