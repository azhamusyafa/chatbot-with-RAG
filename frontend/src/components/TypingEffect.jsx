import React, { useState, useEffect } from 'react';

// Gunakan daftar emoji yang sama dengan Message.jsx
const emojiMap = {
  "smile": "😊", "smiling": "😊", "grin": "😁", "laugh": "😄", "laughing": "😄",
  "happy": "😊", "excited": "😃", "excitedly": "😃", "joy": "😂",
  "sad": "😢", "crying": "😭", "angry": "😠", "mad": "😡",
  "shocked": "😱", "surprised": "😮", "thinking": "🤔", "confused": "😕",
  "love": "❤️", "heart": "❤️", "thumbsup": "👍", "thumbsdown": "👎",
  "clap": "👏", "clapping": "👏", "wave": "👋", "waving": "👋",
  "shrug": "🤷", "hug": "🤗", "cool": "😎", "wink": "😉", 
  "frown": "☹️", "worried": "😟", "nervous": "😬", "eyeroll": "🙄"
};

// Fungsi untuk memproses emoji di akhir efek mengetik
const processCompletedText = (text) => {
  if (!text) return text;
  
  // Regex untuk mencocokkan teks dalam asterisks
  const regex = /\*([^*]+)\*/g;
  
  let lastIndex = 0;
  let parts = [];
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    // Tambahkan teks sebelum match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    const emotion = match[1].toLowerCase();
    if (emojiMap[emotion]) {
      // Jika ada di dalam map, ganti dengan emoji
      parts.push(<span key={match.index} className="emoji">{emojiMap[emotion]}</span>);
    } else {
      // Jika tidak ada di map, pertahankan teks asli dengan asterisks
      parts.push(match[0]);
    }
    
    lastIndex = regex.lastIndex;
  }
  
  // Tambahkan teks setelah match terakhir
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return parts.length > 0 ? parts : text;
};

const TypingEffect = ({ text }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Reset state ketika teks baru diterima
    setDisplayedText('');
    setCurrentIndex(0);
    setIsComplete(false);
  }, [text]);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prevIndex => prevIndex + 1);
      }, 12); // Kecepatan mengetik - angka lebih kecil = lebih cepat

      return () => clearTimeout(timeout);
    } else {
      setIsComplete(true);
    }
  }, [currentIndex, text]);

  return (
    <div>
      {isComplete ? (
        processCompletedText(displayedText)
      ) : (
        <>
          {displayedText}
          <span className="typing-cursor">|</span>
        </>
      )}
    </div>
  );
};

export default TypingEffect;