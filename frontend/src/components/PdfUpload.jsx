import React, { useState, useEffect } from 'react';
import api from '../services/api';

const PdfUpload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [pdfs, setPdfs] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Ambil daftar PDF saat komponen dimuat
    fetchPdfList();
  }, []);

  const fetchPdfList = async () => {
    setIsLoading(true);
    try {
      const response = await api.listPdfs();
      if (response.data && response.data.files) {
        setPdfs(response.data.files);
      } else {
        setPdfs([]);
      }
    } catch (error) {
      console.error('Error fetching PDF list:', error);
      showMessage('Gagal mengambil daftar PDF', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    } else {
      setFile(null);
      showMessage('Hanya file PDF yang diizinkan', 'error');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!file) {
      showMessage('Pilih file PDF terlebih dahulu', 'error');
      return;
    }
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.uploadPdf(formData);
      
      if (response.data.success || response.data.message) {
        setFile(null);
        showMessage('PDF berhasil diunggah dan diintegrasikan', 'success');
        // Reset input file
        document.getElementById('pdf-upload').value = '';
        
        // Refresh daftar PDF
        fetchPdfList();
      }
    } catch (error) {
      console.error('Error uploading PDF:', error);
      showMessage('Gagal mengunggah PDF: ' + (error.response?.data?.detail || error.message), 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename) => {
    try {
      await api.deletePdf(filename);
      showMessage(`PDF ${filename} berhasil dihapus`, 'success');
      
      // Refresh daftar PDF
      fetchPdfList();
    } catch (error) {
      console.error('Error deleting PDF:', error);
      showMessage('Gagal menghapus PDF', 'error');
    }
  };

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
    
    // Hapus pesan setelah 5 detik
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-700 glow-effect">
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white px-6 py-4 border-b border-gray-700">
        <h2 className="font-semibold text-lg text-blue-200">Manajemen Dokumen PDF</h2>
      </div>

      <div className="p-6">
        {message && (
          <div 
            className={`p-4 mb-6 rounded-lg border-l-4 ${
              messageType === 'success' 
                ? 'bg-green-900/40 text-green-300 border-green-500' 
                : 'bg-red-900/40 text-red-300 border-red-500'
            } backdrop-blur-sm`}
          >
            {message}
          </div>
        )}
        
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 mb-8 glossy-card">
          <h3 className="text-lg font-semibold mb-4 text-blue-300">Unggah PDF Baru</h3>
          
          <form onSubmit={handleUpload}>
            <div className="mb-4">
              <label className="block text-gray-300 mb-2 font-medium">Pilih PDF untuk basis pengetahuan chatbot:</label>
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors bg-gray-800/50">
                <input
                  type="file"
                  id="pdf-upload"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={uploading}
                />
                <label 
                  htmlFor="pdf-upload" 
                  className="cursor-pointer flex flex-col items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-blue-400 font-medium">Klik untuk memilih PDF</span>
                  {file ? (
                    <span className="text-sm text-gray-400 mt-2">{file.name} ({formatFileSize(file.size)})</span>
                  ) : (
                    <span className="text-sm text-gray-500 mt-2">atau seret file ke sini</span>
                  )}
                </label>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  !file || uploading 
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                    : 'bg-blue-700 text-white hover:bg-blue-600 shadow-lg shadow-blue-700/20'
                } transform hover:-translate-y-1 active:translate-y-0`}
                disabled={!file || uploading}
              >
                {uploading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Mengunggah...
                  </span>
                ) : 'Unggah PDF'}
              </button>
            </div>
          </form>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-4 text-blue-300 flex items-center">
            <span>PDF yang Tersedia</span>
            <span className="ml-2 text-sm bg-blue-900/50 text-blue-300 py-1 px-2 rounded-full border border-blue-700">{pdfs.length}</span>
          </h3>
          
          {isLoading ? (
            <div className="flex justify-center items-center p-12">
              <div className="loader rounded-full border-4 border-t-4 border-gray-700 border-t-blue-600 w-12 h-12 animate-spin"></div>
            </div>
          ) : pdfs.length === 0 ? (
            <div className="p-12 text-center bg-gray-900 rounded-lg border border-dashed border-gray-700 glossy-card">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-300 font-medium">Belum ada PDF yang diunggah</p>
              <p className="text-gray-500 text-sm mt-1">Unggah PDF untuk mulai menggunakan chatbot dengan pengetahuan kustom</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-xl">
              <table className="min-w-full divide-y divide-gray-800">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nama File</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Ukuran</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Diunggah</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-gray-800">
                  {pdfs.map((pdf) => (
                    <tr key={pdf.filename} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium text-gray-300 truncate max-w-xs">{pdf.filename}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{formatFileSize(pdf.size)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{formatDate(pdf.uploaded_at)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleDelete(pdf.filename)}
                          className="text-red-400 hover:text-red-300 font-medium transition-colors focus:outline-none"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfUpload;