// components/PatientSearchComponent.tsx - Advanced patient search interface

import React, { useState, useEffect, useCallback } from 'react';
import { Patient, ReminderMethod } from '../types';
import { searchPatients, SearchFilters, SearchResult } from '../api/patientSearch';
import { supabase } from '../lib/supabase';
import Button from './shared/Button';
import { Link } from 'react-router-dom';

interface PatientSearchComponentProps {
  onPatientSelect?: (patient: Patient) => void;
  showSelectButton?: boolean;
}

const PatientSearchComponent: React.FC<PatientSearchComponentProps> = ({
  onPatientSelect,
  showSelectButton = false
}) => {
  const [searchResult, setSearchResult] = useState<SearchResult>({
    patients: [],
    totalCount: 0,
    hasMore: false
  });
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
    limit: 20,
    offset: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  const performSearch = useCallback(async (newFilters: SearchFilters = filters) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error("பயனர் அங்கீகரிக்கப்படவில்லை.");

      const result = await searchPatients(currentUser.data.user.id, newFilters);
      
      if (newFilters.offset === 0) {
        setSearchResult(result);
      } else {
        // Append to existing results for pagination
        setSearchResult(prev => ({
          ...result,
          patients: [...prev.patients, ...result.patients]
        }));
      }
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (filters.searchTerm !== undefined) {
        performSearch({ ...filters, offset: 0 });
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters.searchTerm]);

  // Search when other filters change
  useEffect(() => {
    performSearch({ ...filters, offset: 0 });
  }, [filters.gender, filters.preferredContactMethod, filters.sortBy, filters.sortOrder]);

  const handleSearchTermChange = (value: string) => {
    setFilters(prev => ({ ...prev, searchTerm: value, offset: 0 }));
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, offset: 0 }));
  };

  const handleLoadMore = () => {
    const newOffset = filters.offset! + filters.limit!;
    const newFilters = { ...filters, offset: newOffset };
    setFilters(newFilters);
    performSearch(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      searchTerm: '',
      sortBy: 'created_at',
      sortOrder: 'desc',
      limit: 20,
      offset: 0
    });
  };

  const getReminderMethodLabel = (method: ReminderMethod) => {
    switch (method) {
      case ReminderMethod.EMAIL:
        return getBilingualLabel('Email', 'மின்னஞ்சல்');
      case ReminderMethod.SMS:
        return getBilingualLabel('SMS', 'எஸ்எம்எஸ்');
      case ReminderMethod.NONE:
        return getBilingualLabel('None', 'ஏதுமில்லை');
      default:
        return method;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Main Search Input */}
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-slate-700 mb-2">
              {getBilingualLabel("Search Patients", "நோயாளிகளைத் தேடு")}
            </label>
            <div className="relative">
              <input
                type="text"
                id="search"
                value={filters.searchTerm || ''}
                onChange={(e) => handleSearchTermChange(e.target.value)}
                placeholder={getBilingualLabel("Search by name, phone, email, or ID...", "பெயர், தொலைபேசி, மின்னஞ்சல் அல்லது ID மூலம் தேடவும்...")}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-slate-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Quick Sort */}
          <div className="lg:w-48">
            <label htmlFor="sort" className="block text-sm font-medium text-slate-700 mb-2">
              {getBilingualLabel("Sort By", "வரிசைப்படுத்து")}
            </label>
            <select
              id="sort"
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                handleFilterChange('sortBy', sortBy);
                handleFilterChange('sortOrder', sortOrder);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
            >
              <option value="created_at-desc">{getBilingualLabel("Newest First", "புதியது முதலில்")}</option>
              <option value="created_at-asc">{getBilingualLabel("Oldest First", "பழையது முதலில்")}</option>
              <option value="name-asc">{getBilingualLabel("Name A-Z", "பெயர் A-Z")}</option>
              <option value="name-desc">{getBilingualLabel("Name Z-A", "பெயர் Z-A")}</option>
              <option value="updated_at-desc">{getBilingualLabel("Recently Updated", "சமீபத்தில் புதுப்பிக்கப்பட்டது")}</option>
            </select>
          </div>

          {/* Advanced Filters Toggle */}
          <div className="flex items-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="whitespace-nowrap"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              {getBilingualLabel("Filters", "வடிகட்டிகள்")}
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Gender Filter */}
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-slate-700 mb-2">
                  {getBilingualLabel("Gender", "பால்")}
                </label>
                <select
                  id="gender"
                  value={filters.gender || ''}
                  onChange={(e) => handleFilterChange('gender', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                >
                  <option value="">{getBilingualLabel("All", "அனைத்தும்")}</option>
                  <option value="ஆண்">{getBilingualLabel("Male", "ஆண்")}</option>
                  <option value="பெண்">{getBilingualLabel("Female", "பெண்")}</option>
                  <option value="மற்றவை">{getBilingualLabel("Other", "மற்றவை")}</option>
                  <option value="குறிப்பிடவில்லை">{getBilingualLabel("Prefer not to say", "குறிப்பிடவில்லை")}</option>
                </select>
              </div>

              {/* Contact Method Filter */}
              <div>
                <label htmlFor="contactMethod" className="block text-sm font-medium text-slate-700 mb-2">
                  {getBilingualLabel("Contact Method", "தொடர்பு முறை")}
                </label>
                <select
                  id="contactMethod"
                  value={filters.preferredContactMethod || ''}
                  onChange={(e) => handleFilterChange('preferredContactMethod', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                >
                  <option value="">{getBilingualLabel("All", "அனைத்தும்")}</option>
                  <option value={ReminderMethod.EMAIL}>{getReminderMethodLabel(ReminderMethod.EMAIL)}</option>
                  <option value={ReminderMethod.SMS}>{getReminderMethodLabel(ReminderMethod.SMS)}</option>
                  <option value={ReminderMethod.NONE}>{getReminderMethodLabel(ReminderMethod.NONE)}</option>
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label htmlFor="dateStart" className="block text-sm font-medium text-slate-700 mb-2">
                  {getBilingualLabel("Created From", "உருவாக்கப்பட்ட தேதி")}
                </label>
                <input
                  type="date"
                  id="dateStart"
                  value={filters.dateRange?.start || ''}
                  onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, start: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                />
              </div>

              <div className="flex items-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleClearFilters}
                  className="w-full"
                >
                  {getBilingualLabel("Clear Filters", "வடிகட்டிகளை அழிக்கவும்")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Search Results */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Results Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-slate-900">
              {getBilingualLabel("Search Results", "தேடல் முடிவுகள்")}
            </h3>
            <span className="text-sm text-slate-600">
              {searchResult.totalCount} {getBilingualLabel("patients found", "நோயாளிகள் கண்டுபிடிக்கப்பட்டனர்")}
            </span>
          </div>
        </div>

        {/* Results List */}
        {isLoading && searchResult.patients.length === 0 ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto mb-4"></div>
            <p className="text-slate-600">{getBilingualLabel("Searching...", "தேடப்படுகிறது...")}</p>
          </div>
        ) : searchResult.patients.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-slate-900">{getBilingualLabel("No patients found", "நோயாளிகள் யாரும் கண்டுபிடிக்கப்படவில்லை")}</h3>
            <p className="mt-1 text-sm text-slate-500">{getBilingualLabel("Try adjusting your search criteria", "உங்கள் தேடல் அளவுகோல்களை சரிசெய்ய முயற்சிக்கவும்")}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {searchResult.patients.map((patient) => (
              <div key={patient.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-sky-700">
                            {patient.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-medium text-slate-900 truncate">
                          {patient.name}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-slate-500">
                          <span>{patient.phone}</span>
                          {patient.email && <span>{patient.email}</span>}
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {getReminderMethodLabel(patient.preferredContactMethod)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {getBilingualLabel("Created", "உருவாக்கப்பட்டது")}: {formatDate(patient.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {showSelectButton && onPatientSelect && (
                      <Button
                        onClick={() => onPatientSelect(patient)}
                        variant="primary"
                        size="sm"
                      >
                        {getBilingualLabel("Select", "தேர்வுசெய்")}
                      </Button>
                    )}
                    <Link
                      to={`/patient/${patient.id}`}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-sky-700 bg-sky-100 hover:bg-sky-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {getBilingualLabel("View", "பார்க்கவும்")}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {searchResult.hasMore && (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
            <Button
              onClick={handleLoadMore}
              variant="secondary"
              className="w-full"
              isLoading={isLoading}
            >
              {getBilingualLabel("Load More", "மேலும் ஏற்றவும்")} ({searchResult.patients.length} / {searchResult.totalCount})
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientSearchComponent;