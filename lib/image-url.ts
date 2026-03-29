export const imageUrl = (url: string): string => {
  if (process.env.NODE_ENV === "development") return process.env.NEXT_PUBLIC_SERVER_URL! + url
  return url
}
