// File: features/whatsapp/components/TemplateManager.tsx

import React, { useState, useEffect } from 'react';
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from '../../../api/whatsapp';

// Define the type for a template
interface Template {
  id: string;
  name: string;
  template_text: string;
  variables: string[];
}

export const TemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [name, setName] = useState('');
  const [templateText, setTemplateText] = useState('');
  const [variables, setVariables] = useState('');

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const data = await getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error("Failed to fetch templates", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const resetForm = () => {
    setEditingTemplate(null);
    setName('');
    setTemplateText('');
    setVariables('');
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setName(template.name);
    setTemplateText(template.template_text);
    setVariables(template.variables.join(', '));
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await deleteTemplate(id);
        fetchTemplates();
        alert('Template deleted successfully!');
      } catch (error) {
        alert('Failed to delete template.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const varsArray = variables.split(',').map(v => v.trim()).filter(Boolean);
    const templateData = { name, template_text: templateText, variables: varsArray };
    
    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, templateData);
        alert('Template updated successfully!');
      } else {
        await createTemplate(templateData);
        alert('Template created successfully!');
      }
      resetForm();
      fetchTemplates();
    } catch (error) {
      alert('Failed to save template.');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Form Section */}
      <div className="md:col-span-1">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">{editingTemplate ? 'Edit Template' : 'Create New Template'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Template Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 p-2 w-full border rounded-md" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Template Text</label>
              <textarea value={templateText} onChange={e => setTemplateText(e.target.value)} rows={6} required className="mt-1 p-2 w-full border rounded-md" placeholder="e.g., Dear {{patient_name}}, your appointment is on {{appointment_date}}." />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Variables (comma-separated)</label>
              <input type="text" value={variables} onChange={e => setVariables(e.target.value)} className="mt-1 p-2 w-full border rounded-md" placeholder="e.g., patient_name, appointment_date" />
            </div>
            <div className="flex gap-4">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">{editingTemplate ? 'Update' : 'Create'}</button>
              {editingTemplate && <button type="button" onClick={resetForm} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>}
            </div>
          </form>
        </div>
      </div>

      {/* List Section */}
      <div className="md:col-span-2">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Existing Templates</h3>
          {isLoading ? <p>Loading...</p> : (
            <div className="space-y-4">
              {templates.map(template => (
                <div key={template.id} className="border p-4 rounded-md">
                  <div className="flex justify-between items-center">
                    <p className="font-bold">{template.name}</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(template)} className="text-sm text-blue-600">Edit</button>
                      <button onClick={() => handleDelete(template.id)} className="text-sm text-red-600">Delete</button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">{template.template_text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
