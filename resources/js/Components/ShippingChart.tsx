import { Button } from "@/Components/ui/button"
import { ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu"

const ShippingChart = () => {
  return (
    <div className="w-full h-[240px] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-medium">Envíos por Mes</h3>
          <p className="text-sm text-muted-foreground">Comparación con el período anterior</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Este Año <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Este Año</DropdownMenuItem>
            <DropdownMenuItem>Año Anterior</DropdownMenuItem>
            <DropdownMenuItem>Últimos 6 Meses</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 flex items-end gap-2">
        {["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"].map((month, i) => {
          const height = Math.floor(Math.random() * 70) + 10
          const prevHeight = Math.floor(Math.random() * 70) + 10
          return (
            <div key={month} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end justify-center gap-1 h-[150px]">
                <div className="w-[40%] bg-muted rounded-t-sm" style={{ height: `${prevHeight}%` }} />
                <div className="w-[40%] bg-primary rounded-t-sm" style={{ height: `${height}%` }} />
              </div>
              <span className="text-xs text-muted-foreground mt-1">{month}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ShippingChart
