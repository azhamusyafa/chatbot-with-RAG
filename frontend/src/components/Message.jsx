import React from 'react';
import TypingEffect from './TypingEffect';

// Daftar emoji yang akan digunakan
const emojiMap = {
  "smile": "😊", "smiling": "😊", "grin": "😁", "laugh": "😄", "laughing": "😄",
  "happy": "😊", "excited": "😃", "excitedly": "😃", "joy": "😂", "lol": "😂",
  "sad": "😢", "crying": "😭", "tears": "😭", "angry": "😠", "mad": "😡",
  "furious": "🤬", "shocked": "😱", "surprised": "😮", "amazed": "😲",
  "thinking": "🤔", "confused": "😕", "doubt": "🤨", "hmmm": "🤔",
  "sick": "🤢", "nauseous": "🤮", "mask": "😷", "injured": "🤕", "cold": "🥶",
  "hot": "🥵", "relieved": "😌", "sleepy": "😴", "tired": "🥱", "bored": "😒",
  "unamused": "😒", "disappointed": "😞", "worried": "😟", "nervous": "😬",
  "eyeroll": "🙄", "facepalm": "🤦", "mindblown": "🤯", "neutral": "😐",
  "smirk": "😏", "devil": "😈", "angel": "😇", "clown": "🤡",
  "robot": "🤖", "alien": "👽", "ghost": "👻", "skull": "💀",
  "poop": "💩", "zombie": "🧟", "vampire": "🧛", "superhero": "🦸",
  "supervillain": "🦹", "wizard": "🧙", "elf": "🧝", "genie": "🧞",
  "love": "❤️", "heart": "❤️", "hearts": "💕", "brokenheart": "💔",
  "kiss": "😘", "hug": "🤗", "wedding": "💍", "ring": "💍",
  "rose": "🌹", "chocolate": "🍫", "gift": "🎁", "proposal": "💍",
  "thumbsup": "👍", "thumbsdown": "👎", "clap": "👏", "ok": "👌",
  "peace": "✌️", "rockon": "🤘", "muscle": "💪", "handshake": "🤝",
  "crossedfingers": "🤞", "pray": "🙏", "pointup": "☝️",
  "wave": "👋", "highfive": "🙌",
  "party": "🎉", "celebrate": "🎉", "birthday": "🎂", "champagne": "🍾",
  "balloon": "🎈", "confetti": "🎊", "music": "🎵", "note": "🎶",
  "medal": "🏅", "trophy": "🏆", "victory": "🥇",
  "sun": "☀️", "moon": "🌙", "star": "⭐", "rain": "🌧️",
  "cloud": "☁️", "lightning": "⚡", "snow": "❄️", "rainbow": "🌈",
  "ocean": "🌊", "volcano": "🌋", "mountain": "⛰️", "tree": "🌳",
  "flower": "🌸", "fire": "🔥", "earth": "🌍", "wind": "💨",
  "coffee": "☕", "tea": "🍵", "beer": "🍺", "wine": "🍷",
  "burger": "🍔", "pizza": "🍕", "cake": "🍰", "sushi": "🍣",
  "fries": "🍟", "steak": "🥩", "taco": "🌮", "popcorn": "🍿",
  "icecream": "🍦", "donut": "🍩", "candy": "🍬", "chocolate": "🍫",
  "car": "🚗", "bus": "🚌", "bike": "🚲", "train": "🚆",
  "airplane": "✈️", "rocket": "🚀", "ship": "🚢", "taxi": "🚕",
  "motorcycle": "🏍️", "subway": "🚇", "helicopter": "🚁",
  "phone": "📱", "laptop": "💻", "computer": "🖥️", "camera": "📷",
  "tv": "📺", "game": "🎮", "headphone": "🎧", "watch": "⌚",
  "house": "🏠", "hospital": "🏥", "school": "🏫", "office": "🏢",
  "church": "⛪", "mosque": "🕌", "stadium": "🏟️", "castle": "🏰",
  "soccer": "⚽", "basketball": "🏀", "football": "🏈",
  "baseball": "⚾", "tennis": "🎾", "golf": "⛳", "bowling": "🎳",
  "boxing": "🥊", "swim": "🏊", "run": "🏃", "cycling": "🚴",
  "dog": "🐶", "cat": "🐱", "mouse": "🐭", "rabbit": "🐰",
  "fox": "🦊", "bear": "🐻", "panda": "🐼", "koala": "🐨",
  "tiger": "🐯", "lion": "🦁", "cow": "🐮", "pig": "🐷",
  "frog": "🐸", "monkey": "🐵", "chicken": "🐔", "penguin": "🐧",
  "fish": "🐟", "whale": "🐋", "dolphin": "🐬", "elephant": "🐘",
  "giraffe": "🦒", "zebra": "🦓", "horse": "🐴", "unicorn": "🦄",
  "flag": "🚩", "world": "🌍", "globe": "🌎", "map": "🗺️", "checkeredflag": "🏁",
  "magnifyingglass": "🔍", "hourglass": "⌛", "alarmclock": "⏰",
  "stopwatch": "⏱️", "timer": "⏲️", "clock": "🕰️", "calendar": "📅",
  "sunrise": "🌅", "sunset": "🌇", "night": "🌃", "city": "🏙️",
  "park": "🏞️", "camping": "🏕️", "desert": "🏜️", "island": "🏝️",
  "mountfuji": "🗻", "volcano": "🌋", "beach": "🏖️", "umbrella": "☂️",
  "raincoat": "🧥", "scarf": "🧣", "gloves": "🧤", "socks": "🧦",
  "shoe": "👟", "hat": "🎩", "crown": "👑", "glasses": "👓",
  "sunglasses": "🕶️", "necktie": "👔", "tshirt": "👕", "jeans": "👖",
  "dress": "👗", "bikini": "👙", "purse": "👛", "handbag": "👜",
  "backpack": "🎒", "cigarette": "🚬", "pill": "💊", "syringe": "💉",
  "microscope": "🔬", "telescope": "🔭", "crystalball": "🔮",
  "film": "🎞️", "headphones": "🎧", "microphone": "🎤", "musicalnote": "🎵",
  "musicalnotes": "🎶", "musicalkeyboard": "🎹", "drum": "🥁",
  "saxophone": "🎷", "guitar": "🎸", "trumpet": "🎺", "violin": "🎻",
  "game": "🎮", "dart": "🎯", "bowling": "🎳", "slotmachine": "🎰",
  "jigsaw": "🧩", "teddybear": "🧸", "pinata": "🪅", "nestingdolls": "🪆",
  "toothbrush": "🪥", "soap": "🧼", "sponge": "🧽", "fireextinguisher": "🧯",
  "shoppingcart": "🛒", "shoppingbags": "🛍️", "gift": "🎁", "balloon": "🎈",
  "party": "🎉", "confetti": "🎊", "ribbon": "🎀", "ticket": "🎫",
  "trophy": "🏆", "medal": "🏅", "soccer": "⚽", "basketball": "🏀",
  "football": "🏈", "baseball": "⚾", "tennis": "🎾", "golf": "⛳",
  "bowling": "🎳", "boxing": "🥊", "martialarts": "🥋", "icehockey": "🏒",
  "pingpong": "🏓", "badminton": "🏸", "skateboard": "🛹", "ski": "🎿",
  "sled": "🛷", "swim": "🏊", "surfer": "🏄", "rowing": "🚣"
};


// Fungsi untuk memproses teks dan mengubah *emotion* menjadi emoji
const processMessage = (text) => {
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

const Message = ({ message, animateTyping = false }) => {
  const isUser = message.role === 'user';
  const isError = message.isError || false;
  
  // Format timestamp jika ada
  const formattedTime = message.timestamp 
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';
  
  // Proses konten pesan untuk menggantikan *emotion* dengan emoji
  const processedContent = processMessage(message.content);
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-indigo-900 flex items-center justify-center mr-2 self-start mt-1 border border-indigo-700 shadow-md shadow-indigo-900/50">
          <span className="text-xs font-bold text-indigo-200">AI</span>
        </div>
      )}
      <div
        className={`px-4 py-3 rounded-2xl shadow-lg max-w-[80%] backdrop-blur-sm ${
          isUser
            ? 'bg-gradient-to-r from-blue-700 to-blue-900 text-white rounded-br-none border border-blue-600'
            : isError 
              ? 'bg-gradient-to-r from-red-900 to-red-800 text-red-100 border border-red-700 rounded-bl-none'
              : 'bg-gray-800 border border-gray-700 text-gray-100 rounded-bl-none'
        }`}
      >
        <div className="text-sm whitespace-pre-wrap">
          {!isUser && !isError && animateTyping ? (
            <TypingEffect text={message.content} />
          ) : (
            processedContent
          )}
        </div>
        {formattedTime && (
          <div className={`text-xs mt-1 text-right ${
            isUser 
              ? 'text-blue-200' 
              : isError
                ? 'text-red-300'
                : 'text-gray-400'
          }`}>
            {formattedTime}
          </div>
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center ml-2 self-start mt-1 border border-blue-600 shadow-md shadow-blue-700/50">
          <span className="text-xs font-bold text-white">Anda</span>
        </div>
      )}
    </div>
  );
};

export default Message;