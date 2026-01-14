import React, { useState, useEffect } from 'react';
import Chat from './components/Chat';
import PdfUpload from './components/PdfUpload';
import Loading from './components/Loading';

const App = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Check if device is mobile for responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  // Animated transitions between tabs
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-blue-400 mb-2">RAG Chatbot</h1>
          <p className="text-gray-400">Menghubungkan ke server...</p>
        </div>
        <div className="w-24 h-24 relative">
          <div className="absolute inset-0 rounded-full border-t-4 border-blue-500 animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-t-4 border-indigo-500 animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <header className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 shadow-xl border-b border-blue-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <h1 className="text-2xl font-bold mb-4 md:mb-0 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
              </svg>
              <span className="mr-2">RAG Chatbot</span>
              <span className="text-xs bg-blue-700 px-2 py-1 rounded-full font-normal">Mistral</span>
            </h1>
            
            <nav className="flex space-x-1 bg-gray-800/50 p-1 rounded-xl backdrop-blur-sm border border-gray-700 shadow-inner">
              <button
                onClick={() => setActiveTab('chat')}
                className={`py-2 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === 'chat'
                    ? 'bg-blue-700 text-white shadow-lg shadow-blue-700/30 transform -translate-y-1'
                    : 'bg-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                  Chat
                </div>
              </button>
              <button
                onClick={() => setActiveTab('pdf')}
                className={`py-2 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === 'pdf'
                    ? 'bg-blue-700 text-white shadow-lg shadow-blue-700/30 transform -translate-y-1'
                    : 'bg-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  PDF
                </div>
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 mt-6 mb-12">
        <div className="max-w-5xl mx-auto transition-all duration-300 transform">
          {activeTab === 'chat' ? 
            <div className={`transition-opacity duration-300 ${activeTab === 'chat' ? 'opacity-100' : 'opacity-0'}`}>
              <Chat />
            </div> : 
            <div className={`transition-opacity duration-300 ${activeTab === 'pdf' ? 'opacity-100' : 'opacity-0'}`}>
              <PdfUpload />
            </div>
          }
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-sm border-t border-gray-800 py-2 text-center text-xs text-gray-500">
        <div className="container mx-auto px-4">
          RAG Chatbot with Mistral &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
};

export default App;