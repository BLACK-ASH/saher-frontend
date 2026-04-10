// utils/attendance.ts

export const formatTime = (iso?: string | null | Date) => {
  if (!iso) return ""
  const date = new Date(iso)

  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")

  return `${hours}:${minutes}`
}

export const formatDate = (dateString: string | null | Date) => {
  if (!dateString) return "--"

  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export const timeToDateString = (date: string | Date, time: string) => {
  const d = new Date(date)

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")

  const iso = `${year}-${month}-${day}T${time}:00`

  return new Date(iso).toISOString()
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
