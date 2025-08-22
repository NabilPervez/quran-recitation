const arabicToEnglishMap: { [key: string]: string } = {
  // Vowels and Tanween
  'َ': 'a', 'ُ': 'u', 'ِ': 'i',
  'ً': 'an', 'ٌ': 'un', 'ٍ': 'in',
  'ْ': '', // Sukun (no vowel)
  'ّ': '', // Shadda (gemination), handled by doubling consonant

  // Consonants
  'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'aa',
  'ب': 'b',
  'ت': 't', 'ة': 'h/t',
  'ث': 'th',
  'ج': 'j',
  'ح': 'h',
  'خ': 'kh',
  'د': 'd',
  'ذ': 'dh',
  'ر': 'r',
  'ز': 'z',
  'س': 's',
  'ش': 'sh',
  'ص': 's',
  'ض': 'd',
  'ط': 't',
  'ظ': 'z',
  'ع': '`', // Using backtick to represent 'Ayn
  'غ': 'gh',
  'ف': 'f',
  'ق': 'q',
  'ك': 'k',
  'ل': 'l',
  'م': 'm',
  'ن': 'n',
  'ه': 'h',
  'و': 'w/u',
  'ي': 'y/i',
  'ى': 'a',

  // Numbers
  '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9', '٠': '0',

  // Punctuation
  '؟': '?', '،': ',', '؛': ';',
  '(': '(', ')': ')',
  '۝': '', // Ayah end symbol
};

export function transliterate(text: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (nextChar === 'ّ') { // Handle Shadda
      const mappedChar = arabicToEnglishMap[char] || char;
      result += mappedChar + mappedChar;
      i++; // Skip the shadda character
      continue;
    }

    const mappedChar = arabicToEnglishMap[char];
    if(mappedChar) {
      // Special case for Alif Laam
      if (char === 'ل' && text[i-1] === 'ا') {
        if(result.endsWith('a')) {
          result = result.slice(0, -1) + 'al-';
        } else {
          result += 'l';
        }
      } else {
         result += mappedChar;
      }
    }
  }

  // Basic post-processing for cleaner output
  result = result.replace(/`a/g, '`a').replace(/`u/g, '`u').replace(/`i/g, '`i'); // `Ayn with vowels
  result = result.replace(/w\/ua/g, 'wa').replace(/y\/ii/g, 'yi');
  result = result.replace(/w\/u/g, 'w').replace(/y\/i/g, 'y'); // Clean up remaining markers

  return result;
}
