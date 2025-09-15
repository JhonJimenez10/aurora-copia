// resources/js/Pages/Reception/Components/PackageModal.tsx
"use client";

import { useEffect, useState } from "react";
import { X, Plus, Minus, Check, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { Checkbox } from "@/Components/ui/checkbox";
import { Input } from "@/Components/ui/input";

export interface PackageRow {
    cantidad: string;
    unidad: string;
    articulo_id: string;
    articulo: string;
    volumen: boolean;
    largo: string;
    ancho: string;
    altura: string;
    peso: string;
    unitario: string;
    subtotal: string;
    descuento: string;
    total: string;
    items_decl: string;
    declarado: string;
    // asegurado: string;  OCULTADO (no se usa por ahora)
}

interface PackageModalProps {
    open: boolean;
    initialRows?: PackageRow[];
    onClose: () => void;
    onSave: (
        rows: PackageRow[],
        serviceType: string,
        perfumeDesc: string
    ) => void;
    artPackgOptions: {
        id: string;
        name: string;
        unit_price: number;
        unit_type: string;
    }[];
    readOnly?: boolean;
}

export default function PackageModal({
    open,
    initialRows,
    onClose,
    onSave,
    readOnly = false,
}: PackageModalProps) {
    const [articles, setArticles] = useState<any[]>([]);
    const [rows, setRows] = useState<PackageRow[]>([]);
    const [serviceType, setServiceType] = useState<string>("PAQUETE");
    const [perfumeDesc, setPerfumeDesc] = useState<string>("");
    const [showAlert, setShowAlert] = useState(false);

    useEffect(() => {
        if (!open) return;
        fetch("/art_packages/list/json")
            .then((r) => r.json())
            .then((data) => setArticles(data));
        setRows(
            initialRows && initialRows.length > 0
                ? initialRows
                : [
                      {
                          cantidad: "1",
                          unidad: "",
                          articulo_id: "",
                          articulo: "",
                          volumen: false,
                          largo: "0",
                          ancho: "0",
                          altura: "0",
                          peso: "0",
                          unitario: "0",
                          subtotal: "0",
                          descuento: "0",
                          total: "0",
                          items_decl: "0",
                          declarado: "0",
                          // asegurado: "0",// ❌ NO SE USA
                      },
                  ]
        );
    }, [open, initialRows]);

    const updateRow = (
        index: number,
        field: keyof PackageRow,
        value: string | boolean
    ) => {
        if (readOnly) return;
        setRows((prev) =>
            prev.map((row, i) => {
                if (i !== index) return row;
                const updated = { ...row, [field]: value } as PackageRow;
                const qty = parseFloat(updated.cantidad) || 0;
                const price = parseFloat(updated.unitario) || 0;
                const disc = parseFloat(updated.descuento) || 0;
                if (["cantidad", "unitario", "descuento"].includes(field)) {
                    updated.subtotal = (qty * price).toFixed(2);
                    updated.total = Math.max(0, qty * price - disc).toFixed(2);
                }
                updated.peso =
                    updated.unidad.toUpperCase() === "LIBRAS"
                        ? qty.toFixed(2)
                        : updated.unidad.toUpperCase() === "UNIDAD"
                        ? "0.22"
                        : "0";
                return updated;
            })
        );
    };

    const handleArticleSelect = (index: number, id: string) => {
        if (readOnly) return;
        const art = articles.find((a) => a.id === id);
        updateRow(index, "articulo_id", id);
        updateRow(index, "articulo", art?.name || "");
        updateRow(index, "unidad", art?.unit_type || "UND");
        updateRow(index, "unitario", art?.unit_price?.toString() || "0");
    };

    const addRow = () => {
        if (readOnly) return;
        setRows((r) => [
            ...r,
            {
                cantidad: "1",
                unidad: "",
                articulo_id: "",
                articulo: "",
                volumen: false,
                largo: "0",
                ancho: "0",
                altura: "0",
                peso: "0",
                unitario: "0",
                subtotal: "0",
                descuento: "0",
                total: "0",
                items_decl: "0",
                declarado: "0",
                // asegurado: "0", // ❌ QUITADO
            },
        ]);
    };
    const removeRow = (idx: number) => {
        if (readOnly) return;
        rows.length > 1 && setRows((r) => r.filter((_, i) => i !== idx));
    };
    const handleAccept = () => {
        if (readOnly) {
            onClose();
            return;
        }

        // ✅ VALIDACIÓN DE V. DECLARADO
        const hasInvalid = rows.some(
            (r) => !r.declarado || parseFloat(r.declarado) <= 0
        );

        if (hasInvalid) {
            setShowAlert(true); // Mostrar modal de alerta
            return;
        }

        onSave(rows, serviceType, perfumeDesc);
        onClose();
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="w-full max-w-[90vw] max-h-[90vh] mt-[5vh] p-0 bg-[#1e1e2f] text-white border border-purple-700 shadow-2xl">
                    <div className="flex justify-between items-center px-4 py-2 border-b border-purple-700 bg-[#1e1e2f] sticky top-0 z-10">
                        <DialogTitle className="text-lg font-bold text-purple-300">
                            ARTÍCULOS DEL PAQUETE
                        </DialogTitle>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="default"
                                size="sm"
                                onClick={handleAccept}
                            >
                                {readOnly ? (
                                    "Cerrar"
                                ) : (
                                    <>
                                        <Check className="w-4 h-4 mr-1" />{" "}
                                        Aceptar
                                    </>
                                )}
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                            >
                                <X className="w-5 h-5 text-white" />
                            </Button>
                        </div>
                    </div>

                    <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4 px-4">
                        <div className="max-w-[200px]">
                            <label className="text-sm font-semibold text-purple-300 mb-1 block">
                                Tipo de servicio
                            </label>
                            <Select
                                value={serviceType}
                                onValueChange={(v) => setServiceType(v)}
                                disabled={readOnly}
                            >
                                <SelectTrigger className="bg-[#2a2a3d] text-white h-8">
                                    <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#2a2a3d] text-white">
                                    {[
                                        "CARGA",
                                        "PAQUETE",
                                        "PERFUMERIA",
                                        "SOBRE",
                                    ].map((opt) => (
                                        <SelectItem key={opt} value={opt}>
                                            {opt}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {serviceType === "PERFUMERIA" && (
                            <div>
                                <label className="text-sm font-semibold text-purple-300 mb-1 block">
                                    Detalle de perfumería
                                </label>
                                <Input
                                    value={perfumeDesc}
                                    onChange={(e) =>
                                        setPerfumeDesc(e.target.value)
                                    }
                                    readOnly={readOnly}
                                    placeholder="Ingrese el detalle del perfume..."
                                    className="bg-[#2a2a3d] text-white h-8"
                                />
                            </div>
                        )}
                    </div>

                    <div className="p-2 overflow-auto h-[55vh]">
                        <table className="min-w-[900px] text-[11px] text-left border-collapse">
                            <thead className="bg-[#2a2a3d] text-[10px] uppercase text-purple-300 sticky top-0 z-10">
                                <tr>
                                    {[
                                        "Cantidad",
                                        "Unidad",
                                        "Artículo",
                                        "Volumen",
                                        "Largo",
                                        "Ancho",
                                        "Altura",
                                        "Peso",
                                        "P. Unitario",
                                        "Total",
                                        "Items Declarado",
                                        "V. Declarado",
                                        // "V. Asegurado", // ❌ OCULTADO
                                        "",
                                    ].map((h, i) => (
                                        <th
                                            key={i}
                                            className="px-1 py-1 border-b border-purple-700 text-center"
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, i) => (
                                    <tr
                                        key={i}
                                        className="border-t border-purple-800 even:bg-[#27273a] hover:bg-[#33334d]"
                                    >
                                        <td>
                                            <Input
                                                className="h-6 text-center text-[11px]"
                                                value={row.cantidad}
                                                onChange={(e) =>
                                                    updateRow(
                                                        i,
                                                        "cantidad",
                                                        e.target.value
                                                    )
                                                }
                                                readOnly={readOnly}
                                            />
                                        </td>
                                        <td>
                                            <Input
                                                className="h-6 text-center bg-[#2a2a3d] opacity-80 cursor-not-allowed text-[11px]"
                                                value={row.unidad}
                                                disabled
                                            />
                                        </td>
                                        <td>
                                            <Select
                                                value={row.articulo_id}
                                                onValueChange={(v) =>
                                                    handleArticleSelect(i, v)
                                                }
                                                disabled={readOnly}
                                            >
                                                <SelectTrigger className="h-6 bg-[#2a2a3d] text-white text-[11px]">
                                                    <SelectValue placeholder="Seleccionar" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-[#2a2a3d] text-white">
                                                    {articles.map((a) => (
                                                        <SelectItem
                                                            key={a.id}
                                                            value={a.id}
                                                        >
                                                            {a.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </td>
                                        <td>
                                            <Checkbox
                                                checked={row.volumen}
                                                onCheckedChange={(c) =>
                                                    updateRow(i, "volumen", !!c)
                                                }
                                                disabled={readOnly}
                                            />
                                        </td>
                                        {[
                                            "largo",
                                            "ancho",
                                            "altura",
                                            "peso",
                                        ].map((f) => (
                                            <td key={f}>
                                                <Input
                                                    disabled={
                                                        readOnly || !row.volumen
                                                    }
                                                    className="h-6 text-center text-[11px]"
                                                    value={
                                                        row[
                                                            f as keyof PackageRow
                                                        ] as string
                                                    }
                                                    onChange={(e) =>
                                                        updateRow(
                                                            i,
                                                            f as keyof PackageRow,
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </td>
                                        ))}
                                        <td>
                                            <Input
                                                disabled
                                                className="h-6 text-center opacity-50 text-[11px]"
                                                value={row.unitario}
                                            />
                                        </td>
                                        <td className="text-center">
                                            {row.total}
                                        </td>
                                        <td>
                                            <Input
                                                className="h-6 text-center text-[11px]"
                                                value={row.items_decl}
                                                onChange={(e) =>
                                                    updateRow(
                                                        i,
                                                        "items_decl",
                                                        e.target.value
                                                    )
                                                }
                                                readOnly={readOnly}
                                            />
                                        </td>
                                        <td>
                                            <Input
                                                className="h-6 text-center text-[11px]"
                                                value={row.declarado}
                                                onChange={(e) =>
                                                    updateRow(
                                                        i,
                                                        "declarado",
                                                        e.target.value
                                                    )
                                                }
                                                readOnly={readOnly}
                                            />
                                        </td>

                                        <td className="flex flex-col items-center space-y-1">
                                            {!readOnly && (
                                                <>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={addRow}
                                                    >
                                                        <Plus className="w-4 h-4 text-green-400" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            removeRow(i)
                                                        }
                                                    >
                                                        <Minus className="w-4 h-4 text-red-400" />
                                                    </Button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-[#1e1e2f] border-t border-purple-700">
                                    <td colSpan={6}></td>
                                    <td className="px-2 py-1 text-right text-purple-300 font-semibold">
                                        LIBRAS:
                                    </td>
                                    <td className="px-2 py-1 text-right font-bold">
                                        {rows
                                            .reduce(
                                                (a, r) =>
                                                    a +
                                                    parseFloat(r.peso || "0"),
                                                0
                                            )
                                            .toFixed(2)}
                                    </td>
                                    <td className="px-2 py-1 text-right text-purple-300 font-semibold">
                                        KILOS:
                                    </td>
                                    <td className="px-2 py-1 text-right font-bold">
                                        {(
                                            rows.reduce(
                                                (a, r) =>
                                                    a +
                                                    parseFloat(r.peso || "0"),
                                                0
                                            ) / 2.20462
                                        ).toFixed(2)}
                                    </td>
                                    <td className="px-2 py-1 text-right text-purple-300 font-semibold">
                                        TOTAL:
                                    </td>
                                    <td className="px-2 py-1 text-right font-bold">
                                        {rows
                                            .reduce(
                                                (a, r) =>
                                                    a +
                                                    parseFloat(r.total || "0"),
                                                0
                                            )
                                            .toFixed(2)}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </DialogContent>
            </Dialog>
            {/* ⚠️ MODAL DE ALERTA */}
            <Dialog open={showAlert} onOpenChange={() => setShowAlert(false)}>
                <DialogContent className="max-w-sm bg-[#1e1e2f] text-white border border-red-500">
                    <div className="flex flex-col items-center text-center">
                        <AlertTriangle className="text-red-400 w-10 h-10 mb-2" />
                        <DialogTitle className="text-lg font-bold text-red-400">
                            Atención
                        </DialogTitle>
                        <p className="text-sm text-gray-300">
                            El valor declarado debe ser mayor a cero.
                        </p>
                        <Button
                            className="mt-4 bg-red-500 hover:bg-red-600"
                            onClick={() => setShowAlert(false)}
                        >
                            Entendido
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
