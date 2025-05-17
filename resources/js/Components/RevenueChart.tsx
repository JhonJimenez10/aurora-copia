import {
    LineChart,
    Line,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
    TooltipProps,
  } from "recharts"
  import { Card, CardContent } from "@/Components/ui/card"
  import { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent"
  
  const data = [
    { month: "Ene", revenue: 2000 },
    { month: "Feb", revenue: 2200 },
    { month: "Mar", revenue: 2700 },
    { month: "Abr", revenue: 2400 },
    { month: "May", revenue: 2800 },
    { month: "Jun", revenue: 3200 },
    { month: "Jul", revenue: 3100 },
    { month: "Ago", revenue: 3400 },
    { month: "Sep", revenue: 3700 },
    { month: "Oct", revenue: 3500 },
    { month: "Nov", revenue: 3800 },
    { month: "Dic", revenue: 4200 },
  ]
  
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: TooltipProps<ValueType, NameType>) => {
    if (
      active &&
      payload &&
      payload.length > 0 &&
      payload[0]?.value !== undefined
    ) {
      return (
        <Card className="border-none shadow-lg">
          <CardContent className="p-2">
            <p className="text-sm font-semibold">{label}</p>
            <p className="text-sm text-muted-foreground">
              Ingresos: ${Number(payload[0].value).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      )
    }
    return null
  }
  
  export default function RevenueChart() {
    return (
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data}>
          <XAxis dataKey="month" stroke="#888888" fontSize={12} />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#0ea5e9"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    )
  }
  