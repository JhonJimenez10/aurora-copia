import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import ShippingInterface from "./ShippingInterface";

export default function EditReception({ reception }: { reception: any }) {
    const initialData = {
        ...reception,
        sender: reception.sender,
        recipient: reception.recipient,

        // 🧱 Paquetes
        packages: (reception.packages || []).map((pkg: any) => ({
            ...pkg,
            pounds: Number(pkg.pounds) || 0,
            kilograms: Number(pkg.kilograms) || 0,
            total: Number(pkg.total) || 0,
            decl_val: Number(pkg.decl_val) || 0,
            ins_val: Number(pkg.ins_val) || 0,

            // 🔹 Items dentro del paquete
            items: (pkg.package_items || []).map((item: any) => ({
                ...item,
                art_package_id: item.art_package_id ?? item.article_id ?? null,
                name: item.name ?? "",
                quantity: Number(item.quantity) || 0,
                unit: item.unit ?? "",
                length: Number(item.length) || 0,
                width: Number(item.width) || 0,
                height: Number(item.height) || 0,
                weight: Number(item.weight) || 0,
                pounds: Number(item.pounds) || 0,
                kilograms: Number(item.kilograms) || 0,
                unit_price: Number(item.unit_price) || 0,
                total: Number(item.total) || 0,

                // ✅ Campos declarados corregidos
                items_decl: Number(item.items_declrd) || 0, // ← campo correcto de la BD
                decl_val: Number(item.decl_val) || 0, // ← valor declarado

                // 🔹 Otros valores opcionales
                arancel: Number(item.arancel) || 0,
            })),
        })),

        // 🔹 Adicionales
        additionals: (reception.additionals || []).map((add: any) => ({
            article: add.art_packg_id,
            unit: add.art_packg?.unit_type ?? "",
            quantity: Number(add.quantity) || 0,
            unit_price: Number(add.unit_price) || 0,
        })),

        // 🔹 Otros campos generales
        payMethod: reception.pay_method || "EFECTIVO",
        efectivoRecibido: Number(reception.cash_recv) || 0,
        receptionDate: reception.date_time?.substring(0, 10),
        route: reception.route || "ecu-us",
        receptionNumber: reception.number,
        agencyDest: reception.agency_dest,
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Editar Recepción ${reception.number}`} />
            <div className="py-6 px-4">
                {/* 👇 si solo quieres visualizar, deja readOnly={true} */}
                <ShippingInterface initialData={initialData} readOnly={true} />
            </div>
        </AuthenticatedLayout>
    );
}
