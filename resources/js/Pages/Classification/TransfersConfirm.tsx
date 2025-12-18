import { Head } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import type { PageProps } from "@/types";
import { Button } from "@/Components/ui/button";
import {
    Search,
    X,
    ChevronRight,
    ChevronLeft,
    ChevronUp,
    ChevronDown,
    CheckCircle2,
    CheckCircle, // ✅ NUEVO
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { cn } from "@/lib/utils";

/** ---------------------
 * Tipos generales
 * --------------------- */
type TransfersConfirmPageProps = PageProps<{
    countries: string[];
    agencies: string[];
}>;

type ModalProps = {
    title: string;
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
};

function Modal({ title, isOpen, onClose, children }: ModalProps) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="bg-black border border-red-700 rounded-lg w-full max-w-6xl shadow-lg">
                <div className="flex items-center justify-between px-6 py-3 border-b border-red-700">
                    <h2 className="text-lg font-semibold text-white">
                        {title}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-red-700 text-gray-300"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="px-6 py-4 max-h-[75vh] overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}

/** ---------------------
 * ✅ NUEVO: MODAL DE ÉXITO
 * --------------------- */
type SuccessModalProps = {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    isFullyConfirmed?: boolean;
};

function SuccessModal({
    isOpen,
    onClose,
    title,
    message,
    isFullyConfirmed = false,
}: SuccessModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70">
            <div className="bg-black border border-green-600 rounded-lg w-full max-w-md shadow-2xl animate-in fade-in duration-200">
                <div className="px-6 py-8 text-center">
                    {/* Icono animado */}
                    <div className="mx-auto w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="h-10 w-10 text-green-500 animate-in zoom-in duration-300" />
                    </div>

                    {/* Título */}
                    <h3 className="text-xl font-bold text-white mb-2">
                        {title}
                    </h3>

                    {/* Mensaje */}
                    <p className="text-gray-300 text-sm mb-6">{message}</p>

                    {/* Badge de estado */}
                    {isFullyConfirmed && (
                        <div className="mb-4">
                            <span className="inline-block px-4 py-2 bg-green-900/30 border border-green-600 rounded-full text-green-400 text-xs font-semibold">
                                ✓ TRASLADO CONFIRMADO
                            </span>
                        </div>
                    )}

                    {/* Botón */}
                    <Button
                        onClick={onClose}
                        className="bg-green-600 hover:bg-green-700 text-white w-full"
                    >
                        Aceptar
                    </Button>
                </div>
            </div>
        </div>
    );
}

/** ---------------------
 * Tipos para paquetes
 * --------------------- */
type SackPackage = {
    id: string;
    code: string;
    content: string;
    serviceType: string;
    pounds: number;
    kilograms: number;
};

function calculateTotals(packages: SackPackage[]) {
    const pieces = packages.length;
    const pounds = packages.reduce((sum, p) => sum + p.pounds, 0);
    const kilograms = packages.reduce((sum, p) => sum + p.kilograms, 0);
    return { pieces, pounds, kilograms };
}

/** ---------------------
 * Tipos búsqueda de traslados
 * --------------------- */
type TransferSearchFilters = {
    startDate: string;
    endDate: string;
    country: string;
    fromCity: string;
    toCity: string;
    onlyPending: boolean;
};

type TransferSearchResult = {
    id: number | string;
    number: string;
    country: string;
    from_city: string;
    to_city: string;
    status: string;
};

/** ---------------------
 * Tipos detalles del traslado
 * --------------------- */
type ConfirmTransferDetails = {
    id: number | string;
    number: string;
    from_city: string;
    to_city: string;
    sacks: Array<{
        id: string;
        number: number;
        seal: string | null;
        refrigerated: boolean;
        pending: SackPackage[];
        confirmed: SackPackage[];
    }>;
};

/** ---------------------
 * MODAL: CONFIRMAR TRASLADO
 * --------------------- */
type ConfirmTransferModalProps = {
    isOpen: boolean;
    onClose: () => void;
    transferId: number | string | null;
    onSaved?: () => void;
};

function ConfirmTransferModal({
    isOpen,
    onClose,
    transferId,
    onSaved,
}: ConfirmTransferModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [details, setDetails] = useState<ConfirmTransferDetails | null>(null);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [saving, setSaving] = useState(false);

    // ✅ NUEVO: Estados para modal de éxito
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successData, setSuccessData] = useState<{
        title: string;
        message: string;
        isFullyConfirmed: boolean;
    }>({
        title: "",
        message: "",
        isFullyConfirmed: false,
    });

    const current =
        details && details.sacks.length ? details.sacks[currentIdx] : null;

    const [selectedPendingId, setSelectedPendingId] = useState<string | null>(
        null
    );

    const [selectedConfirmedId, setSelectedConfirmedId] = useState<
        string | null
    >(null);

    // Estados de búsqueda
    const [searchPending, setSearchPending] = useState("");
    const [searchConfirmed, setSearchConfirmed] = useState("");

    useEffect(() => {
        const load = async () => {
            if (!isOpen || transferId == null) return;
            setLoading(true);
            setError(null);
            setDetails(null);
            setSelectedPendingId(null);
            setSelectedConfirmedId(null);
            setCurrentIdx(0);
            setSearchPending("");
            setSearchConfirmed("");

            try {
                const res = await fetch(`/api/transfers/${transferId}/details`);
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || `HTTP ${res.status}`);
                }
                const data: ConfirmTransferDetails = await res.json();
                setDetails(data);
            } catch (e: any) {
                setError(
                    e.message || "No se pudo cargar el traslado seleccionado."
                );
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [isOpen, transferId]);

    // Filtros
    const filteredPending = useMemo(() => {
        if (!current || !searchPending.trim()) return current?.pending ?? [];

        const term = searchPending.toLowerCase();
        return current.pending.filter(
            (p) =>
                p.code.toLowerCase().includes(term) ||
                p.content.toLowerCase().includes(term) ||
                p.id.toLowerCase().includes(term)
        );
    }, [current, searchPending]);

    const filteredConfirmed = useMemo(() => {
        if (!current || !searchConfirmed.trim())
            return current?.confirmed ?? [];

        const term = searchConfirmed.toLowerCase();
        return current.confirmed.filter(
            (p) =>
                p.code.toLowerCase().includes(term) ||
                p.content.toLowerCase().includes(term) ||
                p.id.toLowerCase().includes(term)
        );
    }, [current, searchConfirmed]);

    const moveToConfirmed = () => {
        if (!current || !selectedPendingId) return;
        const sack = { ...current };
        const pkg = sack.pending.find((p) => p.id === selectedPendingId);
        if (!pkg) return;
        sack.pending = sack.pending.filter((p) => p.id !== selectedPendingId);
        sack.confirmed = [...sack.confirmed, pkg];
        replaceSack(sack);
        setSelectedPendingId(null);
    };

    const moveToPending = () => {
        if (!current || !selectedConfirmedId) return;
        const sack = { ...current };
        const pkg = sack.confirmed.find((p) => p.id === selectedConfirmedId);
        if (!pkg) return;
        sack.confirmed = sack.confirmed.filter(
            (p) => p.id !== selectedConfirmedId
        );
        sack.pending = [...sack.pending, pkg];
        replaceSack(sack);
        setSelectedConfirmedId(null);
    };

    const replaceSack = (sack: {
        id: string;
        number: number;
        seal: string | null;
        refrigerated: boolean;
        pending: SackPackage[];
        confirmed: SackPackage[];
    }) => {
        if (!details) return;
        const copy = { ...details };
        copy.sacks = copy.sacks.map((s) =>
            s.number === sack.number ? sack : s
        );
        setDetails(copy);
    };

    const totalsPending = useMemo(
        () => calculateTotals(filteredPending),
        [filteredPending]
    );
    const totalsConfirmed = useMemo(
        () => calculateTotals(filteredConfirmed),
        [filteredConfirmed]
    );

    // ✅ MODIFICADO: saveAll con modal personalizado
    const saveAll = async () => {
        if (!details) return;
        const payload = {
            sacks: details.sacks.map((s) => ({
                number: s.number,
                seal: s.seal || null,
                refrigerated: s.refrigerated,
                confirmedPackageIds: s.confirmed.map((p) => p.id),
            })),
        };
        setSaving(true);
        setError(null);
        try {
            const res = await fetch(`/api/transfers/${details.id}/sacks`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN":
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute("content") || "",
                    Accept: "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                let errorMessage;
                const contentType = res.headers.get("content-type");

                if (contentType && contentType.includes("application/json")) {
                    const errorData = await res.json();
                    errorMessage =
                        errorData.error ||
                        errorData.message ||
                        `HTTP ${res.status}`;
                } else {
                    const errorText = await res.text();
                    console.error("Error HTML recibido:", errorText);
                    errorMessage = `Error ${res.status}: La sesión expiró o hubo un problema de autenticación. Recarga la página.`;
                }

                throw new Error(errorMessage);
            }

            const result = await res.json();

            // ✅ NUEVO: Mostrar modal personalizado en lugar de alert
            if (result.status === "CONFIRMED") {
                setSuccessData({
                    title: "¡Traslado Confirmado!",
                    message:
                        "Todos los paquetes fueron recibidos correctamente. El traslado ha sido marcado como completado.",
                    isFullyConfirmed: true,
                });
            } else {
                setSuccessData({
                    title: "Progreso Guardado",
                    message:
                        "La confirmación parcial se guardó correctamente. Puedes continuar confirmando los paquetes restantes más tarde.",
                    isFullyConfirmed: false,
                });
            }

            setShowSuccessModal(true);

            if (onSaved) onSaved();
            onClose();
        } catch (e: any) {
            console.error("Error al guardar:", e);
            setError(
                e.message ||
                    "No se pudo guardar la confirmación. Intenta nuevamente."
            );
        } finally {
            setSaving(false);
        }
    };

    const gotoPrev = () => {
        if (!details) return;
        setSelectedPendingId(null);
        setSelectedConfirmedId(null);
        setSearchPending("");
        setSearchConfirmed("");
        setCurrentIdx((i) => (i > 0 ? i - 1 : details.sacks.length - 1));
    };

    const gotoNext = () => {
        if (!details) return;
        setSelectedPendingId(null);
        setSelectedConfirmedId(null);
        setSearchPending("");
        setSearchConfirmed("");
        setCurrentIdx((i) => (i + 1) % details.sacks.length);
    };

    const setSeal = (value: string) => {
        if (!current) return;
        replaceSack({ ...current, seal: value });
    };

    const setRefrigerated = (value: boolean) => {
        if (!current) return;
        replaceSack({ ...current, refrigerated: value });
    };

    return (
        <>
            <Modal
                title="Sacas confirmar traslado"
                isOpen={isOpen}
                onClose={onClose}
            >
                {loading && (
                    <div className="text-sm text-gray-300 italic">
                        Cargando...
                    </div>
                )}
                {error && (
                    <div className="mb-3 p-3 bg-red-900/30 border border-red-700 rounded text-sm text-red-400">
                        {error}
                    </div>
                )}
                {!loading && !error && details && (
                    <>
                        <div className="mb-4 flex items-center justify-between">
                            <div className="text-sm">
                                <span className="text-gray-300">
                                    Traslado No.:{" "}
                                </span>
                                <span className="text-white font-semibold">
                                    {details.number}
                                </span>
                                <span className="text-gray-300 ml-4">
                                    De: {details.from_city} → A:{" "}
                                    {details.to_city}
                                </span>
                            </div>
                        </div>

                        <div className="mb-3 flex items-center justify-between">
                            <div className="text-sm text-gray-300">
                                No. saca:{" "}
                                <span className="text-white font-semibold">
                                    {current?.number ?? "—"}
                                </span>
                            </div>
                            {details.sacks.length > 1 && (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400">
                                        {currentIdx + 1} de{" "}
                                        {details.sacks.length}
                                    </span>
                                    <Button
                                        type="button"
                                        size="icon"
                                        className="bg-red-600 hover:bg-red-700 h-8 w-8"
                                        onClick={gotoPrev}
                                        title="Saca anterior"
                                    >
                                        <ChevronUp className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        size="icon"
                                        className="bg-red-600 hover:bg-red-700 h-8 w-8"
                                        onClick={gotoNext}
                                        title="Saca siguiente"
                                    >
                                        <ChevronDown className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_auto_1.5fr] gap-4">
                            {/* Pendientes */}
                            <div>
                                <h3 className="text-sm text-gray-300 mb-2">
                                    Buscar paquetes pendientes
                                </h3>

                                <div className="mb-2">
                                    <input
                                        type="text"
                                        value={searchPending}
                                        onChange={(e) =>
                                            setSearchPending(e.target.value)
                                        }
                                        placeholder="Buscar por No. paquete o contenido..."
                                        className="w-full bg-[#111] border border-red-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500"
                                    />
                                </div>

                                <div className="overflow-x-auto rounded-lg border border-red-700">
                                    <table className="min-w-full text-sm text-white table-auto">
                                        <thead className="bg-red-800 text-white">
                                            <tr>
                                                <th className="px-3 py-2 text-left">
                                                    No. paquete
                                                </th>
                                                <th className="px-3 py-2 text-left">
                                                    Contenido
                                                </th>
                                                <th className="px-3 py-2 text-left">
                                                    Tipo servicio
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredPending.length ? (
                                                filteredPending.map((pkg) => (
                                                    <tr
                                                        key={pkg.id}
                                                        onClick={() =>
                                                            setSelectedPendingId(
                                                                pkg.id
                                                            )
                                                        }
                                                        className={cn(
                                                            "border-t border-red-700 cursor-pointer hover:bg-[#1b1b1b]",
                                                            selectedPendingId ===
                                                                pkg.id &&
                                                                "bg-red-900/60"
                                                        )}
                                                    >
                                                        <td className="px-3 py-1">
                                                            {pkg.code}
                                                        </td>
                                                        <td className="px-3 py-1">
                                                            {pkg.content}
                                                        </td>
                                                        <td className="px-3 py-1">
                                                            {pkg.serviceType}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td
                                                        colSpan={3}
                                                        className="text-center py-3 text-gray-300 italic"
                                                    >
                                                        {searchPending.trim()
                                                            ? "No se encontraron paquetes con ese criterio."
                                                            : "No existen paquetes pendientes de confirmar correspondientes a la saca seleccionada."}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="mt-2 text-xs text-gray-300 flex justify-between">
                                    <span>
                                        PAQUETES:{" "}
                                        <span className="text-white font-semibold">
                                            {totalsPending.pieces}
                                        </span>
                                    </span>
                                    <span>
                                        LBS:{" "}
                                        <span className="text-white font-semibold">
                                            {totalsPending.pounds.toFixed(2)}
                                        </span>
                                    </span>
                                    <span>
                                        KGS:{" "}
                                        <span className="text-white font-semibold">
                                            {totalsPending.kilograms.toFixed(2)}
                                        </span>
                                    </span>
                                </div>
                            </div>

                            {/* Flechas */}
                            <div className="flex flex-col items-center justify-center gap-3">
                                <Button
                                    type="button"
                                    size="icon"
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={moveToConfirmed}
                                    disabled={!selectedPendingId}
                                    title="Confirmar (→)"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Button
                                    type="button"
                                    size="icon"
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={moveToPending}
                                    disabled={!selectedConfirmedId}
                                    title="Revertir (←)"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Confirmados */}
                            <div>
                                <h3 className="text-sm text-gray-300 mb-2">
                                    Buscar paquetes confirmados
                                </h3>

                                <div className="mb-2">
                                    <input
                                        type="text"
                                        value={searchConfirmed}
                                        onChange={(e) =>
                                            setSearchConfirmed(e.target.value)
                                        }
                                        placeholder="Buscar por No. paquete o contenido..."
                                        className="w-full bg-[#111] border border-red-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500"
                                    />
                                </div>

                                <div className="overflow-x-auto rounded-lg border border-red-700">
                                    <table className="min-w-full text-sm text-white table-auto">
                                        <thead className="bg-red-800 text-white">
                                            <tr>
                                                <th className="px-3 py-2 text-left">
                                                    No. paquete
                                                </th>
                                                <th className="px-3 py-2 text-left">
                                                    Contenido
                                                </th>
                                                <th className="px-3 py-2 text-left">
                                                    Tipo servicio
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredConfirmed.length ? (
                                                filteredConfirmed.map((pkg) => (
                                                    <tr
                                                        key={pkg.id}
                                                        onClick={() =>
                                                            setSelectedConfirmedId(
                                                                pkg.id
                                                            )
                                                        }
                                                        className={cn(
                                                            "border-t border-red-700 cursor-pointer hover:bg-[#1b1b1b]",
                                                            selectedConfirmedId ===
                                                                pkg.id &&
                                                                "bg-red-900/60"
                                                        )}
                                                    >
                                                        <td className="px-3 py-1">
                                                            {pkg.code}
                                                        </td>
                                                        <td className="px-3 py-1">
                                                            {pkg.content}
                                                        </td>
                                                        <td className="px-3 py-1">
                                                            {pkg.serviceType}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td
                                                        colSpan={3}
                                                        className="text-center py-3 text-red-400"
                                                    >
                                                        {searchConfirmed.trim()
                                                            ? "No se encontraron paquetes con ese criterio."
                                                            : "No hay paquetes confirmados en esta saca."}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="mt-2 text-xs text-gray-300 flex justify-between">
                                    <span>
                                        PAQUETES:{" "}
                                        <span className="text-white font-semibold">
                                            {totalsConfirmed.pieces}
                                        </span>
                                    </span>
                                    <span>
                                        LBS:{" "}
                                        <span className="text-white font-semibold">
                                            {totalsConfirmed.pounds.toFixed(2)}
                                        </span>
                                    </span>
                                    <span>
                                        KGS:{" "}
                                        <span className="text-white font-semibold">
                                            {totalsConfirmed.kilograms.toFixed(
                                                2
                                            )}
                                        </span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Zona inferior */}
                        <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm text-gray-300">
                            <div className="flex gap-6">
                                <span>
                                    LIBRAS:{" "}
                                    <span className="text-white font-semibold">
                                        {calculateTotals(
                                            current?.confirmed ?? []
                                        ).pounds.toFixed(2)}
                                    </span>
                                </span>
                                <span>
                                    KILOS:{" "}
                                    <span className="text-white font-semibold">
                                        {calculateTotals(
                                            current?.confirmed ?? []
                                        ).kilograms.toFixed(2)}
                                    </span>
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span>Precinto</span>
                                <input
                                    type="text"
                                    value={current?.seal ?? ""}
                                    onChange={(e) => setSeal(e.target.value)}
                                    className="bg-[#111] border border-red-700 rounded px-3 py-1 text-sm text-white w-40"
                                />
                            </div>

                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={!!current?.refrigerated}
                                    onChange={(e) =>
                                        setRefrigerated(e.target.checked)
                                    }
                                />
                                <span>Mantener refrigerada</span>
                            </label>
                        </div>

                        <div className="mt-6 flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="border-red-700 text-gray-200 hover:bg-red-700"
                                onClick={onClose}
                                disabled={saving}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="button"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={saveAll}
                                disabled={saving}
                                title="Guardar (todas las sacas)"
                            >
                                {saving ? "Guardando..." : "Guardar"}
                            </Button>
                        </div>
                    </>
                )}
            </Modal>

            {/* ✅ NUEVO: Modal de éxito */}
            <SuccessModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                title={successData.title}
                message={successData.message}
                isFullyConfirmed={successData.isFullyConfirmed}
            />
        </>
    );
}

/** ---------------------
 * PANTALLA PRINCIPAL
 * --------------------- */
export default function TransfersConfirm({
    countries: countriesProp,
    agencies: agenciesProp,
}: TransfersConfirmPageProps) {
    const countries = countriesProp?.length ? countriesProp : ["ECUADOR"];
    const agencies = agenciesProp ?? [];

    const [showSearchModal, setShowSearchModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const [confirmTransferId, setConfirmTransferId] = useState<
        number | string | null
    >(null);

    const [searchFilters, setSearchFilters] = useState<TransferSearchFilters>(
        () => ({
            startDate: "",
            endDate: "",
            country: countries[0] ?? "ECUADOR",
            fromCity: "[TODOS]",
            toCity: "",
            onlyPending: true,
        })
    );
    const [searchResults, setSearchResults] = useState<TransferSearchResult[]>(
        []
    );
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    const [selectedResultId, setSelectedResultId] = useState<
        string | number | null
    >(null);

    useEffect(() => {
        if (showSearchModal) {
            setSearchError(null);
            setSearchResults([]);
            setSelectedResultId(null);
        }
    }, [showSearchModal]);

    const handleSearchSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSearchError(null);
        setSearchLoading(true);
        setSearchResults([]);
        setSelectedResultId(null);

        try {
            const params = new URLSearchParams();
            if (searchFilters.startDate)
                params.append("start_date", searchFilters.startDate);
            if (searchFilters.endDate)
                params.append("end_date", searchFilters.endDate);
            if (searchFilters.country)
                params.append("country", searchFilters.country);
            if (
                searchFilters.fromCity &&
                searchFilters.fromCity !== "[TODOS]"
            ) {
                params.append("from_city", searchFilters.fromCity);
            }
            if (searchFilters.toCity)
                params.append("to_city", searchFilters.toCity);
            if (searchFilters.onlyPending) params.append("only_pending", "1");

            const url = params.toString()
                ? `/api/transfers/search?${params.toString()}`
                : "/api/transfers/search";

            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: TransferSearchResult[] = await res.json();
            setSearchResults(data);
            if (!data.length)
                setSearchError(
                    "No se encontraron traslados pendientes con esos filtros."
                );
        } catch {
            setSearchError(
                "Ocurrió un error al buscar los traslados. Intenta nuevamente."
            );
        } finally {
            setSearchLoading(false);
        }
    };

    const openConfirmForSelected = () => {
        if (!selectedResultId) return;
        setConfirmTransferId(selectedResultId);
        setShowConfirmModal(true);
        setShowSearchModal(false);
    };

    const handleConfirmationSaved = () => {
        if (searchResults.length > 0) {
            handleSearchSubmit(new Event("submit") as any);
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Confirmar Llegada Traslado" />

            <div className="container mx-auto px-4 py-8">
                <div className="bg-gradient-to-r from-red-700 via-red-600 to-yellow-400 text-white px-6 py-4 rounded-t-lg">
                    <h1 className="text-2xl font-bold">
                        Confirmar Llegada Traslado
                    </h1>
                    <p className="text-white text-sm">
                        Confirma los paquetes recibidos de traslados pendientes
                    </p>
                </div>

                <div className="bg-black border border-red-700 px-6 py-4 rounded-b-lg shadow-md">
                    <div className="flex items-center justify-center py-16">
                        <div className="text-center space-y-4">
                            <CheckCircle2 className="h-16 w-16 mx-auto text-red-600" />
                            <h2 className="text-xl font-semibold text-white">
                                Confirmar Traslados Pendientes
                            </h2>
                            <p className="text-gray-300 max-w-md">
                                Busca traslados pendientes de confirmación y
                                verifica la llegada de paquetes saca por saca.
                            </p>
                            <Button
                                type="button"
                                className="bg-red-600 hover:bg-red-700 mt-4"
                                onClick={() => setShowSearchModal(true)}
                            >
                                <Search className="h-4 w-4 mr-2" />
                                Buscar Traslados Pendientes
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL: BUSCAR DOCUMENTOS TRASLADO */}
            <Modal
                title="Buscar documentos traslado"
                isOpen={showSearchModal}
                onClose={() => setShowSearchModal(false)}
            >
                <form className="space-y-4" onSubmit={handleSearchSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <label className="text-sm text-gray-300 mb-1">
                                Fecha inicio
                            </label>
                            <input
                                type="date"
                                value={searchFilters.startDate}
                                onChange={(e) =>
                                    setSearchFilters((f) => ({
                                        ...f,
                                        startDate: e.target.value,
                                    }))
                                }
                                className="bg-[#111] border border-red-700 rounded px-3 py-2 text-sm text-white"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm text-gray-300 mb-1">
                                Fecha final
                            </label>
                            <input
                                type="date"
                                value={searchFilters.endDate}
                                onChange={(e) =>
                                    setSearchFilters((f) => ({
                                        ...f,
                                        endDate: e.target.value,
                                    }))
                                }
                                className="bg-[#111] border border-red-700 rounded px-3 py-2 text-sm text-white"
                            />
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm text-gray-300 mb-1">
                                País
                            </label>
                            <select
                                value={searchFilters.country}
                                onChange={(e) =>
                                    setSearchFilters((f) => ({
                                        ...f,
                                        country: e.target.value,
                                    }))
                                }
                                className="bg-[#111] border border-red-700 rounded px-3 py-2 text-sm text-white"
                            >
                                {countries.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm text-gray-300 mb-1">
                                Traslado de
                            </label>
                            <select
                                value={searchFilters.fromCity}
                                onChange={(e) =>
                                    setSearchFilters((f) => ({
                                        ...f,
                                        fromCity: e.target.value,
                                    }))
                                }
                                className="bg-[#111] border border-red-700 rounded px-3 py-2 text-sm text-white"
                            >
                                <option value="[TODOS]">[TODOS]</option>
                                {agencies.map((a) => (
                                    <option key={a} value={a}>
                                        {a}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm text-gray-300 mb-1">
                                Traslado a
                            </label>
                            <select
                                value={searchFilters.toCity}
                                onChange={(e) =>
                                    setSearchFilters((f) => ({
                                        ...f,
                                        toCity: e.target.value,
                                    }))
                                }
                                className="bg-[#111] border border-red-700 rounded px-3 py-2 text-sm text-white"
                            >
                                <option value="">[TODOS]</option>
                                {agencies.map((a) => (
                                    <option key={a} value={a}>
                                        {a}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center mt-6">
                            <input
                                id="onlyPending"
                                type="checkbox"
                                checked={searchFilters.onlyPending}
                                onChange={(e) =>
                                    setSearchFilters((f) => ({
                                        ...f,
                                        onlyPending: e.target.checked,
                                    }))
                                }
                                className="mr-2"
                            />
                            <label
                                htmlFor="onlyPending"
                                className="text-sm text-gray-300"
                            >
                                Solo pendientes de confirmar
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            className="bg-red-600 hover:bg-red-700"
                            disabled={searchLoading}
                        >
                            <Search className="h-4 w-4 mr-2" />
                            {searchLoading ? "Buscando..." : "Buscar"}
                        </Button>
                    </div>
                </form>

                {/* Resultados */}
                <div className="mt-4">
                    {searchError && (
                        <div className="mb-2 text-sm text-red-400">
                            {searchError}
                        </div>
                    )}

                    <div className="overflow-x-auto rounded-lg border border-red-700">
                        <table className="min-w-full text-sm text-white table-auto">
                            <thead className="bg-red-800 text-white">
                                <tr>
                                    <th className="px-4 py-2 text-left">
                                        No. documento
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        País
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Traslado de
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Traslado a
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Estado
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {searchLoading ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="text-center py-4 text-gray-300 italic"
                                        >
                                            Buscando documentos...
                                        </td>
                                    </tr>
                                ) : searchResults.length ? (
                                    searchResults.map((t) => (
                                        <tr
                                            key={t.id}
                                            onClick={() =>
                                                setSelectedResultId(t.id)
                                            }
                                            onDoubleClick={() => {
                                                setSelectedResultId(t.id);
                                                openConfirmForSelected();
                                            }}
                                            className={cn(
                                                "border-t border-red-700 cursor-pointer hover:bg-[#1b1b1b]",
                                                selectedResultId === t.id &&
                                                    "bg-red-900/60"
                                            )}
                                        >
                                            <td className="px-4 py-2">
                                                {t.number}
                                            </td>
                                            <td className="px-4 py-2">
                                                {t.country}
                                            </td>
                                            <td className="px-4 py-2">
                                                {t.from_city}
                                            </td>
                                            <td className="px-4 py-2">
                                                {t.to_city}
                                            </td>
                                            <td className="px-4 py-2">
                                                <span
                                                    className={cn(
                                                        "px-2 py-1 rounded text-xs font-semibold",
                                                        t.status === "PENDING"
                                                            ? "bg-yellow-900/30 text-yellow-400"
                                                            : "bg-green-900/30 text-green-400"
                                                    )}
                                                >
                                                    {t.status === "PENDING"
                                                        ? "PENDIENTE"
                                                        : "CONFIRMADO"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="text-center py-4 text-red-400"
                                        >
                                            No se encontraron traslados
                                            pendientes.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <Button
                            type="button"
                            variant="outline"
                            className="border-red-700 text-gray-200 hover:bg-red-700"
                            onClick={() => setShowSearchModal(false)}
                        >
                            Cerrar
                        </Button>
                        <Button
                            type="button"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={openConfirmForSelected}
                            disabled={!selectedResultId}
                            title="Confirmar traslado seleccionado"
                        >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Confirmar Llegada
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* MODAL: CONFIRMAR TRASLADO */}
            <ConfirmTransferModal
                isOpen={showConfirmModal}
                onClose={() => {
                    setShowConfirmModal(false);
                    setShowSearchModal(true);
                }}
                transferId={confirmTransferId}
                onSaved={handleConfirmationSaved}
            />
        </AuthenticatedLayout>
    );
}
