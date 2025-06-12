import React, { useState } from 'react';
import Button from './Button';

interface PrintExportButtonProps {
  pageTitle?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
}

const PrintExportButton: React.FC<PrintExportButtonProps> = ({
  pageTitle = 'MedRemind Hub Document',
  className = '',
  variant = 'secondary',
  size = 'sm'
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  const handlePrint = () => {
    // Add print metadata
    const originalTitle = document.title;
    document.title = `${pageTitle} - ${new Date().toLocaleDateString()}`;
    
    // Trigger browser print dialog
    window.print();
    
    // Restore original title
    document.title = originalTitle;
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    
    try {
      // For PDF export, we'll use the browser's print to PDF functionality
      // This is the most reliable cross-browser solution
      const originalTitle = document.title;
      document.title = `${pageTitle} - ${new Date().toLocaleDateString()}`;
      
      // Add a small delay to ensure the title is updated
      setTimeout(() => {
        window.print();
        document.title = originalTitle;
        setIsExporting(false);
      }, 100);
      
    } catch (error) {
      console.error('Export error:', error);
      setIsExporting(false);
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Button
        onClick={handlePrint}
        variant={variant}
        size={size}
        title={getBilingualLabel("Print Document", "ஆவணத்தை அச்சிடு")}
        className="print:hidden"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        {getBilingualLabel("Print", "அச்சிடு")}
      </Button>
      
      <Button
        onClick={handleExportPDF}
        variant={variant}
        size={size}
        isLoading={isExporting}
        title={getBilingualLabel("Export to PDF", "PDF ஆக ஏற்றுமதி செய்")}
        className="print:hidden"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {getBilingualLabel("PDF", "PDF")}
      </Button>
    </div>
  );
};

export default PrintExportButton;