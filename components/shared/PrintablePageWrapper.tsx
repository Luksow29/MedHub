import React from 'react';

interface PrintablePageWrapperProps {
  children: React.ReactNode;
  pageTitle: string;
  showConfidentialNotice?: boolean;
  className?: string;
}

const PrintablePageWrapper: React.FC<PrintablePageWrapperProps> = ({
  children,
  pageTitle,
  showConfidentialNotice = true,
  className = ''
}) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  React.useEffect(() => {
    // Set print metadata
    document.documentElement.setAttribute('data-page-title', pageTitle);
    document.documentElement.setAttribute('data-print-date', currentDate);
  }, [pageTitle, currentDate]);

  return (
    <div className={`printable-page ${className}`}>
      {/* Print-only header */}
      <div className="print-only letterhead">
        <h1 className="letterhead-title">MedRemind Hub</h1>
        <h2 className="letterhead-subtitle">{pageTitle}</h2>
        <p>{getBilingualLabel("Generated on", "உருவாக்கப்பட்ட தேதி")}: {currentDate}</p>
      </div>

      {/* Confidentiality notice for medical records */}
      {showConfidentialNotice && (
        <div className="print-only confidentiality-notice">
          <p>
            <strong>
              {getBilingualLabel(
                "CONFIDENTIAL MEDICAL RECORD - HIPAA PROTECTED",
                "ரகசிய மருத்துவ பதிவு - HIPAA பாதுகாக்கப்பட்டது"
              )}
            </strong>
          </p>
          <p>
            {getBilingualLabel(
              "This document contains confidential patient information protected by federal and state privacy laws.",
              "இந்த ஆவணத்தில் கூட்டாட்சி மற்றும் மாநில தனியுரிமை சட்டங்களால் பாதுகாக்கப்பட்ட ரகசிய நோயாளர் தகவல்கள் உள்ளன."
            )}
          </p>
        </div>
      )}

      {/* Main content */}
      <div className="print-content">
        {children}
      </div>

      {/* Print-only footer */}
      <div className="print-only print-metadata">
        <p>
          {getBilingualLabel("MedRemind Hub - Patient Management System", "MedRemind Hub - நோயாளர் மேலாண்மை அமைப்பு")}
        </p>
        <p>
          {getBilingualLabel("Printed on", "அச்சிடப்பட்ட தேதி")}: {currentDate}
        </p>
        <p className="page-number"></p>
      </div>
    </div>
  );
};

export default PrintablePageWrapper;