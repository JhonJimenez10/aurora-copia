import { useForm } from "@inertiajs/react";
import { FormEvent } from "react";

interface ArtPackage {
    id?: string;
    name?: string;
    translation?: string;
    codigo_hs?: string;
    categoria?: string;
    codigo_fda?: string;
    unit_type?: string;
    unit_price?: number | string;
    agent_val?: number | string;
    arancel?: number | string;
    canceled?: boolean;
    active?: boolean;
}

interface Props {
    art_package?: ArtPackage;
}

const CATEGORIAS = ["NO ESPECIFICADA", "COMIDA", "COSMETICOS"];
const UNIT_TYPES = ["LIBRAS", "UNIDAD", "CAJA", "SOBRE"];

export default function ArtPackageForm({ art_package }: Props) {
    const { data, setData, post, put, processing, errors } = useForm({
        name: art_package?.name ?? "",
        translation: art_package?.translation ?? "",
        codigo_hs: art_package?.codigo_hs ?? "",
        // ✅ FIX: usar el valor de BD o 'NO ESPECIFICADA' por defecto
        categoria: art_package?.categoria ?? "NO ESPECIFICADA",
        codigo_fda: art_package?.codigo_fda ?? "",
        unit_type: art_package?.unit_type ?? "LIBRAS",
        unit_price: art_package?.unit_price ?? 5.0,
        agent_val: art_package?.agent_val ?? 0.0,
        arancel: art_package?.arancel ?? 30.0,
        canceled: art_package?.canceled ?? false,
        active: art_package?.active ?? true,
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (art_package?.id) {
            put(route("art_packages.update", art_package.id));
        } else {
            post(route("art_packages.store"));
        }
    };

    const inputClass =
        "w-full bg-gray-900 border border-red-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-red-500";
    const labelClass = "block text-sm font-medium text-gray-300 mb-1";
    const errorClass = "text-red-400 text-xs mt-1";

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-black border border-red-700 rounded-lg p-6 space-y-5"
        >
            {/* Nombre + Traducción */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className={labelClass}>Nombre</label>
                    <input
                        type="text"
                        value={data.name}
                        onChange={(e) =>
                            setData("name", e.target.value.toUpperCase())
                        }
                        className={inputClass}
                        required
                    />
                    {errors.name && <p className={errorClass}>{errors.name}</p>}
                </div>
                <div>
                    <label className={labelClass}>Traducción</label>
                    <input
                        type="text"
                        value={data.translation}
                        onChange={(e) => setData("translation", e.target.value)}
                        className={inputClass}
                    />
                    {errors.translation && (
                        <p className={errorClass}>{errors.translation}</p>
                    )}
                </div>
            </div>

            {/* Código HS + Categoría */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className={labelClass}>Código HS</label>
                    <input
                        type="text"
                        value={data.codigo_hs}
                        onChange={(e) => setData("codigo_hs", e.target.value)}
                        className={inputClass}
                    />
                    {errors.codigo_hs && (
                        <p className={errorClass}>{errors.codigo_hs}</p>
                    )}
                </div>
                <div>
                    <label className={labelClass}>Categoría</label>
                    {/* ✅ FIX: value={data.categoria} muestra correctamente el valor de la BD */}
                    <select
                        value={data.categoria}
                        onChange={(e) => setData("categoria", e.target.value)}
                        className={inputClass}
                    >
                        {CATEGORIAS.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                    {errors.categoria && (
                        <p className={errorClass}>{errors.categoria}</p>
                    )}
                </div>
            </div>

            {/* Código FDA + Tipo de Unidad */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className={labelClass}>Código FDA</label>
                    <input
                        type="text"
                        value={data.codigo_fda}
                        onChange={(e) => setData("codigo_fda", e.target.value)}
                        className={inputClass}
                    />
                    {errors.codigo_fda && (
                        <p className={errorClass}>{errors.codigo_fda}</p>
                    )}
                </div>
                <div>
                    <label className={labelClass}>Tipo de Unidad</label>
                    <select
                        value={data.unit_type}
                        onChange={(e) => setData("unit_type", e.target.value)}
                        className={inputClass}
                    >
                        {UNIT_TYPES.map((u) => (
                            <option key={u} value={u}>
                                {u}
                            </option>
                        ))}
                    </select>
                    {errors.unit_type && (
                        <p className={errorClass}>{errors.unit_type}</p>
                    )}
                </div>
            </div>

            {/* Precio por Unidad + Valor Agencia */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className={labelClass}>Precio por Unidad</label>
                    <input
                        type="number"
                        step="0.01"
                        value={data.unit_price}
                        onChange={(e) => setData("unit_price", e.target.value)}
                        className={inputClass}
                    />
                    {errors.unit_price && (
                        <p className={errorClass}>{errors.unit_price}</p>
                    )}
                </div>
                <div>
                    <label className={labelClass}>Valor Agencia</label>
                    <input
                        type="number"
                        step="0.01"
                        value={data.agent_val}
                        onChange={(e) => setData("agent_val", e.target.value)}
                        className={inputClass}
                    />
                    {errors.agent_val && (
                        <p className={errorClass}>{errors.agent_val}</p>
                    )}
                </div>
            </div>

            {/* Arancel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className={labelClass}>Arancel (%)</label>
                    <input
                        type="number"
                        step="0.01"
                        value={data.arancel}
                        onChange={(e) => setData("arancel", e.target.value)}
                        className={inputClass}
                    />
                    {errors.arancel && (
                        <p className={errorClass}>{errors.arancel}</p>
                    )}
                </div>
            </div>

            {/* Toggles */}
            <div className="flex gap-8">
                <label className="flex items-center gap-2 cursor-pointer">
                    <div
                        onClick={() => setData("canceled", !data.canceled)}
                        className={`w-10 h-6 rounded-full transition-colors ${data.canceled ? "bg-red-600" : "bg-gray-600"} relative`}
                    >
                        <span
                            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${data.canceled ? "left-5" : "left-1"}`}
                        />
                    </div>
                    <span className="text-sm text-gray-300">
                        Anulado por Agencia
                    </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                    <div
                        onClick={() => setData("active", !data.active)}
                        className={`w-10 h-6 rounded-full transition-colors ${data.active ? "bg-purple-600" : "bg-gray-600"} relative`}
                    >
                        <span
                            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${data.active ? "left-5" : "left-1"}`}
                        />
                    </div>
                    <span className="text-sm text-gray-300">Activo</span>
                </label>
            </div>

            {/* Botón */}
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={processing}
                    className="bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-black font-semibold px-6 py-2 rounded transition-colors"
                >
                    {processing
                        ? "Guardando..."
                        : art_package?.id
                          ? "Actualizar Artículo"
                          : "Crear Artículo"}
                </button>
            </div>
        </form>
    );
}
