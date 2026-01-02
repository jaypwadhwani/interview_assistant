import { useState, FormEvent } from 'react';
import { JobDetails } from '../types';
import { storage } from '../utils/storage';
import { ColorScheme, getTheme } from '../utils/theme';

interface JobDetailsFormProps {
  onSubmit: (jobDetails: JobDetails) => void;
  theme: ColorScheme;
}

type Step = 1 | 2 | 3;

export const JobDetailsForm = ({ onSubmit, theme }: JobDetailsFormProps) => {
  const themeColors = getTheme(theme);
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [voice, setVoice] = useState('alloy');

  const handleStep1Submit = (e: FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim()) {
      setError('Job title is required');
      return;
    }
    setError('');
    setCurrentStep(2);
  };

  const handleStep2Submit = (e: FormEvent) => {
    e.preventDefault();
    setCurrentStep(3);
  };

  const handleStep2Skip = () => {
    setCurrentStep(3);
  };

  const handleStep3Submit = (e: FormEvent) => {
    e.preventDefault();
    handleFinalSubmit();
  };

  const handleStep3Skip = () => {
    handleFinalSubmit();
  };

  const handleFinalSubmit = () => {
    const jobDetails: JobDetails = {
      jobTitle: jobTitle.trim(),
      jobDescription: jobDescription.trim(),
      notes: notes.trim(),
      voice,
    };

    storage.saveJobDetails(jobDetails);
    onSubmit(jobDetails);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
      setError('');
    }
  };

  return (
    <div className={`min-h-screen ${themeColors.bg} flex items-center justify-center p-4`}>
      <div className={`${themeColors.glass} rounded-3xl shadow-xl p-10 w-full max-w-2xl border ${themeColors.glassBorder}`}>
        {/* Progress Indicator */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${step === currentStep
                      ? `${themeColors.primary} text-white shadow-md`
                      : step < currentStep
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                      }`}
                  >
                    {step < currentStep ? '✓' : step}
                  </div>
                  <span className={`mt-2 text-xs font-medium ${themeColors.textSecondary}`}>
                    Step {step}
                  </span>
                </div>
                {step < 3 && (
                  <div
                    className={`h-0.5 flex-1 mx-3 rounded transition-all ${step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {currentStep === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-6">
              <div className="text-center mb-10">
                <div className={`inline-flex items-center justify-center w-14 h-14 ${themeColors.primary} rounded-2xl mb-5 shadow-sm`}>
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-semibold text-gray-900 mb-3 tracking-tight">
                  What's the title of the job you're preparing for?
                </h1>
                <p className={`${themeColors.textSecondary} text-base`}>Let's start with the basics</p>
              </div>

              <div>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => {
                    setJobTitle(e.target.value);
                    setError('');
                  }}
                  className={`w-full px-5 py-4 bg-white border rounded-2xl ${themeColors.text} text-base placeholder-gray-400 focus:ring-2 focus:ring-${themeColors.accent}/20 focus:border-${themeColors.accent} transition-all ${error ? 'border-red-300 ring-2 ring-red-100' : themeColors.border
                    }`}
                  placeholder="e.g., Senior Software Engineer"
                  autoFocus
                />
                {error && (
                  <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className={`w-full ${themeColors.primary} ${themeColors.primaryHover} text-white py-4 px-6 rounded-2xl font-semibold text-base hover:shadow-md focus:outline-none focus:ring-2 focus:ring-${themeColors.accent}/20 transition-all`}
              >
                Continue
                <svg className="inline-block w-5 h-5 ml-2 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </form>
          )}

          {currentStep === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-6">
              <div className="text-center mb-10">
                <div className={`inline-flex items-center justify-center w-14 h-14 ${themeColors.primary} rounded-2xl mb-5 shadow-sm`}>
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-semibold text-gray-900 mb-3 tracking-tight">
                  Do you have the job description?
                </h1>
                <p className={`${themeColors.textSecondary} text-base`}>This helps me ask better questions (optional)</p>
              </div>

              <div>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={6}
                  className={`w-full px-5 py-4 bg-white border ${themeColors.border} rounded-2xl ${themeColors.text} text-base placeholder-gray-400 focus:ring-2 focus:ring-${themeColors.accent}/20 focus:border-${themeColors.accent} resize-none transition-all`}
                  placeholder="Paste the job description here..."
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 border border-gray-200 rounded-2xl font-semibold text-base hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
                >
                  <svg className="inline-block w-5 h-5 mr-2 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleStep2Skip}
                  className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 border border-gray-200 rounded-2xl font-semibold text-base hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
                >
                  Skip
                </button>
                <button
                  type="submit"
                  className={`flex-1 ${themeColors.primary} ${themeColors.primaryHover} text-white py-4 px-6 rounded-2xl font-semibold text-base hover:shadow-md focus:outline-none focus:ring-2 focus:ring-${themeColors.accent}/20 transition-all`}
                >
                  Continue
                  <svg className="inline-block w-5 h-5 ml-2 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </form>
          )}

          {currentStep === 3 && (
            <form onSubmit={handleStep3Submit} className="space-y-6">
              <div className="text-center mb-10">
                <div className={`inline-flex items-center justify-center w-14 h-14 ${themeColors.primary} rounded-2xl mb-5 shadow-sm`}>
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-semibold text-gray-900 mb-3 tracking-tight">
                  Any other notes you want me to know before starting?
                </h1>
                <p className={`${themeColors.textSecondary} text-base`}>Share any context that might help (optional)</p>
              </div>

              <div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={5}
                  className={`w-full px-5 py-4 bg-white border ${themeColors.border} rounded-2xl ${themeColors.text} text-base placeholder-gray-400 focus:ring-2 focus:ring-${themeColors.accent}/20 focus:border-${themeColors.accent} resize-none transition-all`}
                  placeholder="Any additional information that might help with interview preparation..."
                  autoFocus
                />
              </div>

              <div className="space-y-3">
                <label className={`block text-sm font-medium ${themeColors.textSecondary} ml-1`}>
                  Choose your interviewer's voice
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVoice(v)}
                      className={`px-4 py-3 rounded-xl text-sm font-medium capitalize transition-all ${voice === v
                          ? `${themeColors.primary} text-white shadow-md`
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent'
                        }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 border border-gray-200 rounded-2xl font-semibold text-base hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
                >
                  <svg className="inline-block w-5 h-5 mr-2 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleStep3Skip}
                  className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 border border-gray-200 rounded-2xl font-semibold text-base hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
                >
                  Skip
                </button>
                <button
                  type="submit"
                  className={`flex-1 ${themeColors.primary} ${themeColors.primaryHover} text-white py-4 px-6 rounded-2xl font-semibold text-base hover:shadow-md focus:outline-none focus:ring-2 focus:ring-${themeColors.accent}/20 transition-all`}
                >
                  Start Interview
                  <svg className="inline-block w-5 h-5 ml-2 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
