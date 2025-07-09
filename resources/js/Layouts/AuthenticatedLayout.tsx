import { PropsWithChildren, ReactNode } from "react";
import { usePage, Link, useForm } from "@inertiajs/react";
import { Package } from "lucide-react";

import { Button } from "@/Components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar";
import SidebarNavigation from "@/Components/SidebarNavigation";

export default function AuthenticatedLayout({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { post } = useForm();
    const user = usePage().props.auth?.user ?? null;

    const logout = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("logout"));
    };

    return (
        <div className="flex min-h-screen bg-black text-white">
            {/* Sidebar lateral izquierdo */}
            <SidebarNavigation />

            {/* Contenido principal */}
            <div className="flex-1 flex flex-col">
                {/* Header superior */}
                <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-red-700 bg-black px-6">
                    {/* Logo + Nombre empresa */}
                    <Link
                        href={route("dashboard")}
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                        <img
                            src="/favicon.png"
                            alt="Aurora Logo"
                            className="h-10 w-10"
                        />
                        <span className="text-lg font-semibold text-white">
                            COURIER EXPRESS
                        </span>
                    </Link>

                    {/* Notificaciones + Perfil */}
                    <div className="flex items-center gap-4 ml-auto">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 h-8 border border-red-600 bg-black text-white hover:bg-red-700"
                                >
                                    <Avatar className="h-6 w-6">
                                        <AvatarFallback>
                                            {user?.name?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="hidden md:inline-flex">
                                        {user?.name}
                                    </span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="bg-black border border-red-600 text-white"
                            >
                                <DropdownMenuLabel className="text-red-400">
                                    Mi Cuenta
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="border-red-600" />
                                <DropdownMenuItem>
                                    <Link
                                        href={route("profile.edit")}
                                        className="w-full block text-white hover:text-red-400"
                                    >
                                        Perfil
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <button
                                        onClick={logout}
                                        className="w-full text-left text-white hover:bg-red-700"
                                    >
                                        Cerrar sesión
                                    </button>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Header página */}
                {header && (
                    <div className="border-b border-red-700 bg-black">
                        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                            {header}
                        </div>
                    </div>
                )}

                {/* Contenido principal */}
                <main className="flex-1 p-4 md:p-6 bg-black">{children}</main>
            </div>
        </div>
    );
}
