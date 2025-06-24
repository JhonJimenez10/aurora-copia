import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import AgencyDestForm from "./Form";

export default function Edit({ agency }: any) {
    return (
        <AuthenticatedLayout>
            <Head title="Editar Agencia Destino" />
            <div className="max-w-3xl mx-auto px-4 py-6">
                <h1 className="text-2xl font-semibold text-white mb-4">
                    Editar Agencia Destino
                </h1>
                <AgencyDestForm agency={agency} />
            </div>
        </AuthenticatedLayout>
    );
}
