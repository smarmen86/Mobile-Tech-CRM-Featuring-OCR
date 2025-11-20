
import React from 'react';
import { ServerIcon } from './icons/ServerIcon';
import { API_BASE_URL } from '../services/db';

export const ServerStatusBanner: React.FC = () => {
  return (
    <div className="bg-red-900/50 border-b border-red-700 text-red-300 p-4 flex items-center gap-4">
      <ServerIcon className="w-8 h-8 flex-shrink-0" />
      <div>
        <h3 className="font-bold">Backend Server Offline</h3>
        <p className="text-sm">
          Could not connect to the server at{' '}
          <code className="bg-red-800/50 p-1 rounded-md text-xs font-mono">{API_BASE_URL.replace('/api', '')}</code>.
          Please start the server by running{' '}
          <code className="bg-red-800/50 p-1 rounded-md text-xs font-mono">npm start</code>{' '}
          in the <code className="bg-red-800/50 p-1 rounded-md text-xs font-mono">backend</code> directory.
        </p>
      </div>
    </div>
  );
};