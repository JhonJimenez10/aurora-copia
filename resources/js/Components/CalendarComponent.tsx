import { Button } from "@/Components/ui/button"
import { ChevronDown } from "lucide-react"

const CalendarComponent = () => {
  const now = new Date()
  const month = now.toLocaleString("es-ES", { month: "long" })
  const year = now.getFullYear()

  const today = now.getDate()

  return (
    <div className="border border-gray-700 rounded-lg p-4 bg-[#1a1a2e] text-white">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium capitalize text-gray-300">{month} {year}</h3>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" className="border-gray-500 text-gray-300 hover:bg-purple-700 hover:text-white">Hoy</Button>
          <Button variant="outline" size="icon" className="h-8 w-8 border-gray-500 text-gray-300 hover:bg-purple-700 hover:text-white">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2">
        {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(day => (
          <div key={day} className="py-1 text-gray-400">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-sm">
        {Array.from({ length: 35 }).map((_, i) => {
          const day = i - 2
          const isToday = day === today
          const isPrevMonth = day < 1
          const isNextMonth = day > 30
          const hasEvents = [5, 12, 15, 20, 25].includes(day)

          return (
            <div
              key={i}
              className={`rounded-md p-2 h-14 flex flex-col justify-between items-center
              ${isToday ? "bg-purple-700 text-white" : "hover:bg-gray-800 cursor-pointer"}
              ${isPrevMonth || isNextMonth ? "text-gray-500" : "text-gray-300"}`}
            >
              <span>{isPrevMonth ? 30 + day : isNextMonth ? day - 30 : day}</span>
              {hasEvents && !isPrevMonth && !isNextMonth && (
                <div className={`h-1.5 w-1.5 rounded-full ${isToday ? "bg-white" : "bg-purple-400"}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CalendarComponent
