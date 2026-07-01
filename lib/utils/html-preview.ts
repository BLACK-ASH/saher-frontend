export function htmlToPreview(html: string, maxLength = 120) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const text = doc.body.textContent?.trim() || "";

  return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
}
