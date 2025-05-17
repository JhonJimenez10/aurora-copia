import { Head } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { useEffect, useState } from 'react'
import {
  Package,
  Clock,
  MapPin,
  ArrowUpRight,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Tabs, TabsContent } from '@/Components/ui/tabs'
import RevenueChart from '@/Components/RevenueChart'
import CalendarComponent from '@/Components/CalendarComponent'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${h}h ${m}m ${sec}s`
  }

  return (
    <AuthenticatedLayout>
      <Head title="Dashboard" />

      {/* 👇 Animaciones personalizadas */}
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-fadeInUp {
            animation: fadeInUp 0.6s ease-out forwards;
          }
        `}
      </style>

      <div className="p-4 md:p-6 space-y-6">
        <Tabs defaultValue="overview" onValueChange={setActiveTab}>
          <TabsContent value="overview" className="space-y-6">
            {/* Métricas */}
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3 justify-center">
            <Card className="animate-fadeInUp" style={{ animationDelay: "0.1s" }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4">
                <CardTitle className="text-xs font-medium">Envíos Totales</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-xl font-bold">1,248</div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                  <span className="text-emerald-500 flex items-center">
                    <ArrowUpRight className="h-3 w-3" />
                    12.5%
                  </span>
                  desde el mes pasado
                </p>
              </CardContent>
            </Card>

            <Card className="animate-fadeInUp" style={{ animationDelay: "0.2s" }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4">
                <CardTitle className="text-xs font-medium">Tiempo en el Sistema</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-xl font-bold">{formatTime(seconds)}</div>
                <p className="text-[11px] text-muted-foreground mt-1">desde que inició sesión</p>
              </CardContent>
            </Card>

            <Card className="animate-fadeInUp" style={{ animationDelay: "0.3s" }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4">
                <CardTitle className="text-xs font-medium">Destinos Principales</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-xl font-bold">24 ciudades</div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                  <span className="text-emerald-500 flex items-center">
                    <ArrowUpRight className="h-3 w-3" />3
                  </span>
                  nuevas este mes
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico y calendario */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-4 animate-fadeInUp" style={{ animationDelay: "0.4s" }}>
              <CardHeader className="px-4 pt-4 pb-1">
                <CardTitle className="text-sm">Ingresos Mensuales</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="h-[220px]">
                  <RevenueChart />
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3 animate-fadeInUp" style={{ animationDelay: "0.5s" }}>
              <CardHeader className="px-4 pt-4 pb-1">
                <CardTitle className="text-sm">Calendario de Envíos</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="max-h-[260px] overflow-hidden">
                  <CalendarComponent />
                </div>
              </CardContent>
            </Card>
          </div>

          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  )
}
