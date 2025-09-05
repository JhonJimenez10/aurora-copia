import { Head, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useEffect, useState } from "react";
import { Package, Clock, MapPin, Users, Truck, Archive } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Tabs, TabsContent } from "@/Components/ui/tabs";
import RevenueChart from "@/Components/RevenueChart";
import CalendarComponent from "@/Components/CalendarComponent";

export default function Dashboard() {
    const fixedNotices = [
        {
            id: 1,
            title: "⚠️ Cambios en la facturación",
            message:
                "Queremos informarles que hemos realizado ciertos cambios en los artículos de nuestro sistema. Además, hemos enviado internamente una lista actualizada de los productos que sí se pueden enviar. Por favor, utilicen esta lista para sus operaciones. Gracias por su colaboración.",
            type: "danger",
        },
        {
            id: 2,
            title: "⚠️ URGENTE: Envíos se reanudan el sabado 06 de septiembre",
            message:
                "Informamos a nuestros clientes que los envíos a Estados Unidos se reanudarán este sábado. Las cargas para Nueva York y Massachusetts podrán ser receptadas desde mañana, viernes, hasta el sábado. Para Massachusetts, los envíos se reanudarán la próxima semana. Gracias por su comprensión.",
            type: "warning",
        },
    ];

    const { props } = usePage();
    const { stats, enterprise } = props as any;
    const [activeTab, setActiveTab] = useState("overview");
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (s: number) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        return `${h}h ${m}m ${sec}s`;
    };

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
                {fixedNotices.length > 0 && (
                    <div className="space-y-3">
                        {fixedNotices.map((n) => (
                            <div
                                key={n.id}
                                className={`p-3 rounded-lg shadow-md ${
                                    n.type === "danger"
                                        ? "bg-red-600 text-white"
                                        : n.type === "warning"
                                        ? "bg-yellow-500 text-black"
                                        : "bg-blue-600 text-white"
                                }`}
                            >
                                <h3 className="font-bold">{n.title}</h3>
                                <p>{n.message}</p>
                            </div>
                        ))}
                    </div>
                )}

                <div className="bg-gradient-to-r from-red-700 via-red-600 to-red-500 p-4 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold text-white animate-fadeInUp">
                        Panel de {enterprise?.name || "Empresa"}
                    </h2>
                    <p className="text-white text-sm">
                        Estadísticas generales del sistema de gestión
                    </p>
                </div>

                <Tabs defaultValue="overview" onValueChange={setActiveTab}>
                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5">
                            {[
                                {
                                    title: "Remitentes",
                                    value: stats.senders,
                                    icon: (
                                        <Users className="h-4 w-4 text-red-400" />
                                    ),
                                    subtitle: "clientes registrados",
                                },
                                {
                                    title: "Destinatarios",
                                    value: stats.recipients,
                                    icon: (
                                        <Users className="h-4 w-4 text-red-400" />
                                    ),
                                    subtitle: "clientes registrados",
                                },
                                {
                                    title: "Agencia",
                                    value: stats.artPackages,
                                    icon: (
                                        <Archive className="h-4 w-4 text-red-400" />
                                    ),
                                    subtitle: "artículos registrados",
                                },
                                {
                                    title: "Embalaje",
                                    value: stats.artPackgs,
                                    icon: (
                                        <Archive className="h-4 w-4 text-red-400" />
                                    ),
                                    subtitle: "artículos registrados",
                                },
                                {
                                    title: "Envíos Último Mes",
                                    value: stats.lastMonthShipments,
                                    icon: (
                                        <Truck className="h-4 w-4 text-red-400" />
                                    ),
                                    subtitle: "enviados recientemente",
                                },
                            ].map((item, index) => (
                                <Card
                                    key={index}
                                    className="bg-black border border-red-600 animate-fadeInUp col-span-1"
                                    style={{
                                        animationDelay: `${0.1 * (index + 1)}s`,
                                    }}
                                >
                                    <CardHeader className="flex flex-row items-center justify-between pb-1 px-4">
                                        <CardTitle className="text-xs font-medium text-white">
                                            {item.title}
                                        </CardTitle>
                                        {item.icon}
                                    </CardHeader>
                                    <CardContent className="px-4 pb-4">
                                        <div className="text-xl font-bold text-white">
                                            {item.value}
                                        </div>
                                        <p className="text-[11px] text-gray-400">
                                            {item.subtitle}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                            {/* Nueva tarjeta: Agencias de Destino */}
                            <Card
                                className="lg:col-span-4 bg-black border border-yellow-500 animate-fadeInUp"
                                style={{ animationDelay: "0.5s" }}
                            >
                                <CardHeader className="px-4 pt-4 pb-1">
                                    <CardTitle className="text-sm text-white">
                                        Agencias de Destino Registradas
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-4">
                                    <div className="flex flex-col items-center justify-center h-[220px] space-y-2">
                                        <MapPin className="w-8 h-8 text-yellow-400" />
                                        <span className="text-4xl font-bold text-white">
                                            {stats.agenciesDest}
                                        </span>
                                        <p className="text-xs text-gray-400">
                                            Total de agencias vinculadas a tu
                                            empresa
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Calendario de Envíos */}
                            <Card
                                className="lg:col-span-3 bg-black border border-red-600 animate-fadeInUp"
                                style={{ animationDelay: "0.6s" }}
                            >
                                <CardHeader className="px-4 pt-4 pb-1">
                                    <CardTitle className="text-sm text-white">
                                        Calendario de Envíos
                                    </CardTitle>
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
    );
}
