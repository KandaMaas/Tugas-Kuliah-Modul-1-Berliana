import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-4 border-t-4 border-indigo-200 border-t-indigo-500"></div>
    </div>
  );
};

export { LoadingSpinner };