const BAD_WORDS = [
  "сука", "блять", "бля", "хуй", "пизд", "єбан", "єбат", "їбат", "нахуй",
  "піздец", "мудак", "залупа", "шлюха", "блядь", "дебіл", "даун", "урод",
  "fuck", "shit", "bitch", "asshole", "dick", "pussy", "nigger", "faggot",
  "bastard", "whore", "cunt", "damn", "retard", "idiot", "пидорас", "підар", "підарас", "пидор", "ёбаный", "ёбаная", "ёбаный", "ёбаная",
  "пиз", "підар", "підарас", "хуйло", "пиздобол", "пиздобольск", "піздобол", "піздобол", "їбанат", "їбанатка", "їбанатка", "їбанат"
];

export function containsProfanity(text) {
  if (!text) return false;
  const lower = text.toLowerCase().replace(/[^a-zа-яіїєґ]/g, "");
  return BAD_WORDS.some((w) => lower.includes(w));
}

export function findProfanityWords(text) {
  if (!text) return [];
  const lower = text.toLowerCase().replace(/[^a-zа-яіїєґ ]/g, "");
  return BAD_WORDS.filter((w) => lower.includes(w));
}
