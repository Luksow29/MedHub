import React from 'react';
import Button from './Button'; // Assuming Button component path

interface PrintExportButtonProps {
  targetId: string;
  filename: string;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const PrintExportButton: React.FC<PrintExportButtonProps> = ({ targetId, filename, variant = 'primary', size = 'md' }) => {
  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  const handlePrint = () => {
    const content = document.getElementById(targetId);
    if (content) {
      const printWindow = window.open('', '', 'height=600,width=800');
      if (printWindow) {
        printWindow.document.write('<html><head><title>');
        printWindow.document.write(filename);
        printWindow.document.write('</title>');
        // Include Tailwind CSS for print
        printWindow.document.write('<script src="https://cdn.tailwindcss.com"></script>');
        printWindow.document.write('<style>');
        printWindow.document.write(`
          body { font-family: 'Inter', sans-serif; margin: 0; padding: 20px; }
          /* Hide elements with print:hidden class when printing */
          .print\\:hidden { display: none !important; }
          /* Show elements with hidden print:block class when printing */
          .hidden.print\\:block { display: block !important; }
        `);
        printWindow.document.write('</style></head><body>');
        printWindow.document.write(content.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      } else {
        // Fallback for pop-up blockers
        console.error('Pop-up blocked. Please allow pop-ups for this site to print.');
        // You might want to show a custom message box here instead of alert
      }
    } else {
      console.error(`Content with ID "${targetId}" not found for printing.`);
    }
  };

  return (
    <Button onClick={handlePrint} variant={variant} size={size}>
      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17H7a2 2 0 01-2-2V7a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2z"></path>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9H7a2 2 0 00-2 2v4a2 2 0 002 2h10a2 2 0 002-2v-4a2 2 0 00-2-2zM12 18V21M9 3h6"></path>
      </svg>
      {getBilingualLabel("Print / Export PDF", "அச்சிடு / PDF ஆக ஏற்றுமதி செய்")}
    </Button>
  );
};

export default PrintExportButton;