import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageProps } from "@/types";
import { useEffect, useState } from "react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/Components/ui/select";
import Pagination from "@/Components/Pagination";
import { useDebouncedValue } from "@/Hooks/useDebouncedValue";

interface ArtPackage {
    id: string;
    name: string;
    translation: string;
    codigo_hs: string;
    categoria: string;
    codigo_fda: string;
    unit_type: string;
    unit_price: string;
    agent_val: string;
    arancel: string;
    canceled: boolean;
    active: boolean;
}

interface Filters {
    search: string;
    categoria: string;
    status: string;
}

const CATEGORIAS = [
    "Alimentos",
    "Cosméticos",
    "Medicamentos",
    "Dispositivos Médicos",
    "Suplementos",
    "Otros",
];

export default function ArtPackagesIndex({
    art_packages,
    pagination,
    filters,
}: PageProps<{
    art_packages: ArtPackage[];
    pagination: any;
    filters: Filters;
}>) {
    const [search, setSearch] = useState(filters?.search ?? "");
    const [categoria, setCategoria] = useState(filters?.categoria ?? "");
    const [status, setStatus] = useState(filters?.status ?? "");
    const [loading, setLoading] = useState(false);

    const debouncedSearch = useDebouncedValue(search, 400);

    useEffect(() => {
        setLoading(true);
        router.get(
            "/art_packages",
            {
                search: debouncedSearch || undefined,
                categoria: categoria || undefined,
                status: status || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onFinish: () => setLoading(false),
            },
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, categoria, status]);

    const clearFilters = () => {
        setSearch("");
        setCategoria("");
        setStatus("");
    };

    const hasActiveFilters = search !== "" || categoria !== "" || status !== "";

    return (
        <AuthenticatedLayout>
            <Head title="Artículos por Agencia" />

            <div className="container mx-auto px-4 py-8">
                <div className="bg-gradient-to-r from-red-700 via-red-600 to-yellow-500 text-white px-6 py-4 rounded-t-lg">
                    <h1 className="text-2xl font-bold">
                        Artículos por Agencia
                    </h1>
                    <p className="text-red-100 text-sm">
                        Catálogo de artículos utilizados por cada agencia
                    </p>
                </div>

                <div className="bg-black border border-red-700 px-6 py-4 rounded-b-lg shadow-md">
                    <div className="flex justify-end mb-4">
                        <Link href="/art_packages/create">
                            <Button className="bg-green-600 hover:bg-green-700">
                                + Nuevo Artículo
                            </Button>
                        </Link>
                    </div>

                    {/* Barra de filtros */}
                    <div className="bg-[#1b1b1b] border border-red-700 rounded-lg p-4 mb-4 flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-[220px]">
                            <label className="text-xs text-gray-300 block mb-1">
                                Buscar (nombre, traducción, código HS/FDA)
                            </label>
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Ej: café, K123456..."
                                className="bg-black border border-red-700 text-white"
                            />
                        </div>

                        <div className="min-w-[200px]">
                            <label className="text-xs text-gray-300 block mb-1">
                                Categoría
                            </label>
                            <Select
                                value={categoria || "all"}
                                onValueChange={(val) =>
                                    setCategoria(val === "all" ? "" : val)
                                }
                            >
                                <SelectTrigger className="bg-black border border-red-700 text-white">
                                    <SelectValue placeholder="Todas" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1b1b1b] text-white border border-red-700">
                                    <SelectItem value="all">Todas</SelectItem>
                                    {CATEGORIAS.map((cat) => (
                                        <SelectItem key={cat} value={cat}>
                                            {cat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="min-w-[180px]">
                            <label className="text-xs text-gray-300 block mb-1">
                                Estado
                            </label>
                            <Select
                                value={status || "all"}
                                onValueChange={(val) =>
                                    setStatus(val === "all" ? "" : val)
                                }
                            >
                                <SelectTrigger className="bg-black border border-red-700 text-white">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1b1b1b] text-white border border-red-700">
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="active">
                                        Activos
                                    </SelectItem>
                                    <SelectItem value="inactive">
                                        Inactivos
                                    </SelectItem>
                                    <SelectItem value="canceled">
                                        Anulados
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {hasActiveFilters && (
                            <Button
                                type="button"
                                onClick={clearFilters}
                                className="bg-gray-700 hover:bg-gray-600 text-white"
                            >
                                Limpiar filtros
                            </Button>
                        )}

                        {loading && (
                            <span className="text-xs text-gray-400">
                                Buscando...
                            </span>
                        )}
                    </div>

                    <Pagination pagination={pagination} />

                    <div className="overflow-x-auto rounded-lg border border-red-700">
                        <table className="min-w-full text-sm text-white table-auto">
                            <thead className="bg-red-800">
                                <tr>
                                    <th className="px-4 py-2 text-left">
                                        Nombre
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Traducción
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Categoría
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Código FDA
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Unidad
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Precio Unidad
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Valor Agencia
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Arancel
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Anulado
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {art_packages.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="border-t border-red-700 hover:bg-[#1b1b1b]"
                                    >
                                        <td className="px-4 py-2">
                                            {item.name}
                                        </td>
                                        <td className="px-4 py-2">
                                            {item.translation}
                                        </td>
                                        <td className="px-4 py-2">
                                            {item.categoria || "-"}
                                        </td>
                                        <td className="px-4 py-2">
                                            {item.codigo_fda || "-"}
                                        </td>
                                        <td className="px-4 py-2">
                                            {item.unit_type}
                                        </td>
                                        <td className="px-4 py-2">
                                            ${item.unit_price}
                                        </td>
                                        <td className="px-4 py-2">
                                            ${item.agent_val}
                                        </td>
                                        <td className="px-4 py-2">
                                            {item.arancel
                                                ? `%${item.arancel}`
                                                : "-"}
                                        </td>
                                        <td className="px-4 py-2">
                                            {item.canceled ? "Sí" : "No"}
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="flex flex-wrap gap-2">
                                                <Link
                                                    href={`/art_packages/${item.id}/edit`}
                                                >
                                                    <Button className="bg-red-600 hover:bg-red-700 text-white h-7 px-3 text-xs">
                                                        Editar
                                                    </Button>
                                                </Link>
                                                <Button
                                                    onClick={() => {
                                                        if (
                                                            confirm(
                                                                "¿Estás seguro de que deseas eliminar este artículo?",
                                                            )
                                                        ) {
                                                            router.delete(
                                                                `/art_packages/${item.id}`,
                                                                {
                                                                    preserveScroll: true,
                                                                },
                                                            );
                                                        }
                                                    }}
                                                    className="bg-red-600 hover:bg-red-800 text-white h-7 px-3 text-xs"
                                                >
                                                    Eliminar
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!art_packages.length && (
                                    <tr>
                                        <td
                                            colSpan={10}
                                            className="text-center py-4 text-slate-400"
                                        >
                                            {hasActiveFilters
                                                ? "No se encontraron artículos con esos filtros."
                                                : "No hay artículos registrados."}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4">
                        <Pagination pagination={pagination} />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
