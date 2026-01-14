import React from 'react';

const Loading = ({ size = 'default' }) => {
  let dimensionClass = 'w-3 h-3';
  
  if (size === 'small') {
    dimensionClass = 'w-2 h-2';
  } else if (size === 'large') {
    dimensionClass = 'w-4 h-4';
  }
  
  return (
    <div className="flex items-center space-x-2 p-2">
      <div className={`${dimensionClass} bg-blue-500 rounded-full animate-bounce shadow-lg shadow-blue-500/50`}></div>
      <div className={`${dimensionClass} bg-blue-500 rounded-full animate-bounce shadow-lg shadow-blue-500/50`} style={{ animationDelay: '0.1s' }}></div>
      <div className={`${dimensionClass} bg-blue-500 rounded-full animate-bounce shadow-lg shadow-blue-500/50`} style={{ animationDelay: '0.2s' }}></div>
    </div>
  );
};

export default Loading;