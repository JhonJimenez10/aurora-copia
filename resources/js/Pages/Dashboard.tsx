import { Head, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useState, useEffect } from "react";
import {
    Users,
    Truck,
    Archive,
    MapPin,
    Calendar as CalendarIcon,
    AlertCircle,
    Package,
    Pill,
    Sparkles,
    TrendingUp,
    X,
} from "lucide-react";
import { Tabs, TabsContent } from "@/Components/ui/tabs";

export default function Dashboard() {
    const [showEmergencyAlert, setShowEmergencyAlert] = useState(true);

    const fixedNotices = [
        {
            id: 1,
            title: "FACTURACIÓN",
            message:
                "Emitir factura exclusiva para comida y otra para productos secos",
            icon: Package,
            type: "danger",
        },
        {
            id: 2,
            title: "MEDICINAS Y PRODUCTOS",
            message:
                "Solo medicinas con receta. Prohibido: pollo, carne, chancho y granos crudos",
            icon: Pill,
            type: "warning",
        },
    ];

    const { props } = usePage();
    const { stats, enterprise } = props as any;

    const [activeTab, setActiveTab] = useState("overview");
    const [currentMonth, setCurrentMonth] = useState<"enero" | "febrero">(
        "febrero",
    );
    const [selectedDay, setSelectedDay] = useState<string>("lunes");
    const [hoveredStat, setHoveredStat] = useState<number | null>(null);

    // Prevenir scroll cuando el modal está abierto
    useEffect(() => {
        if (showEmergencyAlert) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [showEmergencyAlert]);

    // Cronograma de envíos - Enero
    const scheduleEnero = {
        lunes: {
            "NEW YORK": ["QUEENS", "BROOKLYN"],
            MARYLAND: ["BALTIMORE"],
            CONNECTICUT: ["DAMBURY"],
        },
        martes: {
            "NEW YORK": [
                "QUEENS",
                "BROOKLYN",
                "SPRING VALLEY",
                "ALBANY",
                "MIDDLETOWN",
            ],
            MASSACHUSETTS: [
                "BROCKTON",
                "LOWELL",
                "FRAMINGHAM",
                "MILFORD",
                "FALL RIVER",
                "HYANNIS",
                "LAWRENCE",
                "WOONSCKET",
            ],
            CONNECTICUT: ["NEW HAVEN"],
            PENSILVANIA: ["PHILADELPHIA"],
        },
        miercoles: {
            "NEW YORK": [
                "QUEENS",
                "BROOKLYN",
                "WHITE PLAINS",
                "SLEEPY HOLLOW",
                "OSSINING",
                "PEEKSKILL",
                "YONKERS",
            ],
            "NEW JERSEY": ["ORANGE"],
            CONNECTICUT: ["DAMBURY", "WATER BURY", "BRIDGEPORT"],
            ILLINOIS: ["CHICAGO"],
            MINNESOTA: ["MINNEAPOLIS"],
        },
        jueves: {
            "NEW YORK": [
                "QUEENS",
                "BROOKLYN",
                "BRONX JEROME",
                "PORTCHESTER",
                "SPRING VALLEY",
                "PATCHOGUE",
                "HAMPTON BAYS",
            ],
            "NEW JERSEY": ["ORANGE"],
        },
        sabados: {
            "NEW YORK": [
                "QUEENS",
                "BROOKLYN",
                "SPRING VALLEY",
                "WHITE PLAINS",
                "SLEEPY HOLLOW",
                "OSSINING",
                "PEEKSKILL",
                "YONKERS",
                "BRONX JEROME",
                "PATCHOGUE",
                "PORTCHESTER",
            ],
            "NEW JERSEY": ["ORANGE"],
            CONNECTICUT: ["DAMBURY"],
        },
        especiales: [
            { ciudad: "BALTIMORE", fechas: "12 Y 26 ENERO" },
            { ciudad: "ROCHESTER", fechas: "21 DE ENERO" },
        ],
    };

    // Cronograma de envíos - Febrero (ACTUALIZADO)
    const scheduleFebrero = {
        lunes: {
            "NEW YORK": ["QUEENS", "BROOKLYN"],
            MARYLAND: ["BALTIMORE"],
            CONNECTICUT: ["DAMBURY"],
            "NEW JERSEY": ["NEWARK", "ORANGE"],
        },
        martes: {
            "NEW YORK": [
                "QUEENS",
                "BROOKLYN",
                "SPRING VALLEY",
                "ALBANY",
                "MIDDLETOWN",
                "OSSINING",
                "SLEEPY HOLLOW",
            ],
            MASSACHUSETTS: [
                "BROCKTON",
                "LOWELL",
                "FRAMINHAM",
                "MILFORD",
                "FALL RIVER",
                "HYANNIS",
                "LAWRENCE",
                "WOONSCKET",
            ],
            CONNECTICUT: ["NEW HAVEN"],
        },
        miercoles: {
            "NEW YORK": [
                "QUEENS",
                "BROOKLYN",
                "WHITE PLAINS",
                "SLEEPY HOLLOW",
                "OSSINING",
                "PEEKSKILL",
                "YONKERS",
                "BRONX JEROME",
                "PORTCHESTER",
                "SPRING VALLEY",
                "PATCHOGUE",
                "HAMPTON BAYS",
                "BAY SHORE",
            ],
            CONNECTICUT: ["DAMBURY", "WATER BURY", "BRIDGEPORT"],
            ILLINOIS: ["CHICAGO"],
            MINNESOTA: ["MINNEAPOLIS"],
            "NEW JERSEY": ["NEWARK", "ORANGE"],
            PENSILVANIA: ["PHILADELPHIA"],
        },
        jueves: {
            "NEW YORK": [],
            "NEW JERSEY": [],
        },
        sabados: {
            "NEW YORK": [
                "QUEENS",
                "BROOKLYN",
                "SPRING VALLEY",
                "WHITE PLAINS",
                "SLEEPY HOLLOW",
                "OSSINING",
                "PEEKSKILL",
                "YONKERS",
                "BRONX JEROME",
                "PATCHOGUE",
                "PORTCHESTER",
            ],
            "NEW JERSEY": ["NEWARK", "ORANGE"],
            CONNECTICUT: ["DAMBURY"],
        },
        especiales: [
            { ciudad: "BALTIMORE", fechas: "10 Y 24 DE FEBRERO" },
            { ciudad: "PHILADELPHIA", fechas: "11 Y 25 FEBRERO" },
            { ciudad: "ROCHESTER", fechas: "PENDIENTE" },
        ],
    };

    const currentSchedule =
        currentMonth === "enero" ? scheduleEnero : scheduleFebrero;

    const daysOfWeek = [
        {
            key: "lunes",
            label: "LUNES",
            color: "from-slate-700 to-slate-800",
            activeColor: "from-slate-600 to-slate-700",
        },
        {
            key: "martes",
            label: "MARTES",
            color: "from-slate-700 to-slate-800",
            activeColor: "from-blue-600 to-blue-700",
        },
        {
            key: "miercoles",
            label: "MIÉRCOLES",
            color: "from-slate-700 to-slate-800",
            activeColor: "from-purple-600 to-purple-700",
        },
        {
            key: "jueves",
            label: "JUEVES",
            color: "from-slate-700 to-slate-800",
            activeColor: "from-green-600 to-green-700",
        },
        {
            key: "sabados",
            label: "SÁBADOS",
            color: "from-slate-700 to-slate-800",
            activeColor: "from-cyan-600 to-cyan-700",
        },
    ];

    const getCurrentDayData = () => {
        if (selectedDay === "especiales") {
            return currentSchedule.especiales;
        }
        return currentSchedule[selectedDay as keyof typeof currentSchedule];
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
          @keyframes slideIn {
            from { opacity: 0; transform: translateX(-10px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes pulse-alert {
            0%, 100% { 
              transform: scale(1);
              box-shadow: 0 4px 20px rgba(239, 68, 68, 0.4);
            }
            50% { 
              transform: scale(1.02);
              box-shadow: 0 8px 30px rgba(239, 68, 68, 0.6), 0 0 40px rgba(239, 68, 68, 0.3);
            }
          }
          @keyframes pulse-warning {
            0%, 100% { 
              transform: scale(1);
              box-shadow: 0 4px 20px rgba(234, 179, 8, 0.4);
            }
            50% { 
              transform: scale(1.02);
              box-shadow: 0 8px 30px rgba(234, 179, 8, 0.6), 0 0 40px rgba(234, 179, 8, 0.3);
            }
          }
          @keyframes shimmer {
            0% { background-position: -1000px 0; }
            100% { background-position: 1000px 0; }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-8px) rotate(5deg); }
          }
          @keyframes bounce-subtle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-3px); }
          }
          @keyframes modalFadeIn {
            from { 
              opacity: 0;
              transform: scale(0.9);
            }
            to { 
              opacity: 1;
              transform: scale(1);
            }
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-10px); }
            75% { transform: translateX(10px); }
          }
          .animate-fadeInUp { animation: fadeInUp 0.5s ease-out forwards; }
          .animate-slideIn { animation: slideIn 0.3s ease-out forwards; }
          .animate-pulse-alert { animation: pulse-alert 2.5s ease-in-out infinite; }
          .animate-pulse-warning { animation: pulse-warning 2.5s ease-in-out infinite; }
          .animate-float { animation: float 3s ease-in-out infinite; }
          .animate-bounce-subtle { animation: bounce-subtle 2s ease-in-out infinite; }
          .animate-modal { animation: modalFadeIn 0.3s ease-out forwards; }
          .animate-shake { animation: shake 0.5s ease-in-out; }
          .shimmer-effect {
            position: relative;
            overflow: hidden;
          }
          .shimmer-effect::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(255, 255, 255, 0.3),
              transparent
            );
            animation: shimmer 3s infinite;
          }
          .glass-effect {
            background: rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          .stat-card {
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            cursor: pointer;
          }
          .stat-card:hover {
            transform: translateY(-12px) scale(1.05) rotate(-2deg);
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.7);
          }
          .stat-card:hover .stat-icon {
            transform: scale(1.3) rotate(360deg);
          }
          .stat-icon {
            transition: transform 0.6s ease;
          }
          .day-button {
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }
          .day-button::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.15);
            transform: translate(-50%, -50%);
            transition: width 0.6s, height 0.6s;
          }
          .day-button:hover::before {
            width: 300px;
            height: 300px;
          }
          .alert-card {
            transition: all 0.4s ease;
            cursor: pointer;
          }
          .alert-card:hover {
            transform: translateY(-8px) scale(1.03);
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
          }
          .location-card {
            transition: all 0.3s ease;
            cursor: pointer;
          }
          .location-card:hover {
            transform: translateX(5px);
            border-color: rgba(239, 68, 68, 0.8);
            box-shadow: 0 4px 20px rgba(239, 68, 68, 0.3);
          }
        `}
            </style>

            {/* MODAL DE ALERTA EMERGENTE */}
            {showEmergencyAlert && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeInUp">
                    <div className="relative max-w-4xl w-full animate-modal max-h-[90vh] overflow-y-auto">
                        {/* Efectos de fondo */}
                        <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-700 to-red-900 rounded-2xl blur-xl opacity-50 animate-pulse-alert"></div>

                        {/* Contenido del modal */}
                        <div className="relative bg-gradient-to-br from-red-600 via-red-700 to-red-800 rounded-2xl shadow-2xl border-4 border-red-400/50 overflow-hidden">
                            {/* Efecto shimmer */}
                            <div className="shimmer-effect absolute inset-0"></div>

                            {/* Header del modal */}
                            <div className="relative bg-gradient-to-r from-red-900/80 to-red-800/80 p-6 border-b-4 border-red-400/50">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-yellow-400 rounded-full animate-shake">
                                        <AlertCircle className="w-10 h-10 text-red-900" />
                                    </div>

                                    <div className="flex-1">
                                        <h2 className="text-3xl font-black text-white uppercase tracking-wide flex items-center gap-2">
                                            <span className="animate-bounce-subtle">
                                                ⚠️
                                            </span>
                                            AVISOS IMPORTANTES
                                            <span className="animate-bounce-subtle">
                                                ⚠️
                                            </span>
                                        </h2>
                                        <p className="text-red-100 text-sm font-semibold mt-1">
                                            Información crítica sobre embarques
                                            - Leer detenidamente
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Cuerpo del modal */}
                            <div className="relative p-8 space-y-4">
                                {/* MENSAJE PRINCIPAL - SUSPENSIÓN TEMPORAL */}
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border-2 border-white/20">
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-yellow-400 rounded-lg flex-shrink-0 animate-float">
                                                <Package className="w-6 h-6 text-red-900" />
                                            </div>

                                            <p className="text-white text-lg leading-relaxed font-medium">
                                                <span className="font-bold text-yellow-300 block mb-2 text-xl">
                                                    Estimados usuarios:
                                                </span>
                                                Para el día{" "}
                                                <span className="font-black text-yellow-300 text-xl">
                                                    sábado 24 de enero
                                                </span>{" "}
                                                no va a haber embarque hasta el
                                                día{" "}
                                                <span className="font-black text-yellow-300 text-xl">
                                                    martes 26 de enero
                                                </span>{" "}
                                                por inconvenientes en el sistema
                                                de transmisión de la aduana de
                                                Estados Unidos y problemas
                                                climatológicos en Estados
                                                Unidos.
                                            </p>
                                        </div>

                                        <div className="bg-gradient-to-r from-orange-600/40 to-yellow-600/40 rounded-lg p-4 border-2 border-yellow-400/50">
                                            <div className="flex items-center gap-3">
                                                <Truck className="w-6 h-6 text-yellow-300 animate-bounce-subtle" />
                                                <p className="text-white font-bold text-base">
                                                    Solo se receptarán{" "}
                                                    <span className="text-yellow-300 underline">
                                                        productos secos
                                                    </span>{" "}
                                                    hasta el día martes
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* MINNEAPOLIS */}
                                <div className="bg-gradient-to-r from-red-900/40 to-purple-900/40 rounded-lg p-4 border-2 border-white/20">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-yellow-400 rounded-lg flex-shrink-0 animate-float">
                                            <MapPin className="w-6 h-6 text-red-900" />
                                        </div>
                                        <div className="text-white">
                                            <p className="font-black text-lg uppercase tracking-wide">
                                                Restricción para MINNEAPOLIS
                                            </p>
                                            <p className="text-sm text-red-50 mt-1 leading-relaxed">
                                                Para{" "}
                                                <span className="font-extrabold text-yellow-300">
                                                    MINNEAPOLIS
                                                </span>{" "}
                                                no se recepta{" "}
                                                <span className="font-extrabold underline">
                                                    comida
                                                </span>{" "}
                                                ni{" "}
                                                <span className="font-extrabold underline">
                                                    paquetes por cobrar
                                                </span>
                                                . Envíe únicamente productos
                                                permitidos y{" "}
                                                <span className="font-extrabold text-yellow-300">
                                                    pagados
                                                </span>
                                                .
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* CORRECCIÓN CRONOGRAMA */}
                                <div className="bg-gradient-to-r from-blue-900/40 to-cyan-900/40 rounded-lg p-4 border-2 border-cyan-400/30">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-cyan-400 rounded-lg flex-shrink-0 animate-float">
                                            <CalendarIcon className="w-6 h-6 text-blue-900" />
                                        </div>
                                        <div className="text-white">
                                            <p className="font-black text-lg uppercase tracking-wide">
                                                Corrección de Cronograma
                                            </p>
                                            <p className="text-sm text-cyan-50 mt-1 leading-relaxed">
                                                Se ha corregido el cronograma de
                                                embarques:{" "}
                                                <span className="font-extrabold text-cyan-300">
                                                    ORANGE y NEWARK
                                                </span>{" "}
                                                ahora constan en los envíos de{" "}
                                                <span className="font-extrabold underline">
                                                    MIÉRCOLES
                                                </span>
                                                . Por favor, verifique el
                                                cronograma actualizado.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* PHILADELPHIA - CADA 15 DÍAS */}
                                <div className="bg-gradient-to-r from-orange-900/40 to-amber-900/40 rounded-lg p-4 border-2 border-orange-400/30">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-orange-400 rounded-lg flex-shrink-0 animate-float">
                                            <Truck className="w-6 h-6 text-orange-900" />
                                        </div>
                                        <div className="text-white">
                                            <p className="font-black text-lg uppercase tracking-wide">
                                                Cambio en Philadelphia
                                            </p>
                                            <p className="text-sm text-orange-50 mt-1 leading-relaxed">
                                                Desde{" "}
                                                <span className="font-extrabold text-orange-300">
                                                    FEBRERO
                                                </span>
                                                , los envíos a{" "}
                                                <span className="font-extrabold text-orange-300">
                                                    PHILADELPHIA
                                                </span>{" "}
                                                serán{" "}
                                                <span className="font-extrabold underline">
                                                    cada 15 días
                                                </span>
                                                . La semana que no corresponda
                                                Philadelphia, se pueden enviar{" "}
                                                <span className="font-extrabold">
                                                    PRODUCTOS SECOS el martes
                                                </span>
                                                .
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* ADVERTENCIA - CUMPLIMIENTO */}
                                <div className="bg-gradient-to-r from-red-900/50 to-pink-900/50 rounded-lg p-4 border-2 border-red-400/40">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-red-400 rounded-lg flex-shrink-0 animate-shake">
                                            <AlertCircle className="w-6 h-6 text-red-900" />
                                        </div>
                                        <div className="text-white">
                                            <p className="font-black text-lg uppercase tracking-wide text-yellow-300">
                                                ⚠️ IMPORTANTE - CUMPLIMIENTO
                                                OBLIGATORIO
                                            </p>
                                            <p className="text-sm text-red-50 mt-1 leading-relaxed">
                                                Es{" "}
                                                <span className="font-extrabold text-yellow-300 underline">
                                                    OBLIGATORIO
                                                </span>{" "}
                                                cumplir a cabalidad con el
                                                cronograma.{" "}
                                                <span className="font-extrabold">
                                                    NO envíen en días que no
                                                    corresponden
                                                </span>{" "}
                                                para evitar problemas con las
                                                agencias y aduanas.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* PENDIENTES */}
                                <div className="bg-gradient-to-r from-gray-800/40 to-slate-900/40 rounded-lg p-4 border-2 border-gray-500/30">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-gray-400 rounded-lg flex-shrink-0 animate-float">
                                            <CalendarIcon className="w-6 h-6 text-gray-900" />
                                        </div>
                                        <div className="text-white">
                                            <p className="font-black text-lg uppercase tracking-wide text-gray-300">
                                                Información Pendiente
                                            </p>
                                            <div className="text-sm text-gray-200 mt-2 space-y-1 leading-relaxed">
                                                <p>
                                                    •{" "}
                                                    <span className="font-extrabold text-yellow-300">
                                                        ROCHESTER
                                                    </span>
                                                    : Fecha de envío{" "}
                                                    <span className="font-extrabold">
                                                        aún pendiente
                                                    </span>
                                                </p>
                                                <p>
                                                    •{" "}
                                                    <span className="font-extrabold text-yellow-300">
                                                        MINNEAPOLIS
                                                    </span>
                                                    : El envío de comida sigue{" "}
                                                    <span className="font-extrabold text-red-400">
                                                        RESTRINGIDO
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-red-100 text-sm pt-2">
                                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
                                    <div className="w-2 h-2 bg-yellow-400 rounded-full absolute"></div>
                                    <span className="ml-2">
                                        Por favor, tome nota de todas estas
                                        restricciones y cambios
                                    </span>
                                </div>
                            </div>

                            {/* Footer del modal con botón */}
                            <div className="relative p-6 bg-gradient-to-r from-red-900/60 to-red-800/60 border-t-2 border-red-400/30">
                                <button
                                    onClick={() => setShowEmergencyAlert(false)}
                                    className="w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 hover:from-yellow-500 hover:via-yellow-600 hover:to-orange-600 text-red-900 font-black text-lg py-4 px-8 rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 uppercase tracking-wider flex items-center justify-center gap-3 group"
                                >
                                    <span>
                                        He leído y entendido todos los mensajes
                                    </span>
                                    <span className="text-2xl group-hover:animate-bounce-subtle">
                                        ✓
                                    </span>
                                </button>
                            </div>

                            {/* Indicadores pulsantes en las esquinas */}
                            <div className="absolute top-4 right-4">
                                <div className="w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
                                <div className="absolute top-0 right-0 w-4 h-4 bg-yellow-400 rounded-full"></div>
                            </div>
                            <div className="absolute bottom-4 left-4">
                                <div className="w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
                                <div className="absolute top-0 left-0 w-4 h-4 bg-yellow-400 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-4 md:p-6 space-y-4 max-h-screen overflow-hidden bg-black">
                {/* Alertas ULTRA Llamativas */}
                {fixedNotices.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {fixedNotices.map((n, idx) => {
                            const IconComponent = n.icon;
                            return (
                                <div
                                    key={n.id}
                                    className={`alert-card relative overflow-hidden rounded-xl shadow-2xl animate-fadeInUp ${
                                        n.type === "danger"
                                            ? "bg-gradient-to-br from-red-600 via-red-700 to-red-800 animate-pulse-alert"
                                            : "bg-gradient-to-br from-yellow-500 via-yellow-600 to-orange-600 animate-pulse-warning"
                                    }`}
                                    style={{ animationDelay: `${idx * 0.1}s` }}
                                >
                                    <div className="shimmer-effect absolute inset-0"></div>

                                    <div
                                        className={`absolute inset-0 rounded-xl ${
                                            n.type === "danger"
                                                ? "border-2 border-red-300/60"
                                                : "border-2 border-yellow-200/60"
                                        }`}
                                    ></div>

                                    <div className="relative p-4 flex items-start gap-3">
                                        <div
                                            className={`p-2 rounded-lg animate-float ${
                                                n.type === "danger"
                                                    ? "bg-red-900/60 ring-2 ring-red-300/30"
                                                    : "bg-orange-900/60 ring-2 ring-yellow-300/30"
                                            }`}
                                        >
                                            <IconComponent
                                                className={`w-6 h-6 ${
                                                    n.type === "danger"
                                                        ? "text-red-50"
                                                        : "text-yellow-50"
                                                }`}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <h3
                                                className={`font-bold text-sm mb-1 flex items-center gap-2 ${
                                                    n.type === "danger"
                                                        ? "text-white"
                                                        : "text-gray-900"
                                                }`}
                                            >
                                                <span className="animate-bounce-subtle">
                                                    ⚠️
                                                </span>
                                                {n.title}
                                            </h3>
                                            <p
                                                className={`text-xs leading-relaxed ${
                                                    n.type === "danger"
                                                        ? "text-red-50"
                                                        : "text-gray-900"
                                                }`}
                                            >
                                                {n.message}
                                            </p>
                                        </div>
                                        <div className="absolute top-3 right-3">
                                            <div
                                                className={`w-3 h-3 rounded-full ${
                                                    n.type === "danger"
                                                        ? "bg-red-200 animate-ping"
                                                        : "bg-yellow-200 animate-ping"
                                                }`}
                                            ></div>
                                            <div
                                                className={`absolute top-0 right-0 w-3 h-3 rounded-full ${
                                                    n.type === "danger"
                                                        ? "bg-red-200"
                                                        : "bg-yellow-200"
                                                }`}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Header Premium Interactivo */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-red-600 via-red-700 to-red-800 p-5 shadow-2xl animate-fadeInUp hover:shadow-red-900/50 transition-all duration-300 cursor-pointer group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent group-hover:via-white/20 transition-all"></div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/20 rounded-full blur-3xl group-hover:bg-red-400/30 transition-all"></div>
                    <div className="relative flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-yellow-300 animate-bounce-subtle" />
                        <div>
                            <h2 className="text-2xl font-bold text-white group-hover:text-yellow-100 transition-colors">
                                Panel de {enterprise?.name || "Empresa"}
                            </h2>
                            <p className="text-red-100 text-sm">
                                Estadísticas generales del sistema de gestión
                            </p>
                        </div>
                    </div>
                </div>

                <Tabs defaultValue="overview" onValueChange={setActiveTab}>
                    <TabsContent value="overview" className="space-y-4">
                        {/* Stats Cards ULTRA Interactivos */}
                        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
                            {[
                                {
                                    title: "Remitentes",
                                    value: stats.senders,
                                    icon: Users,
                                    subtitle: "clientes",
                                    gradient: "from-blue-600 to-blue-800",
                                },
                                {
                                    title: "Destinatarios",
                                    value: stats.recipients,
                                    icon: Users,
                                    subtitle: "clientes",
                                    gradient: "from-purple-600 to-purple-800",
                                },
                                {
                                    title: "Agencia",
                                    value: stats.artPackages,
                                    icon: Archive,
                                    subtitle: "artículos",
                                    gradient: "from-green-600 to-green-800",
                                },
                                {
                                    title: "Embalaje",
                                    value: stats.artPackgs,
                                    icon: Archive,
                                    subtitle: "artículos",
                                    gradient: "from-orange-600 to-orange-800",
                                },
                                {
                                    title: "Último Mes",
                                    value: stats.lastMonthShipments,
                                    icon: Truck,
                                    subtitle: "envíos",
                                    gradient: "from-red-600 to-red-800",
                                },
                            ].map((item, index) => {
                                const IconComponent = item.icon;
                                return (
                                    <div
                                        key={index}
                                        className={`stat-card relative overflow-hidden rounded-xl bg-gradient-to-br ${item.gradient} p-4 shadow-xl animate-fadeInUp`}
                                        style={{
                                            animationDelay: `${0.1 * (index + 1)}s`,
                                        }}
                                        onMouseEnter={() =>
                                            setHoveredStat(index)
                                        }
                                        onMouseLeave={() =>
                                            setHoveredStat(null)
                                        }
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0"></div>
                                        {hoveredStat === index && (
                                            <div className="shimmer-effect absolute inset-0"></div>
                                        )}
                                        <div className="relative">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-semibold text-white/80 uppercase tracking-wide">
                                                    {item.title}
                                                </span>
                                                <IconComponent className="stat-icon w-4 h-4 text-white/60" />
                                            </div>
                                            <div className="text-2xl font-bold text-white mb-1 flex items-center gap-1">
                                                {item.value}
                                                {hoveredStat === index && (
                                                    <TrendingUp className="w-4 h-4 text-white/80 animate-bounce-subtle" />
                                                )}
                                            </div>
                                            <p className="text-[9px] text-white/70">
                                                {item.subtitle}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="grid gap-3 md:grid-cols-5">
                            {/* Agencias de Destino Interactivo */}
                            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-yellow-500 via-yellow-600 to-orange-600 p-4 shadow-xl animate-fadeInUp md:col-span-1 cursor-pointer group hover:scale-105 transition-all duration-300">
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 group-hover:via-white/30 transition-all"></div>
                                <div className="shimmer-effect absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative">
                                    <h3 className="text-xs font-bold text-gray-900 mb-3">
                                        Agencias
                                    </h3>
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                        <div className="p-3 bg-orange-700/30 rounded-full group-hover:bg-orange-700/50 transition-all group-hover:rotate-12 duration-300">
                                            <MapPin className="w-8 h-8 text-white" />
                                        </div>
                                        <span className="text-4xl font-bold text-white group-hover:scale-110 transition-transform">
                                            {stats.agenciesDest}
                                        </span>
                                        <p className="text-[10px] text-gray-900 font-semibold text-center">
                                            oficinas EEUU
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Calendario Premium Interactivo */}
                            <div className="relative overflow-hidden rounded-xl glass-effect p-4 shadow-2xl animate-fadeInUp md:col-span-4 group hover:shadow-red-900/30 transition-all duration-300">
                                <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 via-transparent to-blue-600/10 group-hover:from-red-600/20 group-hover:to-blue-600/20 transition-all"></div>

                                <div className="relative">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <CalendarIcon className="w-4 h-4 text-red-400 animate-bounce-subtle" />
                                            <h3 className="text-sm font-bold text-white">
                                                Cronograma de Envíos
                                            </h3>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() =>
                                                    setCurrentMonth("enero")
                                                }
                                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-110 ${
                                                    currentMonth === "enero"
                                                        ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-900/50"
                                                        : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                                                }`}
                                            >
                                                Enero
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setCurrentMonth("febrero")
                                                }
                                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-110 ${
                                                    currentMonth === "febrero"
                                                        ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-900/50"
                                                        : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                                                }`}
                                            >
                                                Febrero 🎭
                                            </button>
                                        </div>
                                    </div>

                                    {/* Tabs de días ULTRA Interactivos */}
                                    <div className="flex gap-2 mb-4 flex-wrap">
                                        {daysOfWeek.map((day) => (
                                            <button
                                                key={day.key}
                                                onClick={() =>
                                                    setSelectedDay(day.key)
                                                }
                                                className={`day-button px-4 py-2 rounded-lg text-xs font-bold ${
                                                    selectedDay === day.key
                                                        ? `bg-gradient-to-r ${day.activeColor} text-white shadow-lg scale-105`
                                                        : "bg-gray-800/50 text-gray-400 hover:bg-gray-700/70 hover:scale-105"
                                                }`}
                                            >
                                                {day.label}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() =>
                                                setSelectedDay("especiales")
                                            }
                                            className={`day-button px-4 py-2 rounded-lg text-xs font-bold ${
                                                selectedDay === "especiales"
                                                    ? "bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg scale-105"
                                                    : "bg-gray-800/50 text-gray-400 hover:bg-gray-700/70 hover:scale-105"
                                            }`}
                                        >
                                            🎯 ESPECIALES
                                        </button>
                                    </div>

                                    {/* Contenido del día */}
                                    <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50 min-h-[120px]">
                                        {selectedDay === "especiales" ? (
                                            <div className="space-y-3 animate-slideIn">
                                                <h3 className="text-orange-400 font-bold text-sm uppercase mb-3 flex items-center gap-2">
                                                    <Sparkles className="w-4 h-4 animate-bounce-subtle" />
                                                    Embarques Especiales
                                                </h3>
                                                {(
                                                    getCurrentDayData() as any[]
                                                ).map((special, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex items-center justify-between bg-gradient-to-r from-orange-900/30 to-red-900/30 p-3 rounded-lg border border-orange-500/30 hover:border-orange-500/80 hover:shadow-lg hover:shadow-orange-900/30 transition-all cursor-pointer hover:scale-105"
                                                    >
                                                        <span className="text-yellow-300 font-bold text-sm">
                                                            {special.ciudad}
                                                        </span>
                                                        <span className="text-white text-xs bg-gray-800/80 px-3 py-1 rounded-full hover:bg-gray-700 transition-colors">
                                                            {special.fechas}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="space-y-3 animate-slideIn">
                                                <h3 className="text-red-400 font-bold text-sm uppercase mb-3">
                                                    {daysOfWeek.find(
                                                        (d) =>
                                                            d.key ===
                                                            selectedDay,
                                                    )?.label || ""}
                                                </h3>
                                                {Object.keys(
                                                    getCurrentDayData() as Record<
                                                        string,
                                                        string[]
                                                    >,
                                                ).length === 0 ||
                                                Object.values(
                                                    getCurrentDayData() as Record<
                                                        string,
                                                        string[]
                                                    >,
                                                ).every(
                                                    (cities) =>
                                                        cities.length === 0,
                                                ) ? (
                                                    <div className="flex flex-col items-center justify-center py-8 space-y-3">
                                                        <div className="p-4 bg-gray-800/60 rounded-full">
                                                            <AlertCircle className="w-12 h-12 text-gray-400" />
                                                        </div>
                                                        <p className="text-gray-400 text-base font-semibold">
                                                            Para este día se
                                                            puede receptar todo
                                                            lo que es CARGA SECA
                                                            para el embarque del
                                                            día sábado.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {Object.entries(
                                                            getCurrentDayData() as Record<
                                                                string,
                                                                string[]
                                                            >,
                                                        ).map(
                                                            ([
                                                                state,
                                                                cities,
                                                            ]) => {
                                                                if (
                                                                    cities.length ===
                                                                    0
                                                                )
                                                                    return null;
                                                                return (
                                                                    <div
                                                                        key={
                                                                            state
                                                                        }
                                                                        className="location-card bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-3 rounded-lg border border-gray-700/50"
                                                                    >
                                                                        <span className="text-yellow-400 font-bold text-xs block mb-2">
                                                                            {
                                                                                state
                                                                            }
                                                                        </span>
                                                                        <span className="text-gray-300 text-[11px] leading-relaxed">
                                                                            {cities.join(
                                                                                ", ",
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            },
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Nota informativa Interactiva */}
                                    <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-500/50 rounded-lg p-3 text-xs text-blue-300 mt-3 flex items-start gap-2 hover:border-blue-400/80 hover:shadow-lg hover:shadow-blue-900/30 transition-all cursor-pointer">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 animate-bounce-subtle" />
                                        <span>
                                            Los horarios pueden variar. Consulte
                                            con su oficina local.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </AuthenticatedLayout>
    );
}
