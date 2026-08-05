import { AlertCircle, X } from "lucide-react";
import type { AssignedSack, SackPackage } from "./types";

// ─── Helpers numéricos ──────────────────────────────────────────
export function n(v: any) {
    return parseFloat(String(v)) || 0;
}

export function calculateTotals(pkgs: SackPackage[]) {
    return {
        pieces: pkgs.length,
        pounds: pkgs.reduce((s, p) => s + n(p.pounds), 0),
        kilograms: pkgs.reduce((s, p) => s + n(p.kilograms), 0),
    };
}

export function getDestinationAgencies(sack: AssignedSack): string {
    if (sack.destination_agencies && sack.destination_agencies.trim()) {
        return sack.destination_agencies;
    }
    const fromPackages = Array.from(
        new Set(
            (sack.packages ?? [])
                .map((p) => p.destination_agency)
                .filter((v): v is string => Boolean(v && v.trim())),
        ),
    );
    if (fromPackages.length) {
        return fromPackages.join(", ");
    }
    return sack.to_city ?? "—";
}

// ✅ CORREGIDO: lee el token de la cookie XSRF-TOKEN (igual que el resto
// del sistema/Inertia), en vez del <meta name="csrf-token"> estático que
// queda desactualizado si la sesión se refresca mientras la página sigue
// abierta. Úsala SIEMPRE junto al header "X-XSRF-TOKEN" (no "X-CSRF-TOKEN").
export function csrfToken(): string {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : "";
}

// ─── StatusBadge ─────────────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { label: string; cls: string }> = {
        OPEN: {
            label: "Abierto",
            cls: "bg-green-900/30 text-green-300 border-green-700",
        },
        CLOSED: {
            label: "Cerrado",
            cls: "bg-gray-800 text-gray-300 border-gray-600",
        },
        CANCELLED: {
            label: "Cancelado",
            cls: "bg-red-900/30 text-red-300 border-red-700",
        },
    };
    const s = map[status] ?? map.OPEN;
    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${s.cls}`}
        >
            {s.label}
        </span>
    );
}

// ─── Field ───────────────────────────────────────────────────────
export function Field({
    label,
    icon,
    error,
    required,
    children,
}: {
    label: string;
    icon: React.ReactNode;
    error?: string;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                <span className="text-red-500">{icon}</span>
                {label}
                {required && <span className="text-red-500">*</span>}
            </label>
            {children}
            {error && (
                <p className="flex items-center gap-1 text-xs text-red-400">
                    <AlertCircle className="h-3 w-3" />
                    {error}
                </p>
            )}
        </div>
    );
}

// ─── Modal genérico ─────────────────────────────────────────────
export function Modal({
    title,
    isOpen,
    onClose,
    children,
    actions,
}: {
    title: string;
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    // Botones/íconos extra en el header, antes de la X (ej. imprimir)
    actions?: React.ReactNode;
}) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="bg-black border border-red-700 rounded-lg w-full max-w-6xl shadow-lg">
                <div className="flex items-center justify-between px-6 py-3 border-b border-red-700">
                    <h2 className="text-lg font-semibold text-white">
                        {title}
                    </h2>
                    <div className="flex items-center gap-2">
                        {actions}
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1 rounded-full hover:bg-red-700 text-gray-300"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>
                <div className="px-6 py-4 max-h-[80vh] overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}
