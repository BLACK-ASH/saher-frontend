// utils/attendance.ts

export const formatTime = (dateString: string | null | Date) => {
  if (!dateString) return "--"

  return new Date(dateString).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export const formatDate = (dateString: string | null | Date) => {
  if (!dateString) return "--"

  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export const calculateWorkHours = (
  checkIn: string | null | Date,
  checkOut: string | null | Date
) => {
  if (!checkIn || !checkOut) return "--"

  const diff =
    new Date(checkOut).getTime() - new Date(checkIn).getTime()

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff / (1000 * 60)) % 60)

  return `${hours}h ${minutes}m`
}
