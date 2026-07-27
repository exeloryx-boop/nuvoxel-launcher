export function maskPrivateText(text: string, hidden: boolean): string {
  if (!hidden || !text) return text;
  if (text.length <= 4) return "••••";
  return `${text.slice(0, 2)}••••${text.slice(-2)}`;
}

export function maskEmail(text: string, hidden: boolean): string {
  if (!hidden || !text.includes("@")) return maskPrivateText(text, hidden);
  const [user, domain] = text.split("@");
  return `${maskPrivateText(user, true)}@${domain}`;
}
