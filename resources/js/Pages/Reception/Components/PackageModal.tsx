// resources/js/Pages/Reception/Components/PackageModal.tsx
"use client";

import { useEffect, useState } from "react";
import { X, Plus, Minus, Check } from "lucide-react";
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
    declarado: string;
    asegurado: string;
}

interface PackageModalProps {
    open: boolean;
    initialRows?: PackageRow[];
    onClose: () => void;
    onSave: (rows: PackageRow[]) => void;
    artPackgOptions: {
        id: string;
        name: string;
        unit_price: number;
        unit_type: string;
    }[];
}

export default function PackageModal({
    open,
    initialRows,
    onClose,
    onSave,
}: PackageModalProps) {
    const [articles, setArticles] = useState<any[]>([]);
    const [rows, setRows] = useState<PackageRow[]>([]);

    useEffect(() => {
        if (!open) return;
        // cargar catálogo
        fetch("/art_packages/list/json")
            .then((r) => r.json())
            .then((data) => setArticles(data));

        // inicializar filas:
        if (initialRows && initialRows.length > 0) {
            setRows(initialRows);
        } else {
            setRows([
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
                    declarado: "0",
                    asegurado: "0",
                },
            ]);
        }
    }, [open, initialRows]);

    const updateRow = (
        index: number,
        field: keyof PackageRow,
        value: string | boolean
    ) => {
        setRows((prevRows) =>
            prevRows.map((row, i) => {
                if (i !== index) return row;

                // creamos una copia del row con el campo actualizado
                const updated = { ...row, [field]: value } as PackageRow;

                // si cambió cantidad / precio / descuento, recalc subtotal y total
                if (
                    field === "cantidad" ||
                    field === "unitario" ||
                    field === "descuento"
                ) {
                    const qty = parseFloat(updated.cantidad) || 0;
                    const price = parseFloat(updated.unitario) || 0;
                    const disc = parseFloat(updated.descuento) || 0;
                    updated.subtotal = (qty * price).toFixed(2);
                    updated.total = Math.max(0, qty * price - disc).toFixed(2);
                }

                return updated;
            })
        );
    };

    const handleArticleSelect = (index: number, id: string) => {
        const art = articles.find((a) => a.id === id);
        updateRow(index, "articulo_id", id);
        updateRow(index, "articulo", art?.translation || art?.name || "");
        updateRow(index, "unidad", art?.unit_type || "UND");
        updateRow(index, "unitario", art?.unit_price?.toString() || "0");
    };

    const addRow = () => {
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
                declarado: "0",
                asegurado: "0",
            },
        ]);
    };

    const removeRow = (idx: number) => {
        if (rows.length <= 1) return;
        setRows((r) => r.filter((_, i) => i !== idx));
    };

    const handleAccept = () => {
        onSave(rows);
        onClose();
    };

    return (
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
                            <Check className="w-4 h-4 mr-1" /> Aceptar
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="w-5 h-5 text-white" />
                        </Button>
                    </div>
                </div>

                <div className="p-4 overflow-auto h-full">
                    <table className="min-w-full text-xs text-left border-collapse">
                        <thead className="bg-[#2a2a3d] text-[10px] uppercase text-purple-300 tracking-wider sticky top-0 z-10">
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
                                    "V. Declarado",
                                    "V. Asegurado",
                                    "",
                                ].map((h, i) => (
                                    <th
                                        key={i}
                                        className="px-2 py-2 border-b border-purple-700 text-center whitespace-nowrap"
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
                                            className="h-7 text-center"
                                            value={row.cantidad}
                                            onChange={(e) =>
                                                updateRow(
                                                    i,
                                                    "cantidad",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </td>
                                    <td>
                                        <Input
                                            className="h-7 text-center bg-[#2a2a3d] opacity-80 cursor-not-allowed"
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
                                        >
                                            <SelectTrigger className="h-7 bg-[#2a2a3d] text-white">
                                                <SelectValue placeholder="Seleccionar" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#2a2a3d] text-white">
                                                {articles.map((a) => (
                                                    <SelectItem
                                                        key={a.id}
                                                        value={a.id}
                                                    >
                                                        {a.translation ||
                                                            a.name}
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
                                        />
                                    </td>
                                    {["largo", "ancho", "altura", "peso"].map(
                                        (f) => (
                                            <td key={f}>
                                                <Input
                                                    disabled={!row.volumen}
                                                    className="h-7 text-center"
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
                                        )
                                    )}
                                    <td>
                                        <Input
                                            disabled
                                            className="h-7 text-center opacity-50"
                                            value={row.unitario}
                                        />
                                    </td>
                                    <td className="text-center">{row.total}</td>
                                    <td>
                                        <Input
                                            className="h-7 text-center"
                                            value={row.declarado}
                                            onChange={(e) =>
                                                updateRow(
                                                    i,
                                                    "declarado",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </td>
                                    <td>
                                        <Input
                                            className="h-7 text-center"
                                            value={row.asegurado}
                                            onChange={(e) =>
                                                updateRow(
                                                    i,
                                                    "asegurado",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </td>
                                    <td className="flex flex-col items-center space-y-1">
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
                                            onClick={() => removeRow(i)}
                                        >
                                            <Minus className="w-4 h-4 text-red-400" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-[#1e1e2f] border-t border-purple-700">
                                <td colSpan={6}></td>
                                <td className="px-2 py-2 text-right text-purple-300 font-semibold">
                                    LIBRAS:
                                </td>
                                <td
                                    colSpan={1}
                                    className="px-2 py-2 text-right font-bold"
                                >
                                    {rows
                                        .reduce(
                                            (a, r) =>
                                                a + parseFloat(r.peso || "0"),
                                            0
                                        )
                                        .toFixed(2)}
                                </td>
                                <td className="px-2 py-2 text-right text-purple-300 font-semibold">
                                    KILOS:
                                </td>
                                <td className="px-2 py-2 text-right font-bold">
                                    {(
                                        rows.reduce(
                                            (a, r) =>
                                                a + parseFloat(r.peso || "0"),
                                            0
                                        ) / 2.20462
                                    ).toFixed(2)}
                                </td>
                                <td className="px-2 py-2 text-right text-purple-300 font-semibold">
                                    TOTAL:
                                </td>
                                <td className="px-2 py-2 text-right font-bold">
                                    {rows
                                        .reduce(
                                            (a, r) =>
                                                a + parseFloat(r.total || "0"),
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
    );
}
