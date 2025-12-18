import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import type { PageProps } from "@/types";
import { Button } from "@/Components/ui/button";
import {
    Search,
    FilePlus2,
    Plus,
    Pencil,
    LayoutGrid,
    X,
    ChevronRight,
    ChevronLeft,
    ChevronUp,
    ChevronDown,
} from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";
import type { FormEvent } from "react";
import { cn } from "@/lib/utils";

/** ---------------------
 * Tipos generales
 * --------------------- */
type TransfersPageProps = PageProps<{
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
 * Tipos para sacas y paquetes
 * --------------------- */
type SackPackage = {
    id: string;
    code: string;
    content: string;
    serviceType: string;
    pounds: number;
    kilograms: number;
};

type Sack = {
    number: number;
    refrigerated: boolean;
    seal: string;
    packages: SackPackage[];
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
};

/** ---------------------
 * MODAL: CREAR SACA (con búsqueda)
 * --------------------- */
type SackModalProps = {
    isOpen: boolean;
    onClose: () => void;
    sackNumber: number;
    onSave: (sack: Sack) => void;
    fromCity?: string;
};

function SackModal({
    isOpen,
    onClose,
    sackNumber,
    onSave,
    fromCity,
}: SackModalProps) {
    const [emittedPkgs, setEmittedPkgs] = useState<SackPackage[]>([]);
    const [sackPkgs, setSackPkgs] = useState<SackPackage[]>([]);
    const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
    const [selectedRightId, setSelectedRightId] = useState<string | null>(null);
    const [seal, setSeal] = useState("");
    const [refrigerated, setRefrigerated] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Estados de búsqueda
    const [searchLeft, setSearchLeft] = useState("");
    const [searchRight, setSearchRight] = useState("");
    const [allEmittedPkgs, setAllEmittedPkgs] = useState<SackPackage[]>([]);

    const loadPackages = useCallback(async () => {
        if (!fromCity) {
            setLoadError(
                "Selecciona primero el 'Trasladar de' en el documento para listar paquetes."
            );
            return;
        }

        setLoading(true);
        setLoadError(null);

        try {
            const res = await fetch(
                `/api/transfers/available-packages?from_city=${encodeURIComponent(
                    fromCity
                )}`
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: SackPackage[] = await res.json();
            setAllEmittedPkgs(data);
            setEmittedPkgs(data);
        } catch {
            setLoadError(
                "No se pudieron cargar los paquetes disponibles. Intenta nuevamente."
            );
        } finally {
            setLoading(false);
        }
    }, [fromCity]);

    useEffect(() => {
        if (!isOpen) return;

        setEmittedPkgs([]);
        setSackPkgs([]);
        setAllEmittedPkgs([]);
        setSelectedLeftId(null);
        setSelectedRightId(null);
        setSeal("");
        setRefrigerated(false);
        setLoadError(null);
        setSearchLeft("");
        setSearchRight("");

        loadPackages();
    }, [isOpen, loadPackages]);

    // Filtrar paquetes emitidos según búsqueda
    const filteredEmitted = useMemo(() => {
        if (!searchLeft.trim()) return emittedPkgs;

        const term = searchLeft.toLowerCase();
        return emittedPkgs.filter(
            (p) =>
                p.code.toLowerCase().includes(term) ||
                p.content.toLowerCase().includes(term) ||
                p.id.toLowerCase().includes(term)
        );
    }, [emittedPkgs, searchLeft]);

    // Filtrar paquetes en saca según búsqueda
    const filteredSack = useMemo(() => {
        if (!searchRight.trim()) return sackPkgs;

        const term = searchRight.toLowerCase();
        return sackPkgs.filter(
            (p) =>
                p.code.toLowerCase().includes(term) ||
                p.content.toLowerCase().includes(term) ||
                p.id.toLowerCase().includes(term)
        );
    }, [sackPkgs, searchRight]);

    const moveRight = () => {
        if (!selectedLeftId) return;
        const pkg = emittedPkgs.find((p) => p.id === selectedLeftId);
        if (!pkg) return;
        setEmittedPkgs((prev) => prev.filter((p) => p.id !== selectedLeftId));
        setSackPkgs((prev) => [...prev, pkg]);
        setSelectedLeftId(null);
    };

    const moveLeft = () => {
        if (!selectedRightId) return;
        const pkg = sackPkgs.find((p) => p.id === selectedRightId);
        if (!pkg) return;
        setSackPkgs((prev) => prev.filter((p) => p.id !== selectedRightId));
        setEmittedPkgs((prev) => [...prev, pkg]);
        setSelectedRightId(null);
    };

    const totalsLeft = useMemo(
        () => calculateTotals(filteredEmitted),
        [filteredEmitted]
    );
    const totalsRight = useMemo(
        () => calculateTotals(filteredSack),
        [filteredSack]
    );

    const handleSaveSack = () => {
        if (!sackPkgs.length) {
            alert("Agrega al menos un paquete a la saca.");
            return;
        }
        const sack: Sack = {
            number: sackNumber,
            refrigerated,
            seal,
            packages: sackPkgs,
        };
        onSave(sack);
        onClose();
    };

    return (
        <Modal title="Sacas traslado" isOpen={isOpen} onClose={onClose}>
            <div className="mb-4">
                <span className="text-sm text-gray-300">No. saca: </span>
                <span className="text-sm font-semibold text-white">
                    {sackNumber}
                </span>
            </div>

            {loadError && (
                <div className="mb-3 text-sm text-red-400">{loadError}</div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-[1.5fr_auto_1.5fr] gap-4">
                {/* Izquierda: emitidos */}
                <div>
                    <h3 className="text-sm text-gray-300 mb-2">
                        Buscar paquetes emitidos
                    </h3>

                    {/* Campo de búsqueda */}
                    <div className="mb-2">
                        <input
                            type="text"
                            value={searchLeft}
                            onChange={(e) => setSearchLeft(e.target.value)}
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
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={3}
                                            className="text-center py-3 text-gray-300 italic"
                                        >
                                            Cargando paquetes...
                                        </td>
                                    </tr>
                                ) : filteredEmitted.length ? (
                                    filteredEmitted.map((pkg) => (
                                        <tr
                                            key={pkg.id}
                                            onClick={() =>
                                                setSelectedLeftId(pkg.id)
                                            }
                                            className={cn(
                                                "border-t border-red-700 cursor-pointer hover:bg-[#1b1b1b]",
                                                selectedLeftId === pkg.id &&
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
                                            {searchLeft.trim()
                                                ? "No se encontraron paquetes con ese criterio."
                                                : "No hay paquetes disponibles."}
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
                                {totalsLeft.pieces}
                            </span>
                        </span>
                        <span>
                            LBS:{" "}
                            <span className="text-white font-semibold">
                                {totalsLeft.pounds.toFixed(2)}
                            </span>
                        </span>
                        <span>
                            KGS:{" "}
                            <span className="text-white font-semibold">
                                {totalsLeft.kilograms.toFixed(2)}
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
                        onClick={moveRight}
                        disabled={!selectedLeftId}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        size="icon"
                        className="bg-red-600 hover:bg-red-700"
                        onClick={moveLeft}
                        disabled={!selectedRightId}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </div>

                {/* Derecha: en saca */}
                <div>
                    <h3 className="text-sm text-gray-300 mb-2">
                        Buscar paquetes saca
                    </h3>

                    {/* Campo de búsqueda */}
                    <div className="mb-2">
                        <input
                            type="text"
                            value={searchRight}
                            onChange={(e) => setSearchRight(e.target.value)}
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
                                {filteredSack.length ? (
                                    filteredSack.map((pkg) => (
                                        <tr
                                            key={pkg.id}
                                            onClick={() =>
                                                setSelectedRightId(pkg.id)
                                            }
                                            className={cn(
                                                "border-t border-red-700 cursor-pointer hover:bg-[#1b1b1b]",
                                                selectedRightId === pkg.id &&
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
                                            {searchRight.trim()
                                                ? "No se encontraron paquetes con ese criterio."
                                                : "No hay paquetes en la saca."}
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
                                {totalsRight.pieces}
                            </span>
                        </span>
                        <span>
                            LBS:{" "}
                            <span className="text-white font-semibold">
                                {totalsRight.pounds.toFixed(2)}
                            </span>
                        </span>
                        <span>
                            KGS:{" "}
                            <span className="text-white font-semibold">
                                {totalsRight.kilograms.toFixed(2)}
                            </span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Inferior */}
            <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm text-gray-300">
                <div className="flex gap-6">
                    <span>
                        LIBRAS:{" "}
                        <span className="text-white font-semibold">
                            {calculateTotals(sackPkgs).pounds.toFixed(2)}
                        </span>
                    </span>
                    <span>
                        KILOS:{" "}
                        <span className="text-white font-semibold">
                            {calculateTotals(sackPkgs).kilograms.toFixed(2)}
                        </span>
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <span>Precinto</span>
                    <input
                        type="text"
                        value={seal}
                        onChange={(e) => setSeal(e.target.value)}
                        className="bg-[#111] border border-red-700 rounded px-3 py-1 text-sm text-white w-40"
                    />
                </div>

                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={refrigerated}
                        onChange={(e) => setRefrigerated(e.target.checked)}
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
                >
                    Cancelar
                </Button>
                <Button
                    type="button"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleSaveSack}
                >
                    Guardar saca
                </Button>
            </div>
        </Modal>
    );
}

/** ---------------------
 * MODAL: CONFIRMAR / MODIFICAR TRASLADO EXISTENTE
 * --------------------- */
type ConfirmTransferDetails = {
    id: number | string;
    number: string;
    to_city: string;
    sacks: Array<{
        number: number;
        seal: string | null;
        refrigerated: boolean;
        pending: SackPackage[];
        confirmed: SackPackage[];
    }>;
};

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
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data: ConfirmTransferDetails = await res.json();
                setDetails(data);
            } catch (e: any) {
                setError("No se pudo cargar el traslado seleccionado.");
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
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/transfers/${details.id}/sacks`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            if (onSaved) onSaved();
            onClose();
        } catch (e: any) {
            setError("No se pudo guardar la confirmación. Intenta nuevamente.");
        } finally {
            setLoading(false);
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
        <Modal
            title="Sacas confirmar traslado"
            isOpen={isOpen}
            onClose={onClose}
        >
            {loading && (
                <div className="text-sm text-gray-300 italic">Cargando...</div>
            )}
            {error && <div className="text-sm text-red-400 mb-3">{error}</div>}
            {!loading && !error && details && (
                <>
                    <div className="mb-3 flex items-center justify-between">
                        <div className="text-sm text-gray-300">
                            No. saca:{" "}
                            <span className="text-white font-semibold">
                                {current?.number ?? "—"}
                            </span>
                        </div>
                        {details.sacks.length > 1 && (
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    size="icon"
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={gotoPrev}
                                    title="Saca anterior"
                                >
                                    <ChevronUp className="h-4 w-4" />
                                </Button>
                                <Button
                                    type="button"
                                    size="icon"
                                    className="bg-red-600 hover:bg-red-700"
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
                                        {totalsConfirmed.kilograms.toFixed(2)}
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
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={saveAll}
                            disabled={loading}
                            title="Guardar (todas las sacas)"
                        >
                            Guardar
                        </Button>
                    </div>
                </>
            )}
        </Modal>
    );
}

/** ---------------------
 * PANTALLA PRINCIPAL
 * --------------------- */
export default function TransfersCreate({
    countries: countriesProp,
    agencies: agenciesProp,
}: TransfersPageProps) {
    const countries = countriesProp?.length ? countriesProp : ["ECUADOR"];
    const agencies = agenciesProp ?? [];

    const [showSearchModal, setShowSearchModal] = useState(false);
    const [showSackModal, setShowSackModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmTransferId, setConfirmTransferId] = useState<
        number | string | null
    >(null);

    const [submitting, setSubmitting] = useState(false);

    const [doc, setDoc] = useState<{
        number: string;
        country: string;
        from_city: string;
        to_city: string;
    }>({
        number: "",
        country: countries[0] ?? "ECUADOR",
        from_city: agencies[0] ?? "",
        to_city: agencies[0] ?? "",
    });

    const [sacks, setSacks] = useState<Sack[]>([]);
    const [nextSackNumber, setNextSackNumber] = useState(1);

    const [searchFilters, setSearchFilters] = useState<TransferSearchFilters>(
        () => ({
            startDate: "",
            endDate: "",
            country: countries[0] ?? "ECUADOR",
            fromCity: "[TODOS]",
            toCity: agencies[0] ?? "",
            onlyPending: false,
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

    const handleSackSaved = (sack: Sack) => {
        setSacks((prev) => [...prev, sack]);
        setNextSackNumber((prev) => prev + 1);
    };

    const overallTotals = sacks.reduce(
        (acc, sack) => {
            const t = calculateTotals(sack.packages);
            acc.sacks += 1;
            acc.pounds += t.pounds;
            acc.kilograms += t.kilograms;
            return acc;
        },
        { sacks: 0, pounds: 0, kilograms: 0 }
    );

    const canAddSack = Boolean(doc.from_city && doc.to_city);

    const handleNewTransfer = () => {
        setDoc({
            number: "",
            country: countries[0] ?? "ECUADOR",
            from_city: agencies[0] ?? "",
            to_city: agencies[0] ?? "",
        });
        setSacks([]);
        setNextSackNumber(1);
    };

    const submitTransfer = () => {
        if (!canAddSack || !sacks.length) {
            alert(
                "Completa la cabecera (origen/destino) y agrega al menos una saca."
            );
            return;
        }
        const payload = {
            number: doc.number.trim() === "" ? null : doc.number.trim(),
            country: doc.country,
            from_city: doc.from_city,
            to_city: doc.to_city,
            sacks: sacks.map((s) => ({
                number: s.number,
                refrigerated: s.refrigerated,
                seal: s.seal || null,
                packages: s.packages.map((p) => ({
                    id: p.id,
                    pounds: p.pounds,
                    kilograms: p.kilograms,
                })),
            })),
        };
        setSubmitting(true);
        router.post("/transfers", payload, {
            onSuccess: () => {
                handleNewTransfer();
                setShowSuccessModal(true);
            },
            onFinish: () => setSubmitting(false),
        });
    };

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
                    "No se encontraron documentos con esos filtros."
                );
        } catch {
            setSearchError(
                "Ocurrió un error al buscar los traslados. Intenta nuevamente."
            );
        } finally {
            setSearchLoading(false);
        }
    };

    const handleUseSelectedTransfer = () => {
        if (!selectedResultId) return;
        const found = searchResults.find((t) => t.id === selectedResultId);
        if (!found) return;

        setDoc({
            number: found.number,
            country: found.country,
            from_city: found.from_city,
            to_city: found.to_city,
        });

        setSacks([]);
        setNextSackNumber(1);
        setShowSearchModal(false);
    };

    const openConfirmForSelected = () => {
        if (!selectedResultId) return;
        setConfirmTransferId(selectedResultId);
        setShowConfirmModal(true);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Elaborar Traslado" />

            <div className="container mx-auto px-4 py-8">
                <div className="bg-gradient-to-r from-red-700 via-red-600 to-yellow-400 text-white px-6 py-4 rounded-t-lg">
                    <h1 className="text-2xl font-bold">Elaborar Traslado</h1>
                    <p className="text-white text-sm">
                        Gestión de traslados entre agencias
                    </p>
                </div>

                <div className="bg-black border border-red-700 px-6 py-4 rounded-b-lg shadow-md">
                    {/* Cabecera */}
                    <div className="flex items-start justify-between mb-6 gap-4">
                        <div className="flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div className="flex flex-col">
                                    <label className="text-sm text-gray-300 mb-1">
                                        Número
                                    </label>
                                    <input
                                        type="text"
                                        value={doc.number}
                                        onChange={(e) =>
                                            setDoc((d) => ({
                                                ...d,
                                                number: e.target.value,
                                            }))
                                        }
                                        placeholder="Autogenerado si lo dejas vacío"
                                        className="bg-[#111] border border-red-700 rounded px-3 py-2 text-sm text-white"
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <label className="text-sm text-gray-300 mb-1">
                                        País
                                    </label>
                                    <select
                                        value={doc.country}
                                        onChange={(e) =>
                                            setDoc((d) => ({
                                                ...d,
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
                                        Trasladar de
                                    </label>
                                    <select
                                        value={doc.from_city}
                                        onChange={(e) =>
                                            setDoc((d) => ({
                                                ...d,
                                                from_city: e.target.value,
                                            }))
                                        }
                                        className="bg-[#111] border border-red-700 rounded px-3 py-2 text-sm text-white"
                                    >
                                        {agencies.map((a) => (
                                            <option key={a} value={a}>
                                                {a}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex flex-col">
                                    <label className="text-sm text-gray-300 mb-1">
                                        Trasladar a
                                    </label>
                                    <select
                                        value={doc.to_city}
                                        onChange={(e) =>
                                            setDoc((d) => ({
                                                ...d,
                                                to_city: e.target.value,
                                            }))
                                        }
                                        className="bg-[#111] border border-red-700 rounded px-3 py-2 text-sm text-white"
                                    >
                                        {agencies.map((a) => (
                                            <option key={a} value={a}>
                                                {a}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setShowSearchModal(true)}
                                    className="border-red-600 bg-black hover:bg-red-700"
                                >
                                    <Search className="h-4 w-4 text-white" />
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="border-red-600 bg-black hover:bg-red-700"
                                    disabled
                                >
                                    <Pencil className="h-4 w-4 text-gray-500" />
                                </Button>
                            </div>
                        </div>

                        <div className="text-right min-w-[220px]">
                            <span className="block text-sm text-gray-300">
                                Trasladar a:
                            </span>
                            <span className="text-sm text-gray-200 font-semibold">
                                {doc.to_city || "—"}
                            </span>
                        </div>
                    </div>

                    {/* Tabla sacas */}
                    <div className="flex gap-4">
                        <div className="flex-1 overflow-x-auto rounded-lg border border-red-700">
                            <table className="min-w-full text-sm text-white table-auto">
                                <thead className="bg-red-800 text-white">
                                    <tr>
                                        <th className="px-4 py-2 text-left">
                                            No. saca
                                        </th>
                                        <th className="px-4 py-2 text-left">
                                            Agencia destino
                                        </th>
                                        <th className="px-4 py-2 text-right">
                                            Piezas
                                        </th>
                                        <th className="px-4 py-2 text-right">
                                            LBS
                                        </th>
                                        <th className="px-4 py-2 text-right">
                                            KGS
                                        </th>
                                        <th className="px-4 py-2 text-left">
                                            Precinto
                                        </th>
                                        <th className="px-4 py-2 text-left">
                                            Refrigerada
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sacks.length ? (
                                        sacks.map((sack) => {
                                            const totals = calculateTotals(
                                                sack.packages
                                            );
                                            return (
                                                <tr
                                                    key={sack.number}
                                                    className="border-t border-red-700 hover:bg-[#1b1b1b]"
                                                >
                                                    <td className="px-4 py-2">
                                                        {sack.number}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        {doc.to_city || "—"}
                                                    </td>
                                                    <td className="px-4 py-2 text-right">
                                                        {totals.pieces}
                                                    </td>
                                                    <td className="px-4 py-2 text-right">
                                                        {totals.pounds.toFixed(
                                                            2
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2 text-right">
                                                        {totals.kilograms.toFixed(
                                                            2
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        {sack.seal || "—"}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        {sack.refrigerated
                                                            ? "Sí"
                                                            : "No"}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="text-center py-6 text-red-400"
                                            >
                                                No hay sacas agregadas al
                                                traslado.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Button
                                type="button"
                                size="icon"
                                className={cn(
                                    "bg-green-600 hover:bg-green-700",
                                    !canAddSack &&
                                        "opacity-60 cursor-not-allowed"
                                )}
                                onClick={() => setShowSackModal(true)}
                                disabled={!canAddSack}
                                title={
                                    canAddSack
                                        ? "Agregar saca"
                                        : "Completa 'Trasladar de' y 'Trasladar a' para agregar sacas"
                                }
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                                type="button"
                                size="icon"
                                className="bg-yellow-500 hover:bg-yellow-600"
                                disabled
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                                type="button"
                                size="icon"
                                className="bg-red-600 hover:bg-red-700"
                                disabled
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Totales y guardar */}
                    <div className="mt-4 border-t border-red-700 pt-3 text-sm text-gray-300 flex flex-wrap gap-4 justify-between">
                        <span>
                            SACAS:{" "}
                            <span className="font-semibold text-white">
                                {overallTotals.sacks}
                            </span>
                        </span>
                        <span>
                            LIBRAS:{" "}
                            <span className="font-semibold text-white">
                                {overallTotals.pounds.toFixed(2)}
                            </span>
                        </span>
                        <span>
                            KILOS:{" "}
                            <span className="font-semibold text-white">
                                {overallTotals.kilograms.toFixed(2)}
                            </span>
                        </span>

                        <div className="ml-auto">
                            <Button
                                type="button"
                                className="bg-red-600 hover:bg-red-700"
                                onClick={submitTransfer}
                                disabled={submitting}
                            >
                                {submitting
                                    ? "Guardando..."
                                    : "Guardar traslado"}
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
                                </tr>
                            </thead>
                            <tbody>
                                {searchLoading ? (
                                    <tr>
                                        <td
                                            colSpan={4}
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
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="text-center py-4 text-red-400"
                                        >
                                            No se encontraron documentos.
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
                            className="bg-yellow-600 hover:bg-yellow-700"
                            onClick={openConfirmForSelected}
                            disabled={!selectedResultId}
                            title="Ver / Modificar"
                        >
                            Ver / Modificar
                        </Button>
                        <Button
                            type="button"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={handleUseSelectedTransfer}
                            disabled={!selectedResultId}
                        >
                            Usar documento
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* MODAL: OK */}
            <Modal
                title="Traslado registrado"
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
            >
                <div className="space-y-4 text-sm text-gray-200">
                    <p>El traslado se registró correctamente.</p>
                    <p>
                        Ahora espera la confirmación de llegada en la agencia
                        destino.
                    </p>
                    <div className="flex justify-end">
                        <Button
                            type="button"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => setShowSuccessModal(false)}
                        >
                            Aceptar
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* MODALES */}
            <SackModal
                isOpen={showSackModal}
                onClose={() => setShowSackModal(false)}
                sackNumber={nextSackNumber}
                onSave={handleSackSaved}
                fromCity={doc.from_city}
            />

            <ConfirmTransferModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                transferId={confirmTransferId}
                onSaved={() => {}}
            />
        </AuthenticatedLayout>
    );
}
