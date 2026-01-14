import { useEffect, useCallback } from 'react';

/**
 * Custom hook for keyboard navigation in chat interface
 * 
 * @param {Object} config Configuration options
 * @param {Function} config.onSend Function to send a message
 * @param {Function} config.onClear Function to clear conversation
 * @param {React.RefObject} config.inputRef Reference to the input element
 * @param {boolean} config.isDisabled Whether keyboard shortcuts are disabled
 */
const useKeyboardNavigation = ({ 
  onSend, 
  onClear, 
  inputRef, 
  isDisabled = false 
}) => {
  const handleKeyboardShortcuts = useCallback((e) => {
    // Don't process shortcuts if disabled
    if (isDisabled) return;

    // Alt+N to clear conversation
    if (e.altKey && e.key === 'n') {
      e.preventDefault();
      onClear && onClear(e);
    }
    
    // Escape to clear input
    if (e.key === 'Escape' && document.activeElement === inputRef.current) {
      e.preventDefault();
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
    
    // Slash to focus input
    if (e.key === '/' && document.activeElement !== inputRef.current) {
      e.preventDefault();
      inputRef.current?.focus();
    }
  }, [onClear, inputRef, isDisabled]);
  
  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcuts);
    return () => {
      document.removeEventListener('keydown', handleKeyboardShortcuts);
    };
  }, [handleKeyboardShortcuts]);
  
  return {
    // Additional methods could be added here if needed
  };
};

export default useKeyboardNavigation;