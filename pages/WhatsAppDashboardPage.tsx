// File: pages/WhatsAppDashboardPage.tsx

import React, { useState } from 'react';

// --- இந்த இறக்குமதிகள் முன்பு சேர்க்கப்படவில்லை ---
import { MessageSender } from '../features/whatsapp/components/MessageSender';
import { TemplateManager } from '../features/whatsapp/components/TemplateManager';

export const WhatsAppDashboardPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'sender' | 'templates'>('sender');

    return (
        <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">WhatsApp Notification Center</h1>
                
                <div className="flex border-b mb-6">
                    <button 
                        onClick={() => setActiveTab('sender')}
                        className={`py-2 px-4 font-medium transition-colors ${activeTab === 'sender' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Message Sender
                    </button>
                    <button 
                        onClick={() => setActiveTab('templates')}
                        className={`py-2 px-4 font-medium transition-colors ${activeTab === 'templates' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Template Manager
                    </button>
                </div>

                <div>
                    {/* இப்போது தற்காலிக Placeholder-க்கு பதிலாக உண்மையான கூறுகள் பயன்படுத்தப்படுகின்றன */}
                    {activeTab === 'sender' && <MessageSender />}
                    {activeTab === 'templates' && <TemplateManager />}
                </div>
            </div>
        </div>
    );
};

export default WhatsAppDashboardPage;