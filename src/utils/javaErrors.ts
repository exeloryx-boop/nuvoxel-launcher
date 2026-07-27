export function isJavaLaunchError(message: string): boolean {
  return (
    message.startsWith("ERR_JAVA_") ||
    /java.*не найден/i.test(message) ||
    /java.*не знайден/i.test(message) ||
    /java.*not found/i.test(message)
  );
}
