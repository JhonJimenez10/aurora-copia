import { PropsWithChildren, ReactNode } from "react"
import { usePage, Link, useForm } from "@inertiajs/react"
import { Search, Bell, Package } from "lucide-react"

import { Input } from "@/Components/ui/input"
import { Button } from "@/Components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar"
import SidebarNavigation from "@/Components/SidebarNavigation"

export default function AuthenticatedLayout({
  header,
  children,
}: PropsWithChildren<{ header?: ReactNode }>) {
  const { post } = useForm()
  const user = usePage().props.auth.user

  const logout = (e: React.FormEvent) => {
    e.preventDefault()
    post(route("logout"))
  }

  return (
    <div className="flex min-h-screen bg-muted/40">
      {/* Sidebar lateral izquierdo */}
      <SidebarNavigation />

      {/* Contenido principal a la derecha del sidebar */}
      <div className="flex-1 flex flex-col">
        {/* Header superior */}
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
          {/* Logo + Nombre empresa con redirección al dashboard */}
          <Link href={route("dashboard")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="bg-primary/10 p-2 rounded-full">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <span className="text-lg font-semibold">Aurora Express</span>
          </Link>

          {/* Notificaciones + Perfil usuario */}
          <div className="flex items-center gap-4 ml-auto">
            

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-8">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src="/placeholder-user.jpg" alt="Usuario" />
                    <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline-flex">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link href={route("profile.edit")}>Perfil</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <button
                    onClick={logout}
                    className="w-full text-left"
                  >
                    Cerrar sesión
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Encabezado de página (opcional) */}
        {header && (
          <div className="border-b bg-background">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              {header}
            </div>
          </div>
        )}

        {/* Contenido de la página */}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
