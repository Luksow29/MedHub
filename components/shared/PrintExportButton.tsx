import React from 'react';
import Button from './Button'; // Assuming Button component path

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
          @page {
            size: A4;
            margin: 1cm;
          }
          body { 
            font-family: 'Arial', sans-serif; 
            margin: 0; 
            padding: 20px; 
            line-height: 1.5;
          }
          .letterhead {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid #000;
          }
          .letterhead h1 {
            font-size: 24px;
            margin: 0;
          }
          .letterhead h2 {
            font-size: 18px;
            margin: 5px 0;
          }
          .letterhead p {
            font-size: 12px;
            margin: 5px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
          }
          .medical-section {
            margin: 20px 0;
            page-break-inside: avoid;
          }
          .medical-section h3 {
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
            margin-bottom: 10px;
          }
          .footer {
            position: fixed;
            bottom: 0;
            width: 100%;
            text-align: center;
            font-size: 10px;
            border-top: 1px solid #ddd;
            padding-top: 5px;
          }
          .confidentiality-notice {
            font-size: 10px;
            border: 1px solid #000;
            padding: 5px;
            margin-top: 20px;
          }
          @media print {
            .print\\:hidden { display: none !important; }
            .print\\:block { display: block !important; }
          }
        `);
        printWindow.document.write('</style></head><body>');
        
        // Add letterhead
        printWindow.document.write('<div class="letterhead">');
        printWindow.document.write('<h1>MedRemind Hub</h1>');
        printWindow.document.write(`<h2>${filename}</h2>`);
        printWindow.document.write(`<p>${getBilingualLabel("Generated on", "உருவாக்கப்பட்ட தேதி")}: ${new Date().toLocaleString()}</p>`);
        printWindow.document.write('</div>');
        
        // Add content
        printWindow.document.write(content.innerHTML);
        
        // Add confidentiality notice
        printWindow.document.write('<div class="confidentiality-notice">');
        printWindow.document.write(`<p><strong>${getBilingualLabel("CONFIDENTIAL MEDICAL RECORD", "ரகசிய மருத்துவ பதிவு")}</strong></p>`);
        printWindow.document.write(`<p>${getBilingualLabel("This document contains confidential patient information protected by privacy laws.", "இந்த ஆவணம் தனியுரிமை சட்டங்களால் பாதுகாக்கப்பட்ட ரகசிய நோயாளி தகவல்களைக் கொண்டுள்ளது.")}</p>`);
        printWindow.document.write('</div>');
        
        // Add footer
        printWindow.document.write('<div class="footer">');
        printWindow.document.write(`<p>MedRemind Hub - ${getBilingualLabel("Page", "பக்கம்")}: <span class="page-number"></span></p>`);
        printWindow.document.write('</div>');
        
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        
        // Add page numbers
        printWindow.onload = function() {
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
          }, 500);
        };
      } else {
        // Show alert to inform user about pop-up blocking
        alert(getBilingualLabel(
          'Pop-up blocked. Please allow pop-ups for this site to print.',
          'பாப்-அப் தடுக்கப்பட்டது. அச்சிட இந்த தளத்திற்கு பாப்-அப்களை அனுமதிக்கவும்.'
        ));
      }
    } else {
      console.error(`Content with ID "${targetId}" not found for printing.`);
      alert(getBilingualLabel(
        `Error: Content with ID "${targetId}" not found for printing.`,
        `பிழை: அச்சிடுவதற்கான ID "${targetId}" கொண்ட உள்ளடக்கம் கிடைக்கவில்லை.`
      ));
    }
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