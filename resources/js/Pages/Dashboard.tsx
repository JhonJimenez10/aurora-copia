import { Head, usePage } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { useEffect, useState } from 'react'
import { Package, Clock, MapPin, Users, Truck, Archive } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Tabs, TabsContent } from '@/Components/ui/tabs'
import RevenueChart from '@/Components/RevenueChart'
import CalendarComponent from '@/Components/CalendarComponent'

export default function Dashboard() {
  const { props } = usePage()
  const { stats, enterprise } = props as any
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
      <style>
        {`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeInUp { animation: fadeInUp 0.6s ease-out forwards; }
        `}
      </style>

      <div className="p-4 md:p-6 space-y-6">
        <div className="bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 p-4 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-white animate-fadeInUp">
            Panel de {enterprise?.name || 'Empresa'}
          </h2>
          <p className="text-white text-sm">Estadísticas generales del sistema de gestión</p>
        </div>

        <Tabs defaultValue="overview" onValueChange={setActiveTab}>
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 justify-center">
              <Card className="bg-slate-900 border border-purple-700 animate-fadeInUp" style={{ animationDelay: "0.1s" }}>
                <CardHeader className="flex flex-row items-center justify-between pb-1 px-4">
                  <CardTitle className="text-xs font-medium text-white">Remitentes</CardTitle>
                  <Users className="h-4 w-4 text-purple-300" />
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-xl font-bold text-white">{stats.senders}</div>
                  <p className="text-[11px] text-purple-200">clientes registrados</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border border-purple-700 animate-fadeInUp" style={{ animationDelay: "0.2s" }}>
                <CardHeader className="flex flex-row items-center justify-between pb-1 px-4">
                  <CardTitle className="text-xs font-medium text-white">Destinatarios</CardTitle>
                  <Users className="h-4 w-4 text-purple-300" />
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-xl font-bold text-white">{stats.recipients}</div>
                  <p className="text-[11px] text-purple-200">clientes destino</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border border-purple-700 animate-fadeInUp" style={{ animationDelay: "0.3s" }}>
                <CardHeader className="flex flex-row items-center justify-between pb-1 px-4">
                  <CardTitle className="text-xs font-medium text-white">Artículos</CardTitle>
                  <Archive className="h-4 w-4 text-purple-300" />
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-xl font-bold text-white">{stats.articles}</div>
                  <p className="text-[11px] text-purple-200">registrados</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border border-purple-700 animate-fadeInUp" style={{ animationDelay: "0.4s" }}>
                <CardHeader className="flex flex-row items-center justify-between pb-1 px-4">
                  <CardTitle className="text-xs font-medium text-white">Envíos Último Mes</CardTitle>
                  <Truck className="h-4 w-4 text-purple-300" />
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-xl font-bold text-white">{stats.lastMonthShipments}</div>
                  <p className="text-[11px] text-purple-200">enviados recientemente</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="lg:col-span-4 bg-slate-900 border border-purple-700 animate-fadeInUp" style={{ animationDelay: "0.5s" }}>
                <CardHeader className="px-4 pt-4 pb-1">
                  <CardTitle className="text-sm text-white">Ingresos Mensuales</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="h-[220px]">
                    <RevenueChart />
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-3 bg-slate-900 border border-purple-700 animate-fadeInUp" style={{ animationDelay: "0.6s" }}>
                <CardHeader className="px-4 pt-4 pb-1">
                  <CardTitle className="text-sm text-white">Calendario de Envíos</CardTitle>
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
