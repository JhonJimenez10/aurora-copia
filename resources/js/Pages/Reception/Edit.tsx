import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage } from "@inertiajs/react";
import ShippingInterface from "./ShippingInterface";

export default function EditReception({ reception }: { reception: any }) {
    const initialData = {
        ...reception,
        sender: reception.sender,
        recipient: reception.recipient,
        packages: (reception.packages || []).map((pkg: any) => ({
            ...pkg,
            pounds: Number(pkg.pounds) || 0,
            kilograms: Number(pkg.kilograms) || 0,
            total: Number(pkg.total) || 0,
            decl_val: Number(pkg.decl_val) || 0,
            ins_val: Number(pkg.ins_val) || 0,
            items: (pkg.package_items || []).map((item: any) => ({
                ...item,
                quantity: Number(item.quantity) || 0,
                length: Number(item.length) || 0,
                width: Number(item.width) || 0,
                height: Number(item.height) || 0,
                weight: Number(item.weight) || 0,
                pounds: Number(item.pounds) || 0,
                kilograms: Number(item.kilograms) || 0,
                unit_price: Number(item.unit_price) || 0,
                total: Number(item.total) || 0,
                decl_val: Number(item.decl_val) || 0,
                ins_val: Number(item.ins_val) || 0,
            })),
        })),
        additionals: (reception.additionals || []).map((add: any) => ({
            // para el <Select /> usaremos el id del catálogo
            article: add.art_packg_id,
            // unidad desde la relación (si vino); si no, cadena vacía y luego se rellena al cambiar el select
            unit: add.art_packg?.unit_type ?? "",
            quantity: Number(add.quantity) || 0,
            unit_price: Number(add.unit_price) || 0,
        })),
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
                <ShippingInterface initialData={initialData} readOnly={true} />
            </div>
        </AuthenticatedLayout>
    );
}
