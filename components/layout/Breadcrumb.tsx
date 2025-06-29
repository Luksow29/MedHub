import React from 'react';
import { Link } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  if (items.length === 0) return null;

  return (
    <nav className="bg-white border-b border-slate-200 px-4 md:px-6 py-3" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-sm">
        <li>
          <Link
            to="/dashboard"
            className="text-slate-500 hover:text-slate-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V5z" />
            </svg>
          </Link>
        </li>
        
        {items.map((item, index) => (
          <li key={index} className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {item.href && index < items.length - 1 ? (
              <Link
                to={item.href}
                className="text-slate-500 hover:text-slate-700 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className={`${index === items.length - 1 ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;