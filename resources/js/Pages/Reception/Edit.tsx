import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import ShippingInterface from "./ShippingInterface";

interface EditReceptionProps {
    initialData: any;
    readOnly: boolean;
}

export default function EditReception({
    initialData,
    readOnly,
}: EditReceptionProps) {
    // Validación de seguridad
    if (!initialData) {
        return (
            <AuthenticatedLayout>
                <Head title="Error - Recepción" />
                <div className="container mx-auto px-4 py-8">
                    <div className="bg-red-900 border border-red-700 rounded-lg p-6 text-white">
                        <h1 className="text-xl font-bold mb-2">
                            Error al cargar la recepción
                        </h1>
                        <p>No se pudieron cargar los datos de la recepción.</p>
                        <button
                            onClick={() => window.history.back()}
                            className="mt-4 bg-red-700 hover:bg-red-600 px-4 py-2 rounded"
                        >
                            Volver
                        </button>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout>
            <Head title={`Recepción ${initialData.receptionNumber || ""}`} />

            <div className="container mx-auto px-4 py-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-700 via-red-600 to-yellow-400 text-white px-6 py-4 rounded-t-lg mb-0">
                    <h1 className="text-2xl font-bold">
                        Recepción: {initialData.receptionNumber}
                    </h1>
                    {initialData.annulled && (
                        <p className="text-sm mt-2">
                            <span className="bg-red-900/50 px-3 py-1 rounded-full inline-block">
                                ⚠️ RECEPCIÓN ANULADA
                            </span>
                        </p>
                    )}
                </div>

                {/* Componente principal */}
                <ShippingInterface
                    initialData={initialData}
                    readOnly={readOnly}
                />
            </div>
        </AuthenticatedLayout>
    );
}
