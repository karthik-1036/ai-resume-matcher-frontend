import React, { useState } from 'react';
import axios from 'axios';

interface RecommendedRole {
  title: string;
  reason: string;
  link: string;
}

interface AnalysisResult {
  skills: string[];
  experience_level: string;
  recommended_roles: RecommendedRole[];
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      if (!selectedFile.name.match(/\.(pdf|docx)$/i)) {
        setError('Please upload a PDF or DOCX file');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (!droppedFile.name.match(/\.(pdf|docx)$/i)) {
        setError('Please upload a PDF or DOCX file');
        return;
      }
      setFile(droppedFile);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a resume file');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysis(null);

    const formData = new FormData();
    formData.append('file', file);
    if (location.trim()) {
      formData.append('location', location.trim());
    }

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || ''}/analyze`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000,
        }
      );

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      const analysisData: AnalysisResult = {
        skills: response.data.skills || [],
        experience_level: response.data.experience_level || '',
        recommended_roles: response.data.recommended_roles || []
      };

      setAnalysis(analysisData);
    } catch (err: any) {
      let errorMessage = 'Error analyzing resume. ';
      if (err.response) {
        errorMessage += err.response.data.error || err.response.statusText;
      } else if (err.request) {
        errorMessage += 'Could not connect to server. Please make sure the backend is running.';
      } else {
        errorMessage += err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
            AI Resume Analyzer
          </h1>
          <p className="text-lg sm:text-xl text-gray-600">
            Upload your resume and let AI find the perfect job matches
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            <div
              className={`relative border-3 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all duration-200 ease-in-out
                ${dragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="resume-file"
                accept=".pdf,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="resume-file" className="cursor-pointer block">
                <svg
                  className="mx-auto h-16 w-16 text-gray-400 mb-4"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M24 8v20m0-20L16 16m8-8l8 8m-20 4H8a4 4 0 00-4 4v12a4 4 0 004 4h32a4 4 0 004-4V24a4 4 0 00-4-4h-4"
                  />
                </svg>
                <p className="text-lg mb-2">
                  {file ? (
                    <span className="text-blue-600 font-medium">{file.name}</span>
                  ) : (
                    <>
                      <span className="text-blue-600 font-medium">Click to upload</span>
                      {' '}or drag and drop
                    </>
                  )}
                </p>
                <p className="text-gray-500">PDF or DOCX up to 10MB</p>
              </label>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Location (Optional)
              </label>
              <input
                type="text"
                id="location"
                className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200"
                placeholder="e.g., New York, Remote, United States"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-4 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200
                ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </div>
              ) : (
                'Analyze Resume'
              )}
            </button>
          </form>
        </div>

        {analysis && (
          <div className="mt-8 sm:mt-12 space-y-6 sm:space-y-8">
            <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">Experience Level</h2>
              <p className="text-base sm:text-lg text-gray-700">{analysis.experience_level}</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">Skills</h2>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {analysis.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-sm sm:text-base font-medium bg-blue-100 text-blue-800"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">Recommended Roles</h2>
              <div className="space-y-6">
                {analysis.recommended_roles.map((role, index) => (
                  <div key={index} className="p-4 sm:p-6 rounded-lg border-2 border-gray-100 hover:border-blue-200 transition-all duration-200 hover:shadow-md">
                    <a
                      href={role.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg sm:text-xl font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200"
                    >
                      {role.title}
                    </a>
                    <p className="mt-2 text-base sm:text-lg text-gray-600">{role.reason}</p>
                    <div className="mt-4">
                      <a
                        href={role.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm sm:text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                      >
                        <svg 
                          className="h-5 w-5 mr-2" 
                          fill="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                        </svg>
                        Apply on LinkedIn
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
