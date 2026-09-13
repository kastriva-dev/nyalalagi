import React from 'react';

const Button = ({ text, className }) => {
  return (
    <button
      className={`bg-secondary text-white px-6 py-3 rounded-full font-medium transition-all hover:bg-opacity-90 ${className}`}
    >
      {text}
    </button>
  );
};

export default Button;