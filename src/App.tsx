import { useState, useEffect } from 'react';
import { JobDetails } from './types';
import { defaultTheme } from './utils/theme';
import { storage } from './utils/storage';
import { JobDetailsForm } from './components/JobDetailsForm';
import { InterviewSession } from './components/InterviewSession';

function App() {
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if there's existing job details or a session
    const savedJobDetails = storage.loadJobDetails();
    const currentSession = storage.loadCurrentSession();

    if (savedJobDetails && currentSession) {
      // Resume existing session
      setJobDetails(savedJobDetails);
    }

    setIsLoading(false);
  }, []);

  const handleJobDetailsSubmit = (details: JobDetails) => {
    setJobDetails(details);
  };

  const handleSessionComplete = () => {
    setJobDetails(null);
    storage.clearJobDetails();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-14 h-14 bg-teal-600 rounded-2xl mb-6`}>
            <div className="w-7 h-7 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-900 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {jobDetails ? (
        <InterviewSession jobDetails={jobDetails} onComplete={handleSessionComplete} theme={defaultTheme} />
      ) : (
        <JobDetailsForm onSubmit={handleJobDetailsSubmit} theme={defaultTheme} />
      )}
    </div>
  );
}

export default App;

