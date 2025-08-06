import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import ShippingInterface from "./ShippingInterface";

export default function CreateReception() {
    return (
        <AuthenticatedLayout>
            <Head title="Nueva Recepción" />
            <div className="py-6 px-4">
                <ShippingInterface />
            </div>
        </AuthenticatedLayout>
    );
}
