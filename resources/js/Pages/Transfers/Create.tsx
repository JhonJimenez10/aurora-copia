import { Head } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageProps } from "@/types";
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
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Props = PageProps<{}>;

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
            <div className="bg-black border border-red-700 rounded-lg w-full max-w-5xl shadow-lg">
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

// ---------------------
// Tipos para sacas y paquetes
// ---------------------
type SackPackage = {
    id: string;
    code: string;
    content: string;
    serviceType: string;
    pounds: number;
    kilograms: number;
};

type Sack = {
    number: number; // No. saca
    refrigerated: boolean;
    seal: string;
    packages: SackPackage[];
};

// Datos de ejemplo (luego vendrán del backend)
const mockPackages: SackPackage[] = [
    {
        id: "1",
        code: "AZCU44300.1",
        content: "3.7 LBS. PONCHOS O CHALINAS",
        serviceType: "PAQUETE",
        pounds: 3.7,
        kilograms: 1.68,
    },
    {
        id: "2",
        code: "AZCU44601.1",
        content: "1 LBS. ZAPATOS",
        serviceType: "PAQUETE",
        pounds: 1.0,
        kilograms: 0.45,
    },
    {
        id: "3",
        code: "AZCU44991.1",
        content: "2.5 LBS. PERFUMES POR LIBRAS",
        serviceType: "PERFUMERIA",
        pounds: 2.5,
        kilograms: 1.13,
    },
];

// Helper para totales
function calculateTotals(packages: SackPackage[]) {
    const pieces = packages.length;
    const pounds = packages.reduce((sum, p) => sum + p.pounds, 0);
    const kilograms = packages.reduce((sum, p) => sum + p.kilograms, 0);
    return { pieces, pounds, kilograms };
}

// ---------------------
// Modal SACAS TRASLADO
// ---------------------
type SackModalProps = {
    isOpen: boolean;
    onClose: () => void;
    sackNumber: number;
    onSave: (sack: Sack) => void;
};

function SackModal({ isOpen, onClose, sackNumber, onSave }: SackModalProps) {
    const [emittedPkgs, setEmittedPkgs] = useState<SackPackage[]>([]);
    const [sackPkgs, setSackPkgs] = useState<SackPackage[]>([]);
    const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
    const [selectedRightId, setSelectedRightId] = useState<string | null>(null);
    const [seal, setSeal] = useState("");
    const [refrigerated, setRefrigerated] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Cuando se abre el modal reiniciamos estados
            setEmittedPkgs(mockPackages);
            setSackPkgs([]);
            setSelectedLeftId(null);
            setSelectedRightId(null);
            setSeal("");
            setRefrigerated(false);
        }
    }, [isOpen]);

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

    const totalsLeft = calculateTotals(emittedPkgs);
    const totalsRight = calculateTotals(sackPkgs);

    const handleSaveSack = () => {
        // Más adelante aquí podemos validar que tenga al menos 1 paquete
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

            <div className="grid grid-cols-1 md:grid-cols-[1.5fr_auto_1.5fr] gap-4">
                {/* Lista izquierda: paquetes emitidos */}
                <div>
                    <h3 className="text-sm text-gray-300 mb-2">
                        Buscar paquetes emitidos
                    </h3>
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
                                {emittedPkgs.map((pkg) => (
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
                                ))}
                                {!emittedPkgs.length && (
                                    <tr>
                                        <td
                                            colSpan={3}
                                            className="text-center py-3 text-red-400"
                                        >
                                            No hay paquetes disponibles.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Totales izquierda */}
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

                {/* Botones de flechas */}
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

                {/* Lista derecha: paquetes de la saca */}
                <div>
                    <h3 className="text-sm text-gray-300 mb-2">
                        Buscar paquetes saca
                    </h3>
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
                                {sackPkgs.map((pkg) => (
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
                                ))}
                                {!sackPkgs.length && (
                                    <tr>
                                        <td
                                            colSpan={3}
                                            className="text-center py-3 text-red-400"
                                        >
                                            No hay paquetes en la saca.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Totales derecha */}
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

            {/* Zona inferior: libras/kilos, precinto y refrigerada */}
            <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm text-gray-300">
                <div className="flex gap-6">
                    <span>
                        LIBRAS:{" "}
                        <span className="text-white font-semibold">
                            {totalsRight.pounds.toFixed(2)}
                        </span>
                    </span>
                    <span>
                        KILOS:{" "}
                        <span className="text-white font-semibold">
                            {totalsRight.kilograms.toFixed(2)}
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

            {/* Botones guardar / cancelar */}
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

// ---------------------
// PANTALLA PRINCIPAL ELABORAR TRASLADO
// ---------------------
export default function TransfersCreate({}: Props) {
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [showNewDocModal, setShowNewDocModal] = useState(false);
    const [showSackModal, setShowSackModal] = useState(false);

    // listado de sacas del traslado
    const [sacks, setSacks] = useState<Sack[]>([]);
    const [nextSackNumber, setNextSackNumber] = useState(1);

    // Por ahora son solo valores de ejemplo. Luego los cargaremos desde backend.
    const countries = ["ECUADOR", "USA"];
    const agencies = ["CUENCA CENTRO", "QUITO", "GUAYAQUIL"];

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

    return (
        <AuthenticatedLayout>
            <Head title="Elaborar Traslado" />

            <div className="container mx-auto px-4 py-8">
                {/* Header tipo AgencyDest */}
                <div className="bg-gradient-to-r from-red-700 via-red-600 to-yellow-400 text-white px-6 py-4 rounded-t-lg">
                    <h1 className="text-2xl font-bold">Elaborar Traslado</h1>
                    <p className="text-white text-sm">
                        Gestión de traslados entre agencias destino
                    </p>
                </div>

                {/* Contenido principal */}
                <div className="bg-black border border-red-700 px-6 py-4 rounded-b-lg shadow-md">
                    {/* Línea: Documento de traslado */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-300">
                                    Documento de traslado
                                </span>
                                {/* Aquí luego mostraremos el número seleccionado */}
                                <span className="text-sm text-gray-400 italic">
                                    (sin documento seleccionado)
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Botón buscar (lupa) */}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setShowSearchModal(true)}
                                    className="border-red-600 bg-black hover:bg-red-700"
                                >
                                    <Search className="h-4 w-4 text-white" />
                                </Button>

                                {/* Botón nuevo documento */}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setShowNewDocModal(true)}
                                    className="border-red-600 bg-black hover:bg-red-700"
                                >
                                    <FilePlus2 className="h-4 w-4 text-white" />
                                </Button>

                                {/* Botón editar documento (placeholder para futuro) */}
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

                        {/* Info "Trasladar a" como en la primera pantalla */}
                        <div className="text-right">
                            <span className="block text-sm text-gray-300">
                                Trasladar a:
                            </span>
                            <span className="text-sm text-gray-400 italic">
                                (se definirá según el documento de traslado)
                            </span>
                        </div>
                    </div>

                    {/* Tabla principal (No. saca...) */}
                    <div className="flex gap-4">
                        <div className="flex-1 overflow-x-auto rounded-lg border border-red-700">
                            <table className="min-w-full text-sm text-white table-auto">
                                <thead className="bg-red-800 text-white">
                                    <tr>
                                        <th className="px-4 py-2 text-left">
                                            No. saca
                                        </th>
                                        <th className="px-4 py-2 text-left">
                                            Agencias destino
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
                                                        {/* Luego usaremos la agencia real */}
                                                        —
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

                        {/* Botones verticales ( + , editar, detalle ) */}
                        <div className="flex flex-col gap-2">
                            <Button
                                type="button"
                                size="icon"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => setShowSackModal(true)}
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

                    {/* Barra de totales inferior (SACAS / LIBRAS / KILOS) */}
                    <div className="mt-4 border-t border-red-700 pt-3 text-sm text-gray-300 flex justify-between">
                        <span>
                            SACAS:{" "}
                            <span className="font-semibold text-white">
                                {overallTotals.sacks}
                            </span>
                        </span>
                        <span>
                            LIBRAS:{" "}
                            <span
                                className="font-semibold text
                                white"
                            >
                                {overallTotals.pounds.toFixed(2)}
                            </span>
                        </span>
                        <span>
                            KILOS:{" "}
                            <span className="font-semibold text-white">
                                {overallTotals.kilograms.toFixed(2)}
                            </span>
                        </span>
                    </div>
                </div>
            </div>

            {/* MODAL 1: BUSCAR DOCUMENTOS TRASLADO */}
            <Modal
                title="Buscar documentos traslado"
                isOpen={showSearchModal}
                onClose={() => setShowSearchModal(false)}
            >
                <form className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <label className="text-sm text-gray-300 mb-1">
                                Fecha inicio
                            </label>
                            <input
                                type="date"
                                className="bg-[#111] border border-red-700 rounded px-3 py-2 text-sm text-white"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm text-gray-300 mb-1">
                                Fecha final
                            </label>
                            <input
                                type="date"
                                className="bg-[#111] border border-red-700 rounded px-3 py-2 text-sm text-white"
                            />
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm text-gray-300 mb-1">
                                País
                            </label>
                            <select className="bg-[#111] border border-red-700 rounded px-3 py-2 text-sm text-white">
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
                            <select className="bg-[#111] border border-red-700 rounded px-3 py-2 text-sm text-white">
                                <option value="TODOS">[TODOS]</option>
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
                            <select className="bg-[#111] border border-red-700 rounded px-3 py-2 text-sm text-white">
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
                            type="button"
                            className="bg-red-600 hover:bg-red-700"
                        >
                            <Search className="h-4 w-4 mr-2" />
                            Buscar
                        </Button>
                    </div>

                    <div className="mt-4">
                        <h3 className="text-sm text-gray-300 mb-2">
                            Datos para la búsqueda
                        </h3>
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
                                    {/* Por ahora vacío */}
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="text-center py-4 text-red-400"
                                        >
                                            No se encontraron documentos.
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* MODAL 2: NUEVO DOCUMENTO DE TRASLADO */}
            <Modal
                title="Documentos traslado"
                isOpen={showNewDocModal}
                onClose={() => setShowNewDocModal(false)}
            >
                <form className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <label className="text-sm text-gray-300 mb-1">
                                Número
                            </label>
                            <input
                                type="text"
                                placeholder="Autogenerado o manual"
                                className="bg-[#111] border border-red-700 rounded px-3 py-2 text-sm text-white"
                            />
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm text-gray-300 mb-1">
                                País
                            </label>
                            <select className="bg-[#111] border border-red-700 rounded px-3 py-2 text-sm text-white">
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
                            <select className="bg-[#111] border border-red-700 rounded px-3 py-2 text-sm text-white">
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
                            <select className="bg-[#111] border border-red-700 rounded px-3 py-2 text-sm text-white">
                                {agencies.map((a) => (
                                    <option key={a} value={a}>
                                        {a}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <Button
                            type="button"
                            variant="outline"
                            className="border-red-700 text-gray-200 hover:bg-red-700"
                            onClick={() => setShowNewDocModal(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            className="bg-green-600 hover:bg-green-700"
                        >
                            Guardar documento
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* MODAL 3: SACAS TRASLADO */}
            <SackModal
                isOpen={showSackModal}
                onClose={() => setShowSackModal(false)}
                sackNumber={nextSackNumber}
                onSave={handleSackSaved}
            />
        </AuthenticatedLayout>
    );
}
