import React, { useState, useEffect } from 'react';

const SettingsPanel = ({ isOpen, onClose, settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState({
    animationSpeed: 15,
    typingAnimations: true,
    emojiReplacements: true,
    keyboardShortcuts: true,
    messageSounds: false,
    ...settings
  });

  useEffect(() => {
    setLocalSettings({
      animationSpeed: 15,
      typingAnimations: true,
      emojiReplacements: true,
      keyboardShortcuts: true,
      messageSounds: false,
      ...settings
    });
  }, [settings, isOpen]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLocalSettings({
      ...localSettings,
      [name]: type === 'checkbox' ? checked : type === 'range' ? parseInt(value) : value
    });
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const handleCancel = () => {
    setLocalSettings(settings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-md p-6 shadow-2xl glossy-card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-blue-300">Pengaturan Chat</h2>
          <button 
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Animasi Mengetik</label>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="typingAnimations"
                name="typingAnimations"
                checked={localSettings.typingAnimations}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="typingAnimations" className="ml-2 text-sm text-gray-300">
                Tampilkan animasi mengetik
              </label>
            </div>
            
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Kecepatan Animasi: {localSettings.animationSpeed}ms
              </label>
              <input
                type="range"
                name="animationSpeed"
                min="5"
                max="50"
                value={localSettings.animationSpeed}
                onChange={handleInputChange}
                disabled={!localSettings.typingAnimations}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Cepat</span>
                <span>Lambat</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-700">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="emojiReplacements"
                name="emojiReplacements"
                checked={localSettings.emojiReplacements}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="emojiReplacements" className="ml-2 text-sm text-gray-300">
                Ganti *emotion* dengan emoji
              </label>
            </div>
            
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="keyboardShortcuts"
                name="keyboardShortcuts"
                checked={localSettings.keyboardShortcuts}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="keyboardShortcuts" className="ml-2 text-sm text-gray-300">
                Aktifkan pintasan keyboard
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="messageSounds"
                name="messageSounds"
                checked={localSettings.messageSounds}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="messageSounds" className="ml-2 text-sm text-gray-300">
                Suara notifikasi pesan
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-8">
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;