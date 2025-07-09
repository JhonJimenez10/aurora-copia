import { Head, useForm, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Button } from "@/Components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { useState } from "react";
import type { PageProps } from "@/types";

interface BulkImportPageProps extends PageProps {
    type:
        | "senders"
        | "recipients"
        | "art_packages"
        | "art_packgs"
        | "agencies_dest";
}

const MODULE_NAMES: Record<BulkImportPageProps["type"], string> = {
    senders: "Remitentes",
    recipients: "Destinatarios",
    art_packages: "Artículos por Agencia",
    art_packgs: "Artículos por Embalaje",
    agencies_dest: "Agencias Destino",
};

export default function BulkImport() {
    const { type } = usePage<BulkImportPageProps>().props;
    const moduleName = MODULE_NAMES[type];

    const { data, setData, post, reset, processing, errors } = useForm({
        file: null as File | null,
    });

    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSuccessMessage(null);
        setErrorMessage(null);

        post(route("bulk-import.import", { type }), {
            forceFormData: true,
            onSuccess: () => {
                setSuccessMessage(`✅ ${moduleName} importados correctamente.`);
                reset("file");
            },
            onError: () => {
                setErrorMessage("❌ Ocurrió un error al importar el archivo.");
            },
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setData("file", file);
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Carga Masiva de ${moduleName}`} />

            <div className="p-6 max-w-3xl mx-auto space-y-6">
                <Card className="bg-black border border-red-700 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold text-white">
                            Importar {moduleName} desde Excel
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-white">
                        <p className="mb-4 text-sm text-slate-400">
                            Descarga el archivo de ejemplo, llénalo con tus
                            datos y luego súbelo para realizar la importación
                            masiva.
                        </p>

                        <div className="flex items-center gap-4 mb-6">
                            <a
                                href={route("bulk-import.example", { type })}
                                className="inline-block"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Button
                                    variant="secondary"
                                    className="bg-yellow-500 hover:bg-yellow-600 text-white"
                                >
                                    📥 Descargar Ejemplo Excel
                                </Button>
                            </a>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <input
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={handleFileChange}
                                    className="block w-full text-sm text-white bg-[#1b1b1b] border border-red-700 file:bg-red-700 file:border-none file:px-4 file:py-2 file:rounded file:text-white hover:file:bg-red-600"
                                />
                                {errors.file && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.file}
                                    </p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white"
                            >
                                {processing
                                    ? "Importando..."
                                    : `📤 Importar ${moduleName}`}
                            </Button>
                        </form>

                        {successMessage && (
                            <div className="mt-4 text-green-500 font-medium">
                                {successMessage}
                            </div>
                        )}
                        {errorMessage && (
                            <div className="mt-4 text-red-500 font-medium">
                                {errorMessage}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
