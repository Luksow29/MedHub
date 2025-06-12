import React from 'react';
import Button from './Button';

interface PrintExportButtonProps {
  targetId: string;
  filename: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const PrintExportButton: React.FC<PrintExportButtonProps> = ({ 
  targetId, 
  filename, 
  variant = 'primary', 
  size = 'md',
  className = ''
}) => {
  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  const handlePrint = () => {
    const content = document.getElementById(targetId);
    if (!content) {
      console.error(`Content with ID "${targetId}" not found for printing.`);
      alert(getBilingualLabel(
        `Error: Content with ID "${targetId}" not found for printing.`,
        `பிழை: அச்சிடுவதற்கான ID "${targetId}" கொண்ட உள்ளடக்கம் கிடைக்கவில்லை.`
      ));
      return;
    }

    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) {
      alert(getBilingualLabel(
        'Pop-up blocked. Please allow pop-ups for this site to print.',
        'பாப்-அப் தடுக்கப்பட்டது. அச்சிட இந்த தளத்திற்கு பாப்-அப்களை அனுமதிக்கவும்.'
      ));
      return;
    }

    // Start with basic HTML structure
    printWindow.document.write('<!DOCTYPE html><html><head>');
    printWindow.document.write(`<title>${filename}</title>`);
    
    // Copy all stylesheets from the current document
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    stylesheets.forEach(stylesheet => {
      printWindow.document.write(stylesheet.outerHTML);
    });
    
    // Copy all style elements
    const styles = document.querySelectorAll('style');
    styles.forEach(style => {
      printWindow.document.write(style.outerHTML);
    });
    
    // Include Tailwind CSS for print
    printWindow.document.write('<script src="https://cdn.tailwindcss.com"></script>');
    
    // Close head and open body
    printWindow.document.write('</head><body class="bg-white">');
    
    // Add content
    printWindow.document.write(content.innerHTML);
    
    // Close body and html
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    
    // Wait for resources to load before printing
    printWindow.onload = function() {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }, 1000);
    };
  };

  return (
    <Button 
      onClick={handlePrint} 
      variant={variant} 
      size={size}
      className={className}
    >
      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17H7a2 2 0 01-2-2V7a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2z"></path>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9H7a2 2 0 00-2 2v4a2 2 0 002 2h10a2 2 0 002-2v-4a2 2 0 00-2-2zM12 18V21M9 3h6"></path>
      </svg>
      {getBilingualLabel("Print / Export PDF", "அச்சிடு / PDF ஆக ஏற்றுமதி செய்")}
    </Button>
  );
};

export default PrintExportButton;