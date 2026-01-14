// Dengan emoji-toolkit
import { toImage, shortnameToUnicode } from 'emoji-toolkit';

export const convertEmoji = (text) => {
  // Konversi shortnames (:smile:) ke emoji Unicode
  let processedText = shortnameToUnicode(text);
  
  // Konversi text emoticons (:-)) ke emoji Unicode
  processedText = toImage(processedText);
  
  // Konversi *text* ke emoji
  return convertTextWithEmoji(processedText);
};