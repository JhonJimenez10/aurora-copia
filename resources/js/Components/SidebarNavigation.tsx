import { useState } from "react"
import { Link, usePage } from "@inertiajs/react"
import {
  Home,
  Send,
  ReceiptText,
  Package,
  Gift,
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
} from "lucide-react"

import { Button } from "@/Components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/Components/ui/sheet"
import { cn } from "@/lib/utils"

type NavItem = {
  title: string
  href?: string
  icon: React.ReactNode
  children?: NavItem[]
}

export default function SidebarNavigation() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)
  const { url } = usePage()

  const toggleSidebar = () => setIsCollapsed(!isCollapsed)

  const navItems: NavItem[] = [
    { title: "Empresas", href: "/enterprises", icon: <Building2 className="h-5 w-5" /> },
    { title: "Usuarios", href: "/users", icon: <Users className="h-5 w-5" /> },
    { title: "Envíos", href: "/receptions", icon: <Plane className="h-5 w-5" /> },
    {
      title: "Clientes",
      icon: <Users2 className="h-5 w-5" />,
      children: [
        { title: "Remitentes", href: "/senders", icon: <Send className="h-4 w-4" /> },
        { title: "Destinatarios", href: "/recipients", icon: <ReceiptText className="h-4 w-4" /> },
      ],
    },
    {
      title: "Artículos",
      icon: <Boxes className="h-5 w-5" />,
      children: [
        { title: "Por Agencia", href: "/art_packages", icon: <PackageCheck className="h-4 w-4" /> },
        { title: "Embalaje", href: "/art_packgs", icon: <PackagePlus className="h-4 w-4" /> },
      ],
    },
    {
      title: "Reportes",
      icon: <BarChart3 className="h-5 w-5 text-muted-foreground" />, // Icono más atractivo y claro
      children: [
        {
          title: "Envíos",
          href: "/reports",
          icon: <ReceiptText className="h-4 w-4 text-muted-foreground" />,
        },
      ],
    },
  ]

  const renderNavItem = (item: NavItem) => {
    const isActive = item.href && url.startsWith(item.href)

    if (item.children) {
      const isOpen = openSubmenu === item.title

      return (
        <div key={item.title}>
          <button
            onClick={() => setOpenSubmenu(isOpen ? null : item.title)}
            className={cn(
              "flex items-center justify-between w-full px-4 py-3 text-sm hover:bg-muted hover:text-foreground transition-colors",
              isOpen ? "bg-muted text-foreground font-medium" : "text-muted-foreground"
            )}
          >
            <span className="flex items-center gap-3">
              {item.icon}
              {!isCollapsed && item.title}
            </span>
            {!isCollapsed && (isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
          </button>
          {isOpen && !isCollapsed && (
            <div className="ml-8">
              {item.children.map((child) => (
                <Link
                  key={child.href}
                  href={child.href!}
                  className={cn(
                    "flex items-center gap-2 py-2 text-sm transition-colors hover:text-foreground",
                    url.startsWith(child.href!) ? "text-foreground font-medium" : "text-muted-foreground"
                  )}
                >
                  {child.icon}
                  {child.title}
                </Link>
              ))}
            </div>
          )}
        </div>
      )
    }

    return (
      <Link
        key={item.href}
        href={item.href!}
        className={cn(
          "flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted hover:text-foreground",
          isActive ? "bg-muted text-foreground font-medium" : "text-muted-foreground",
          isCollapsed && "justify-center px-0"
        )}
        title={isCollapsed ? item.title : undefined}
      >
        {item.icon}
        {!isCollapsed && item.title}
      </Link>
    )
  }

  return (
    <>
      {/* 📱 Mobile Sidebar */}
      <div className="lg:hidden flex items-center h-16 px-4 border-b bg-background">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="mr-2">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[240px] p-0">
            <div className="flex flex-col h-full">
              <div className="h-16 flex items-center px-4 border-b font-medium">Panel de Administración</div>
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
          "hidden lg:flex flex-col min-h-screen border-r bg-background transition-all duration-300",
          isCollapsed ? "w-[70px]" : "w-[240px]"
        )}
      >
        <div className={cn("h-16 flex items-center px-4 border-b font-medium", isCollapsed && "justify-center")}>
          {!isCollapsed && "Panel de Administración"}
        </div>
        <div className="flex flex-col flex-1 overflow-y-auto">
          <nav className="flex-1 py-2">{navItems.map(renderNavItem)}</nav>
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="w-full flex justify-center"
            >
              {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
