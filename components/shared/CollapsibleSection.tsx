import React from 'react';

interface CollapsibleSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, isExpanded, onToggle, children }) => {
  return (
    <div className="bg-white rounded-lg shadow-md mb-6">
      <div
        className="flex justify-between items-center p-6 cursor-pointer"
        onClick={onToggle}
      >
        <h3 className="text-xl font-semibold text-slate-800">
          {title}
        </h3>
        <svg
          className={`w-6 h-6 text-slate-500 transform transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {isExpanded && (
        <div className="p-6 border-t border-slate-200">
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection;