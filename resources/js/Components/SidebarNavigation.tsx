import { useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import {
    Send,
    ReceiptText,
    Building2,
    Users,
    ChevronLeft,
    ChevronRight,
    Menu,
    ChevronDown,
    ChevronUp,
    Users2,
    Boxes,
    PackageCheck,
    PackagePlus,
    Plane,
    BarChart3,
    FileUp,
    ClipboardList,
    FileSpreadsheet,
    FileSearch,
} from "lucide-react";

import { Button } from "@/Components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/Components/ui/sheet";
import { cn } from "@/lib/utils";
import type { PageProps } from "@/types";

type NavItem = {
    title: string;
    href?: string;
    icon: React.ReactNode;
    children?: NavItem[];
};

export default function SidebarNavigation() {
    const { props } = usePage<PageProps>();
    const userRole = props.auth?.role;
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
    const { url } = usePage();

    const toggleSidebar = () => setIsCollapsed(!isCollapsed);

    const navItems: NavItem[] = [];
    // Bloqueo temporal
    const blockShipments = true;
    const blockInvoices = true;
    if (userRole === "Sudo") {
        navItems.push(
            {
                title: "Empresas",
                href: "/enterprises",
                icon: <Building2 className="h-5 w-5" />,
            },
            {
                title: "Usuarios",
                href: "/users",
                icon: <Users className="h-5 w-5" />,
            }
        );
    }

    if (userRole === "Sudo" || userRole === "Admin") {
        if (!blockShipments) {
            navItems.push({
                title: "Envíos",
                href: "/receptions/create",
                icon: <Plane className="h-5 w-5" />,
            });
        }
        navItems.push(
            {
                title: "Clientes",
                icon: <Users2 className="h-5 w-5" />,
                children: [
                    {
                        title: "Remitentes",
                        href: "/senders",
                        icon: <Send className="h-4 w-4" />,
                    },
                    {
                        title: "Destinatarios",
                        href: "/recipients",
                        icon: <ReceiptText className="h-4 w-4" />,
                    },
                ],
            },
            {
                title: "Artículos",
                icon: <Boxes className="h-5 w-5" />,
                children: [
                    {
                        title: "Por Agencia",
                        href: "/art_packages",
                        icon: <PackageCheck className="h-4 w-4" />,
                    },
                    {
                        title: "Embalaje",
                        href: "/art_packgs",
                        icon: <PackagePlus className="h-4 w-4" />,
                    },
                ],
            },
            {
                title: "Agencias Destino",
                href: "/agencies_dest",
                icon: <Building2 className="h-4 w-4" />,
            },
            {
                title: "Carga Masiva",
                icon: <FileUp className="h-5 w-5" />,
                children: [
                    {
                        title: "Remitentes",
                        href: "/bulk-import/senders",
                        icon: <Send className="h-4 w-4" />,
                    },
                    {
                        title: "Destinatarios",
                        href: "/bulk-import/recipients",
                        icon: <ReceiptText className="h-4 w-4" />,
                    },
                    {
                        title: "Art. Agencia",
                        href: "/bulk-import/art_packages",
                        icon: <PackageCheck className="h-4 w-4" />,
                    },
                    {
                        title: "Art. Embalaje",
                        href: "/bulk-import/art_packgs",
                        icon: <PackagePlus className="h-4 w-4" />,
                    },
                    {
                        title: "Agencias Destino",
                        href: "/bulk-import/agencies_dest",
                        icon: <Building2 className="h-4 w-4" />,
                    },
                ],
            },
            {
                title: "Reportes",
                icon: <BarChart3 className="h-5 w-5" />,
                children: [
                    {
                        title: "Reporte Manifiesto",
                        href: "/reports",
                        icon: <ClipboardList className="h-4 w-4" />, // 👈 nuevo
                    },
                    {
                        title: "Reporte Facturación",
                        href: "/reports/invoices",
                        icon: <FileSpreadsheet className="h-4 w-4" />, // 👈 nuevo
                    },
                    {
                        title: "Detalle Facturación",
                        href: "/receptions",
                        icon: <FileSearch className="h-4 w-4" />, // 👈 nuevo
                    },
                ],
            }
        );
    }

    if (userRole === "Customer") {
        navItems.push(
            {
                title: "Envíos",
                href: "/receptions/create",
                icon: <Plane className="h-5 w-5" />,
            },
            {
                title: "Reportes",
                icon: <BarChart3 className="h-5 w-5" />,
                children: [
                    {
                        title: "Detalle Facturación",
                        href: "/receptions",
                        icon: <FileSearch className="h-4 w-4" />, // 👈 nuevo
                    },
                ],
            },
            {
                title: "Reporte Factura",
                href: "/reports/invoices",
                icon: <FileSpreadsheet className="h-4 w-4" />,
            }
        );
    }

    const renderNavItem = (item: NavItem) => {
        const isActive = item.href && url.startsWith(item.href);
        const activeColor = "bg-red-600 text-white font-medium";
        const hoverColor = "hover:bg-red-700 hover:text-white";
        const textColor = "text-gray-300";

        if (item.children) {
            const isOpen = openSubmenu === item.title;

            return (
                <div key={item.title}>
                    <button
                        onClick={() =>
                            setOpenSubmenu(isOpen ? null : item.title)
                        }
                        className={cn(
                            "flex items-center justify-between w-full px-4 py-3 text-sm transition-colors",
                            isOpen ? activeColor : `${textColor} ${hoverColor}`
                        )}
                    >
                        <span className="flex items-center gap-3">
                            {item.icon}
                            {!isCollapsed && item.title}
                        </span>
                        {!isCollapsed &&
                            (isOpen ? (
                                <ChevronUp className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            ))}
                    </button>
                    {isOpen && !isCollapsed && (
                        <div className="ml-8">
                            {item.children.map((child) => (
                                <Link
                                    key={child.href}
                                    href={child.href!}
                                    className={cn(
                                        "flex items-center gap-2 py-2 text-sm transition-colors",
                                        url.startsWith(child.href!)
                                            ? "text-white font-medium"
                                            : `${textColor} ${hoverColor}`
                                    )}
                                >
                                    {child.icon}
                                    {child.title}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <Link
                key={item.href}
                href={item.href!}
                className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm transition-colors",
                    isActive ? activeColor : `${textColor} ${hoverColor}`,
                    isCollapsed && "justify-center px-0"
                )}
                title={isCollapsed ? item.title : undefined}
            >
                {item.icon}
                {!isCollapsed && item.title}
            </Link>
        );
    };

    return (
        <>
            {/* 📱 Mobile Sidebar */}
            <div className="lg:hidden flex items-center h-16 px-4 border-b border-red-700 bg-black text-white">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            className="mr-2 border border-red-600 bg-black hover:bg-red-700"
                        >
                            <Menu className="h-5 w-5 text-white" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent
                        side="left"
                        className="w-[240px] p-0 bg-black text-white"
                    >
                        <div className="flex flex-col h-full">
                            <div className="h-16 flex items-center px-4 border-b border-red-700 font-medium">
                                Panel de Administración
                            </div>
                            <nav className="flex-1 overflow-auto py-2">
                                {navItems.map(renderNavItem)}
                            </nav>
                        </div>
                    </SheetContent>
                </Sheet>
                <div className="font-medium">Panel de Administración</div>
            </div>

            {/* 🖥 Desktop Sidebar */}
            <div
                className={cn(
                    "hidden lg:flex flex-col min-h-screen border-r border-red-700 bg-black transition-all duration-300 text-white",
                    isCollapsed ? "w-[70px]" : "w-[240px]"
                )}
            >
                <div
                    className={cn(
                        "h-16 flex items-center px-4 border-b border-red-700 font-medium",
                        isCollapsed && "justify-center"
                    )}
                >
                    {!isCollapsed && "Panel de Administración"}
                </div>
                <div className="flex flex-col flex-1 overflow-y-auto">
                    <nav className="flex-1 py-2">
                        {navItems.map(renderNavItem)}
                    </nav>
                    <div className="border-t border-red-700 p-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleSidebar}
                            className="w-full flex justify-center text-white hover:bg-red-700"
                        >
                            {isCollapsed ? (
                                <ChevronRight className="h-5 w-5" />
                            ) : (
                                <ChevronLeft className="h-5 w-5" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}
