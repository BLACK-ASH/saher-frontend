export const imageUrl = (url?: string): string => {
  if (!url) return "/placeholder.png"
  if (url.startsWith("http")) return url
  return url // already "/uploads/..."
}
