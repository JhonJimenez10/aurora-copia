"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Info } from "lucide-react";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { Button } from "@/Components/ui/button";
import { Card, CardContent } from "@/Components/ui/card";
import {
    Search,
    Edit,
    FileText,
    Clipboard,
    Printer,
    Download,
    MoreHorizontal,
    Paperclip,
    Plus,
    Minus,
} from "lucide-react";
import { Provider as TooltipProvider } from "@radix-ui/react-tooltip";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/Components/ui/tooltip";

// Importa los modales
import SenderCreateModal from "./Components/SenderCreateModal";
import SenderSearchModal from "./Components/SenderSearchModal";
import RecipientCreateModal from "./Components/RecipientCreateModal";
import RecipientSearchModal from "./Components/RecipientSearchModal";
import PackageModal from "./Components/PackageModal";
import { useEffect } from "react";
import axios from "axios";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/Components/ui/dialog";
import { v4 as uuidv4 } from "uuid";
import { usePage } from "@inertiajs/react";
// ⏫  (después de los imports, antes del componente)
const agencyAddressDefaults: Record<string, Partial<Person>> = {
    QUEENS: {
        postal_code: "11368",
        city: "QUEENS",
        canton: "USA",
        state: "NEW YORK",
    },
    MIAMI: {
        postal_code: "33101",
        city: "MIAMI",
        canton: "USA",
        state: "FLORIDA",
    },
    "LOS ANGELES": {
        postal_code: "90001",
        city: "LOS ANGELES",
        canton: "USA",
        state: "CALIFORNIA",
    },
};

interface Person {
    id: string;
    identification: string;
    full_name: string;
    address: string;
    phone: string;
    email: string;
    postal_code: string;
    city: string;
    canton: string;
    state: string;
}
interface PackageItem {
    id?: string; // ID generado para relacionar luego
    art_package_id: string;
    service_type: string;
    content: string;
    pounds: number;
    kilograms: number;
    total: number;
    decl_val: number;
    ins_val: number;
    perfumeDesc?: string;
    items: PackageItemDetail[];
}

interface PackageItemDetail {
    art_package_id: string;
    name: string;
    quantity: number;
    unit: string;
    volume: boolean;
    length: number;
    width: number;
    height: number;
    weight: number;
    pounds: number;
    kilograms: number;
    unit_price: number;
    total: number;
    decl_val: number;
    ins_val: number;
}

interface AdditionalItem {
    quantity: number;
    unit: string;
    article: string;
    unit_price: number;
}
interface PackageRow {
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
interface AgencyDest {
    id: string;
    name: string;
    code_letters: string;
    trade_name: string | null;
    address: string | null;
    phone: string | null;
    postal_code: string | null;
    city: string | null;
    state: string | null;
    available_us: boolean;
    value: number | null;
}

export default function ShippingInterface() {
    //Boton y mostrar un loading
    const [isSaving, setIsSaving] = useState(false);

    const [agencyOptions, setAgencyOptions] = useState<AgencyDest[]>([]);

    const { auth } = usePage().props as any;
    const enterpriseId = auth.user.enterprise_id;
    const [currentTab, setCurrentTab] = useState("sender");
    // ⏬  dentro del componente:
    const [recipientDefaults, setRecipientDefaults] = useState<Partial<Person>>(
        {}
    );
    useEffect(() => {
        if (enterpriseId) {
            axios
                .get("/agencies_dest/list/json")
                .then((res) => setAgencyOptions(res.data))
                .catch((err) => {
                    console.error("Error al cargar agencias:", err);
                });
        }
    }, [enterpriseId]);
    // datos sender/recipient...
    const [sender, setSender] = useState<Person>({
        id: "",
        identification: "",
        full_name: "",
        address: "",
        phone: "",
        email: "",
        postal_code: "",
        city: "",
        canton: "",
        state: "",
    });
    const [recipient, setRecipient] = useState<Person>({
        id: "",
        identification: "",
        full_name: "",
        address: "",
        phone: "",
        email: "",
        postal_code: "",
        city: "",
        canton: "",
        state: "",
    });

    // listas y estados de UI
    const [packages, setPackages] = useState<PackageItem[]>([]);
    const [showPackageModal, setShowPackageModal] = useState(false);
    const [editingPackageIndex, setEditingPackageIndex] = useState<
        number | null
    >(null);
    const [packageRowsForEdit, setPackageRowsForEdit] = useState<
        PackageRow[] | undefined
    >(undefined);

    // para cálculo de totales
    const [packageDiscount, setPackageDiscount] = useState(0);
    const packageSubtotal = packages.reduce((acc, p) => acc + p.total, 0);
    const packageTotal = Math.max(0, packageSubtotal - packageDiscount);

    // lista de artículos (para contenido)
    const [artPackgOptions, setArtPackgOptions] = useState<
        { id: string; name: string; unit_price: number; unit_type: string }[]
    >([]);
    useEffect(() => {
        axios
            .get("/art_packgs/list/json")
            .then((res) => setArtPackgOptions(res.data));
    }, []);

    // otros estados (número, fecha, rutas, adicionales, pago...)
    const [receptionNumber, setReceptionNumber] = useState("000-001");
    console.log("auth:", auth);
    console.log("enterpriseId:", enterpriseId);

    useEffect(() => {
        if (enterpriseId) {
            console.log("Solicitando número con enterpriseId:", enterpriseId);
            axios
                .get(`/receptions/next-number?enterprise_id=${enterpriseId}`)
                .then((res) => {
                    console.log("Respuesta recibida:", res.data);
                    if (res.data.number) {
                        setReceptionNumber(res.data.number);
                    }
                })
                .catch((err) => {
                    console.error(
                        "Error al obtener el número de recepción:",
                        err
                    );
                });
        }
    }, [auth, enterpriseId]); // 👈 añade `auth` para que se dispare en re-render

    const today = new Date().toISOString().split("T")[0];
    const [receptionDate, setReceptionDate] = useState(today);
    const [route, setRoute] = useState("ecu-us");
    const [agencyDest, setAgencyDest] = useState("");
    const [additionals, setAdditionals] = useState<AdditionalItem[]>([
        { quantity: 0, unit: "", article: "", unit_price: 0 },
    ]);
    const [payMethod, setPayMethod] = useState<string>("EFECTIVO");
    const [efectivoRecibido, setEfectivoRecibido] = useState(0);
    const [showSenderModal, setShowSenderModal] = useState(false);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [showRecipientModal, setShowRecipientModal] = useState(false);
    const [showRecipientSearch, setShowRecipientSearch] = useState(false);
    //facturas
    const [invoiceId, setInvoiceId] = useState<string | null>(null);
    // Para configurar el modal según el estado SRI
    const [modalTitle, setModalTitle] = useState("");
    const [modalTitleClass, setModalTitleClass] = useState("");
    const [modalMessage, setModalMessage] = useState("");
    const [modalLink, setModalLink] = useState("");
    const [modalType, setModalType] = useState<string | undefined>();

    const addAdditional = () => {
        setAdditionals((prev) => [
            ...prev,
            { quantity: 0, unit: "", article: "", unit_price: 0 },
        ]);
    };

    const removeAdditional = (index: number) => {
        setAdditionals((prev) => prev.filter((_, i) => i !== index));
    };

    const updateAdditional = (
        index: number,
        field: keyof AdditionalItem,
        value: string
    ) => {
        const updated = [...additionals];

        // Cast por campo
        const newValue: AdditionalItem[typeof field] =
            field === "quantity" || field === "unit_price"
                ? ((parseFloat(value) || 0) as AdditionalItem[typeof field])
                : (value as AdditionalItem[typeof field]);

        updated[index] = {
            ...updated[index],
            [field]: newValue,
        };

        setAdditionals(updated);
    };

    // Función que abre el modal de búsqueda
    const openSearchModal = () => {
        setShowSearchModal(true);
    };

    // Cuando se selecciona un sender en el modal de búsqueda
    const handleSenderSelect = (selectedSender: any) => {
        setSender({
            id: selectedSender.id || "",
            identification: selectedSender.identification || "",
            full_name: selectedSender.full_name || "",
            address: selectedSender.address || "",
            phone: selectedSender.phone || "",
            email: selectedSender.email || "",
            postal_code: selectedSender.postal_code || "",
            city: selectedSender.city || "",
            canton: selectedSender.canton || "",
            state: selectedSender.state || "",
        });
    };

    // Cuando se crea un nuevo sender desde el modal de creación
    const handleSenderCreated = (senderData: any) => {
        setSender({
            id: senderData.id || "",
            identification: senderData.identification || "",
            full_name: senderData.full_name || "",
            address: senderData.address || "",
            phone: senderData.phone || "",
            email: senderData.email || "",
            postal_code: senderData.postal_code || "",
            city: senderData.city || "",
            canton: senderData.canton || "",
            state: senderData.state || "",
        });
    };

    const handleRecipientSelect = (selectedRecipient: any) => {
        setRecipient({
            id: selectedRecipient.id || "",
            identification: selectedRecipient.identification || "",
            full_name: selectedRecipient.full_name || "",
            address: selectedRecipient.address || "",
            phone: selectedRecipient.phone || "",
            email: selectedRecipient.email || "",
            postal_code: selectedRecipient.postal_code || "",
            city: selectedRecipient.city || "",
            canton: selectedRecipient.canton || "",
            state: selectedRecipient.state || "",
        });
    };
    const handleRecipientCreated = (recipientData: any) => {
        setRecipient({
            id: recipientData.id || "",
            identification: recipientData.identification || "",
            full_name: recipientData.full_name || "",
            address: recipientData.address || "",
            phone: recipientData.phone || "",
            email: recipientData.email || "",
            postal_code: recipientData.postal_code || "",
            city: recipientData.city || "",
            canton: recipientData.canton || "",
            state: recipientData.state || "",
        });
    };

    const handleSaveReception = async () => {
        // Cálculos globales
        const round = (num: number) => Math.round(num * 100) / 100;

        const totalAdditionals = additionals.reduce(
            (acc, item) => acc + item.quantity * item.unit_price,
            0
        );

        const totalSeguroPaquete = packages.reduce((accPkg, pkg) => {
            const seguroPorItems = pkg.items.reduce((accItem, item) => {
                const name = item.name?.toLowerCase() || "";
                const isOroPlata =
                    name.includes("oro") || name.includes("plata");
                const tasa = isOroPlata ? 0.15 : 0.05;
                return accItem + item.ins_val * tasa;
            }, 0);
            return accPkg + seguroPorItems;
        }, 0);

        const totalPesoLbs = packages.reduce((acc, pkg) => acc + pkg.pounds, 0);
        const agencia = agencyOptions.find((a) => a.id === agencyDest);
        const valorTransporte = agencia?.value || 0;
        const totalTransporteDestino = round(valorTransporte * totalPesoLbs);

        const totalSeguroEnvio = totalPesoLbs * 0.1;

        let totalDesaduanizacion = 0;
        if (totalPesoLbs > 0 && totalPesoLbs <= 1) {
            totalDesaduanizacion = 3.5;
        } else if (totalPesoLbs > 1 && totalPesoLbs <= 17) {
            totalDesaduanizacion = 6;
        } else if (totalPesoLbs > 17 && totalPesoLbs <= 22) {
            totalDesaduanizacion = 9;
        } else if (totalPesoLbs > 22) {
            totalDesaduanizacion = 12;
        }

        const subtotalBase = round(
            packageTotal +
                totalAdditionals +
                totalSeguroPaquete +
                totalSeguroEnvio +
                totalDesaduanizacion +
                totalTransporteDestino
        );

        const transmision = round(subtotalBase * 0.01);
        const subtotal = round(subtotalBase + transmision);
        const vat = round(subtotal * 0.15);
        const total = round(subtotal + vat);
        const change = Math.max(0, round(efectivoRecibido - total));

        if (!agencyDest) {
            alert("Por favor seleccione una agencia de destino.");
            return;
        }
        if (payMethod === "EFECTIVO" && efectivoRecibido < total) {
            alert(
                `El efectivo recibido ($${efectivoRecibido.toFixed(
                    2
                )}) no puede ser menor al total a pagar ($${total.toFixed(2)}).`
            );
            return;
        }

        if (!sender.id) {
            alert("Debe seleccionar un remitente.");
            return;
        }
        if (!recipient.id) {
            alert("Debe seleccionar un destinatario.");
            return;
        }
        if (packages.length === 0) {
            alert("Debe agregar al menos un paquete.");
            return;
        }
        if (!payMethod || payMethod.trim() === "") {
            alert("Por favor seleccione una forma de cobro.");
            return;
        }

        // 2) preparar payload
        const payload = {
            number: receptionNumber,
            route,
            date_time: receptionDate,
            agency_origin: "CUENCA CENTRO",
            agency_dest: agencyDest,
            sender_id: sender.id,
            recipient_id: recipient.id,
            pkg_total: packages.reduce((acc, p) => acc + p.total, 0),
            ins_pkg: totalSeguroPaquete,
            packaging: totalAdditionals,
            ship_ins: totalSeguroEnvio,
            clearance: totalDesaduanizacion,
            trans_dest: totalTransporteDestino,
            transmit: transmision,
            subtotal,
            vat15: vat,
            total,
            pay_method: payMethod,
            cash_recv: efectivoRecibido,
            change,
            packages,
            additionals,
        };
        if (isSaving) return; // Evitar múltiples clics si ya está guardando
        setIsSaving(true);
        try {
            // 3) Guardar recepción
            const receptionRes = await axios.post("/receptions", payload);
            const receptionId = receptionRes.data.id;

            // 4) Generar factura (sin autorización ni firma)
            const invoiceRes = await axios.post(
                `/receptions/${receptionId}/invoice`
            );
            const { invoice_id, invoice_number, xml_path } = invoiceRes.data;

            setInvoiceId(invoice_id);

            // 5) Descargar XML
            try {
                const xmlRes = await axios.get(
                    `/invoices/${invoice_id}/xml-download`,
                    { responseType: "blob" }
                );
                const blob = new Blob([xmlRes.data], {
                    type: "application/xml",
                });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `factura-${invoice_number}.xml`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
            } catch (downloadErr: any) {
                console.error("Error descargando XML:", downloadErr);
                alert("No se pudo descargar el XML de la factura.");
            }

            // 6) Generar PDF de tickets
            setPdfUrl(`/receptions/${receptionId}/all-package-tickets.pdf`);

            // 7) Mostrar modal de éxito
            setModalType(undefined); // Ya no hay 'autorizado' ni 'rechazado'
            setModalTitleClass("text-green-400");
            setModalTitle("Factura generada correctamente");
            setModalMessage(
                `Factura generada con número ${invoice_number}.\nSe guardó el XML en:\n${xml_path}`
            );
            setModalLink(xml_path);
            setShowSuccessModal(true);
        } catch (err: any) {
            console.error("❌ Error completo:", err); // Agregado
            console.error("❌ Error al procesar:", err.response?.data || err);
            alert("Ocurrió un error al procesar la recepción o la factura.");
        } finally {
            setIsSaving(false); // ✅ Siempre volver a habilitar el botón
        }
    };

    // ABRIR MODAL NUEVO PAQUETE
    const openNewPackageModal = () => {
        setEditingPackageIndex(null);
        setPackageRowsForEdit(undefined);
        setShowPackageModal(true);
    };

    // ABRIR MODAL EDICIÓN DE PAQUETE
    const openEditPackageModal = (idx: number) => {
        const pkg = packages[idx];
        // items siempre definido
        const rows: PackageRow[] = pkg.items.map((item) => ({
            cantidad: String(item.quantity),
            unidad: item.unit,
            articulo_id: item.art_package_id,
            articulo:
                artPackgOptions.find((a) => a.id === item.art_package_id)
                    ?.name ||
                item.name ||
                "",
            volumen: item.volume,
            largo: String(item.length),
            ancho: String(item.width),
            altura: String(item.height),
            peso: String(item.weight),
            unitario: String(item.unit_price),
            subtotal: (item.quantity * item.unit_price).toFixed(2),
            descuento: "0",
            total: item.total.toFixed(2),
            declarado: item.decl_val.toFixed(2),
            asegurado: item.ins_val.toFixed(2),
        }));
        setEditingPackageIndex(idx);
        setPackageRowsForEdit(rows);
        setShowPackageModal(true);
    };

    // GUARDAR o ACTUALIZAR PAQUETE DESDE EL MODAL
    // … dentro de ShippingInterface.tsx …

    const handleSavePackage = (
        rows: PackageRow[],
        serviceType: string,
        perfumeDesc: string
    ) => {
        // construyo el detalle igual que antes
        const details: PackageItemDetail[] = rows.map((r) => ({
            art_package_id: r.articulo_id,
            name: r.articulo,
            quantity: parseFloat(r.cantidad),
            unit: r.unidad,
            volume: r.volumen,
            length: parseFloat(r.largo),
            width: parseFloat(r.ancho),
            height: parseFloat(r.altura),
            weight: parseFloat(r.peso),
            pounds: parseFloat(r.peso),
            kilograms: parseFloat(r.peso) * 0.453592,
            unit_price: parseFloat(r.unitario),
            total: parseFloat(r.total),
            decl_val: parseFloat(r.declarado),
            ins_val: parseFloat(r.asegurado),
        }));

        // aquí el único cambio: usar directamente r.articulo
        // reconstruyo el nombre del artículo a partir de artPackgOptions
        // dentro de handleSavePackage, sustituye tu contenido por esto:
        const contenido = rows
            .map((r) => {
                // intento sacar el nombre del catálogo; si no existe, uso el nombre que ya estaba en la fila:
                const art = artPackgOptions.find((a) => a.id === r.articulo_id);
                return art?.name ?? r.articulo;
            })
            .filter((name) => name.trim().length > 0)
            .join(" + ");

        const totalLbs = details.reduce((a, x) => a + x.pounds, 0);
        const totalTotal = details.reduce((a, x) => a + x.total, 0);
        const totalDecl = details.reduce((a, x) => a + x.decl_val, 0);
        const totalIns = details.reduce((a, x) => a + x.ins_val, 0);

        const newPkg: PackageItem = {
            id:
                editingPackageIndex !== null
                    ? packages[editingPackageIndex].id
                    : uuidv4(),
            art_package_id: rows[0].articulo_id,
            service_type: serviceType,
            content: contenido, // ← aquí ya tienes lo que viste en el modal
            pounds: totalLbs,
            kilograms: totalLbs * 0.453592,
            total: totalTotal,
            decl_val: totalDecl,
            ins_val: totalIns,
            perfumeDesc: perfumeDesc,
            items: details,
        };

        setPackages((prev) => {
            if (editingPackageIndex !== null) {
                const upd = [...prev];
                upd[editingPackageIndex] = newPkg;
                return upd;
            }
            return [...prev, newPkg];
        });

        setShowPackageModal(false);
        setEditingPackageIndex(null);
    };

    // Nuevo estado para modal y PDF
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [pdfUrl, setPdfUrl] = useState("");
    // Effect para atajos en teclado de eliminar, crear y editar por secciones de apartdos.
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!event.altKey) return;

            switch (currentTab) {
                case "packages":
                    if (event.key.toLowerCase() === "q") {
                        event.preventDefault();
                        if (packages.length > 0) {
                            setPackages((prev) => prev.slice(0, -1)); // Elimina el último paquete
                        }
                    }
                    if (event.key.toLowerCase() === "a") {
                        event.preventDefault();
                        setEditingPackageIndex(null);
                        setPackageRowsForEdit(undefined);
                        setShowPackageModal(true); // Abre modal para agregar paquete
                    }
                    if (event.key.toLowerCase() === "m") {
                        event.preventDefault();
                        if (packages.length > 0) {
                            openEditPackageModal(packages.length - 1); // Edita el último paquete
                        }
                    }
                    break;

                case "sender":
                    if (event.key.toLowerCase() === "a") {
                        event.preventDefault();
                        setShowSenderModal(true); // Abre modal para agregar remitente
                    }
                    break;

                case "recipient":
                    if (event.key.toLowerCase() === "a") {
                        event.preventDefault();
                        if (!agencyDest) return;
                        setRecipientDefaults(
                            agencyAddressDefaults[agencyDest] ?? {}
                        );
                        setShowRecipientModal(true); // Abre modal para agregar destinatario
                    }
                    break;

                case "additionals":
                    if (event.key.toLowerCase() === "a") {
                        event.preventDefault();
                        addAdditional(); // Agrega adicional
                    }
                    if (event.key.toLowerCase() === "q") {
                        event.preventDefault();
                        if (additionals.length > 0) {
                            removeAdditional(additionals.length - 1); // Elimina el último adicional
                        }
                    }
                    break;

                default:
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [currentTab, packages, additionals, agencyDest]);

    return (
        <div className="max-w-6xl mx-auto p-4 bg-black text-white border border-red-700 rounded-xl shadow-xl text-xs">
            <TooltipProvider>
                {/* Cabecera */}
                <div className="flex items-center justify-between mb-1">
                    <h1 className="text-base font-bold text-white">
                        RECEPCIÓN
                    </h1>

                    <div className="flex space-x-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:text-gray-300"
                        >
                            <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:text-gray-300"
                        >
                            <Clipboard className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:text-gray-300"
                        >
                            <Download className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:text-gray-300"
                        >
                            <Printer className="h-4 w-4" />
                        </Button>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={openSearchModal}
                                    className="text-white hover:text-gray-300"
                                >
                                    <Search className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="text-[10px]">Buscar remitente</p>
                            </TooltipContent>
                        </Tooltip>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:text-gray-300"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="text-center mb-1">
                    <span className="text-white text-[10px]">
                        Nuevo registro...
                    </span>
                </div>

                {/* Datos principales */}
                <div className="grid grid-cols-3 gap-2 mb-2">
                    {/* Número */}
                    <div className="flex flex-col">
                        <Label className="mb-0.5 font-medium text-white">
                            Número:
                        </Label>
                        <Input
                            value={receptionNumber}
                            className="w-full bg-black text-white border border-red-700"
                            readOnly
                        />
                    </div>
                    {/* Ruta */}
                    <div className="flex flex-col">
                        <Label className="mb-0.5 font-medium text-white">
                            Ruta
                        </Label>
                        <Select
                            value={route}
                            onValueChange={(val) => setRoute(val)}
                        >
                            <SelectTrigger className="w-full bg-black text-white border border-red-700">
                                <SelectValue placeholder="ECUADOR - ESTADOS UNIDOS" />
                            </SelectTrigger>
                            <SelectContent className="bg-black border border-red-700 text-white">
                                <SelectItem value="ecu-us">
                                    ECUADOR - ESTADOS UNIDOS
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {/* Fecha y hora */}
                    <div className="flex flex-col">
                        <Label className="mb-0.5 font-medium text-white">
                            Fecha y hora:
                        </Label>
                        <Input
                            type="date"
                            className="w-full bg-black text-white border border-red-700 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                            value={receptionDate}
                            onChange={(e) => setReceptionDate(e.target.value)}
                        />
                    </div>
                </div>

                {/* Agencias */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="flex flex-col">
                        <Label className="mb-0.5 font-medium text-white">
                            Ag. origen
                        </Label>
                        <Input
                            value="CUENCA CENTRO"
                            readOnly
                            className="bg-black text-white border border-red-700"
                        />
                    </div>
                    <div className="flex flex-col">
                        <Label className="mb-0.5 font-medium text-white">
                            Ag. destino
                        </Label>
                        <div className="flex items-start gap-2">
                            <Select
                                value={agencyDest}
                                onValueChange={setAgencyDest}
                            >
                                <SelectTrigger className="w-full bg-black text-white border border-red-700">
                                    <SelectValue placeholder="Seleccionar destino" />
                                </SelectTrigger>

                                <SelectContent className="bg-black text-white border border-red-700">
                                    {agencyOptions.map((agency) => (
                                        <SelectItem
                                            key={agency.id}
                                            value={agency.id}
                                            className="hover:bg-red-700 cursor-pointer transition-colors px-2 py-1 text-sm"
                                        >
                                            {agency.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="mt-1 cursor-pointer text-white hover:text-gray-300 transition">
                                            <Info className="w-4 h-4" />
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-black text-white border border-red-700 text-xs max-w-[250px]">
                                        {(() => {
                                            const agency = agencyOptions.find(
                                                (a) => a.id === agencyDest
                                            );
                                            if (!agency)
                                                return "Selecciona una agencia para ver detalles.";

                                            return (
                                                <>
                                                    <div>
                                                        <strong>Nombre:</strong>{" "}
                                                        {agency.name}
                                                    </div>
                                                    <div>
                                                        <strong>
                                                            Comercial:
                                                        </strong>{" "}
                                                        {agency.trade_name ||
                                                            "N/A"}
                                                    </div>
                                                    <div>
                                                        <strong>
                                                            Dirección:
                                                        </strong>{" "}
                                                        {agency.address ||
                                                            "N/A"}
                                                    </div>
                                                    <div>
                                                        <strong>
                                                            Teléfono:
                                                        </strong>{" "}
                                                        {agency.phone || "N/A"}
                                                    </div>
                                                    <div>
                                                        <strong>
                                                            Código postal:
                                                        </strong>{" "}
                                                        {agency.postal_code ||
                                                            "N/A"}
                                                    </div>
                                                    <div>
                                                        <strong>Ciudad:</strong>{" "}
                                                        {agency.city || "N/A"}
                                                    </div>
                                                    <div>
                                                        <strong>
                                                            Provincia:
                                                        </strong>{" "}
                                                        {agency.state || "N/A"}
                                                    </div>
                                                    <div>
                                                        <strong>
                                                            Disponible US:
                                                        </strong>{" "}
                                                        {agency.available_us
                                                            ? "Sí"
                                                            : "No"}
                                                    </div>
                                                    <div>
                                                        <strong>Valor:</strong>{" "}
                                                        {agency.value || "N/A"}
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {/* Sección de Tabs (Sender/Recipient/Packages/Additionals) */}
                    <div className="md:col-span-2">
                        <Tabs
                            defaultValue="sender"
                            className="w-full"
                            onValueChange={setCurrentTab}
                        >
                            <TabsList className="w-full grid grid-cols-4 bg-black text-white text-[10px] rounded-none border-b border-red-600">
                                <TabsTrigger
                                    value="sender"
                                    className="py-1 data-[state=active]:bg-red-600 data-[state=active]:text-white hover:bg-red-700"
                                >
                                    REMITENTE
                                </TabsTrigger>
                                <TabsTrigger
                                    value="recipient"
                                    className="py-1 data-[state=active]:bg-red-600 data-[state=active]:text-white hover:bg-red-700"
                                >
                                    DESTINATARIO
                                </TabsTrigger>
                                <TabsTrigger
                                    value="packages"
                                    className="py-1 data-[state=active]:bg-red-600 data-[state=active]:text-white hover:bg-red-700"
                                >
                                    PAQUETES
                                </TabsTrigger>
                                <TabsTrigger
                                    value="additionals"
                                    className="py-1 data-[state=active]:bg-red-600 data-[state=active]:text-white hover:bg-red-700"
                                >
                                    ADICIONALES
                                </TabsTrigger>
                            </TabsList>

                            {/* SENDER TAB */}
                            <TabsContent
                                value="sender"
                                className="border border-red-600 rounded p-1 mt-1 space-y-1 bg-black text-white"
                            >
                                <div className="flex justify-between items-center">
                                    <Label className="mb-0.5 font-medium text-white">
                                        Identificación
                                    </Label>
                                    <div className="flex space-x-1">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={openSearchModal}
                                                    className="text-yellow-400 hover:text-yellow-500"
                                                >
                                                    <Search className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="text-[10px]">
                                                    Buscar Remitente
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        setShowSenderModal(true)
                                                    }
                                                    className="text-green-500 hover:text-green-600"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="text-[10px]">
                                                    Agregar
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </div>

                                <Input
                                    placeholder="Identificación"
                                    className="bg-black text-white border border-red-700"
                                    value={sender.identification}
                                    onChange={(e) =>
                                        setSender({
                                            ...sender,
                                            identification: e.target.value,
                                        })
                                    }
                                />

                                <Label className="mb-0.5 font-medium text-white">
                                    Apellidos y nombres
                                </Label>
                                <Input
                                    className="bg-black text-white border border-red-700"
                                    value={sender.full_name}
                                    onChange={(e) =>
                                        setSender({
                                            ...sender,
                                            full_name: e.target.value,
                                        })
                                    }
                                />

                                <Label className="mb-0.5 font-medium text-white">
                                    Dirección
                                </Label>
                                <Input
                                    className="bg-black text-white border border-red-700"
                                    value={sender.address}
                                    onChange={(e) =>
                                        setSender({
                                            ...sender,
                                            address: e.target.value,
                                        })
                                    }
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                                    <div>
                                        <Label className="mb-0.5 font-medium text-white">
                                            Celular
                                        </Label>
                                        <Input
                                            className="bg-black text-white border border-red-700"
                                            value={sender.phone}
                                            onChange={(e) =>
                                                setSender({
                                                    ...sender,
                                                    phone: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label className="mb-0.5 font-medium text-white">
                                            Correo electrónico
                                        </Label>
                                        <Input
                                            type="email"
                                            className="bg-black text-white border border-red-700"
                                            value={sender.email}
                                            onChange={(e) =>
                                                setSender({
                                                    ...sender,
                                                    email: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
                                    <div>
                                        <Label className="mb-0.5 font-medium text-white">
                                            Código postal
                                        </Label>
                                        <Input
                                            className="bg-black text-white border border-red-700"
                                            value={sender.postal_code}
                                            onChange={(e) =>
                                                setSender({
                                                    ...sender,
                                                    postal_code: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label className="mb-0.5 font-medium text-white">
                                            Parroquia / City
                                        </Label>
                                        <Input
                                            className="bg-black text-white border border-red-700"
                                            value={sender.city}
                                            onChange={(e) =>
                                                setSender({
                                                    ...sender,
                                                    city: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label className="mb-0.5 font-medium text-white">
                                            Cantón / Country
                                        </Label>
                                        <Input
                                            className="bg-black text-white border border-red-700"
                                            value={sender.canton}
                                            onChange={(e) =>
                                                setSender({
                                                    ...sender,
                                                    canton: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label className="mb-0.5 font-medium text-white">
                                        Provincia / State
                                    </Label>
                                    <Input
                                        className="bg-black text-white border border-red-700"
                                        value={sender.state}
                                        onChange={(e) =>
                                            setSender({
                                                ...sender,
                                                state: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </TabsContent>

                            {/* RECIPIENT TAB */}
                            {/* DESTINATARIO */}
                            <TabsContent
                                value="recipient"
                                className="border border-red-600 rounded p-1 mt-1 space-y-1 bg-black text-white"
                            >
                                <div className="flex justify-between items-center">
                                    <Label className="mb-0.5 font-medium text-white">
                                        Identificación
                                    </Label>
                                    <div className="flex space-x-1">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        setShowRecipientSearch(
                                                            true
                                                        )
                                                    }
                                                    className="text-yellow-400 hover:text-yellow-500"
                                                >
                                                    <Search className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="text-[10px]">
                                                    Buscar Destinatario
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    disabled={!agencyDest}
                                                    onClick={() => {
                                                        if (!agencyDest) return;
                                                        setRecipientDefaults(
                                                            agencyAddressDefaults[
                                                                agencyDest
                                                            ] ?? {}
                                                        );
                                                        setShowRecipientModal(
                                                            true
                                                        );
                                                    }}
                                                    className={`${
                                                        agencyDest
                                                            ? "text-green-500 hover:text-green-600"
                                                            : "text-gray-500 cursor-not-allowed"
                                                    }`}
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="text-[10px]">
                                                    {agencyDest
                                                        ? "Agregar"
                                                        : "Selecciona una agencia primero"}
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </div>

                                <Input
                                    placeholder="Identificación"
                                    value={recipient.identification}
                                    onChange={(e) =>
                                        setRecipient({
                                            ...recipient,
                                            identification: e.target.value,
                                        })
                                    }
                                    className="bg-black text-white border border-red-700"
                                />
                                <Label className="mb-0.5 font-medium text-white">
                                    Apellidos y nombres
                                </Label>
                                <Input
                                    value={recipient.full_name}
                                    onChange={(e) =>
                                        setRecipient({
                                            ...recipient,
                                            full_name: e.target.value,
                                        })
                                    }
                                    className="bg-black text-white border border-red-700"
                                />
                                <Label className="mb-0.5 font-medium text-white">
                                    Dirección
                                </Label>
                                <Input
                                    value={recipient.address}
                                    onChange={(e) =>
                                        setRecipient({
                                            ...recipient,
                                            address: e.target.value,
                                        })
                                    }
                                    className="bg-black text-white border border-red-700"
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                                    <div>
                                        <Label className="mb-0.5 font-medium text-white">
                                            Celular
                                        </Label>
                                        <Input
                                            value={recipient.phone}
                                            onChange={(e) =>
                                                setRecipient({
                                                    ...recipient,
                                                    phone: e.target.value,
                                                })
                                            }
                                            className="bg-black text-white border border-red-700"
                                        />
                                    </div>
                                    <div>
                                        <Label className="mb-0.5 font-medium text-white">
                                            Correo electrónico
                                        </Label>
                                        <Input
                                            type="email"
                                            value={recipient.email}
                                            onChange={(e) =>
                                                setRecipient({
                                                    ...recipient,
                                                    email: e.target.value,
                                                })
                                            }
                                            className="bg-black text-white border border-red-700"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
                                    <div>
                                        <Label className="mb-0.5 font-medium text-white">
                                            Código postal
                                        </Label>
                                        <Input
                                            value={recipient.postal_code}
                                            onChange={(e) =>
                                                setRecipient({
                                                    ...recipient,
                                                    postal_code: e.target.value,
                                                })
                                            }
                                            className="bg-black text-white border border-red-700"
                                        />
                                    </div>
                                    <div>
                                        <Label className="mb-0.5 font-medium text-white">
                                            Parroquia / City
                                        </Label>
                                        <Input
                                            value={recipient.city}
                                            onChange={(e) =>
                                                setRecipient({
                                                    ...recipient,
                                                    city: e.target.value,
                                                })
                                            }
                                            className="bg-black text-white border border-red-700"
                                        />
                                    </div>
                                    <div>
                                        <Label className="mb-0.5 font-medium text-white">
                                            Cantón / Country
                                        </Label>
                                        <Input
                                            value={recipient.canton}
                                            onChange={(e) =>
                                                setRecipient({
                                                    ...recipient,
                                                    canton: e.target.value,
                                                })
                                            }
                                            className="bg-black text-white border border-red-700"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label className="mb-0.5 font-medium text-white">
                                        Provincia / State
                                    </Label>
                                    <Input
                                        value={recipient.state}
                                        onChange={(e) =>
                                            setRecipient({
                                                ...recipient,
                                                state: e.target.value,
                                            })
                                        }
                                        className="bg-black text-white border border-red-700"
                                    />
                                </div>
                            </TabsContent>

                            {/* PACKAGES TAB */}
                            <TabsContent
                                value="packages"
                                className="border border-red-600 rounded p-1 mt-1 space-y-1 bg-black text-white"
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <Label className="mb-0.5 font-medium text-white">
                                        Paquetes
                                    </Label>
                                    <div className="flex items-center space-x-2">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={
                                                        openNewPackageModal
                                                    }
                                                    className="text-green-500 hover:text-green-600"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="text-[10px]">
                                                    Agregar paquete
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </div>

                                <div className="overflow-auto border rounded border-red-700">
                                    <table className="min-w-full text-xs text-left border-collapse">
                                        <thead className="bg-black text-[10px] uppercase text-white tracking-wider border-b border-red-600">
                                            <tr>
                                                <th className="px-2 py-2">
                                                    Tipo
                                                </th>
                                                <th className="px-2 py-2">
                                                    Contenido
                                                </th>
                                                <th className="px-2 py-2 text-right">
                                                    Lbs
                                                </th>
                                                <th className="px-2 py-2 text-right">
                                                    Kg
                                                </th>
                                                <th className="px-2 py-2 text-right">
                                                    Valor
                                                </th>
                                                <th className="px-2 py-2 text-right">
                                                    V.Dec.
                                                </th>
                                                <th className="px-2 py-2 text-center">
                                                    Acciones
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {packages.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={7}
                                                        className="text-center text-muted-foreground py-3"
                                                    >
                                                        No hay paquetes añadidos
                                                        todavía
                                                    </td>
                                                </tr>
                                            ) : (
                                                packages.map((pkg, idx) => (
                                                    <tr
                                                        key={pkg.id || idx}
                                                        className="border-t border-red-700 even:bg-[#27273a] hover:bg-[#33334d]"
                                                    >
                                                        <td className="px-2 py-2">
                                                            {pkg.service_type}
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            {pkg.content}
                                                        </td>
                                                        <td className="px-2 py-2 text-right">
                                                            {pkg.pounds.toFixed(
                                                                2
                                                            )}
                                                        </td>
                                                        <td className="px-2 py-2 text-right">
                                                            {pkg.kilograms.toFixed(
                                                                2
                                                            )}
                                                        </td>
                                                        <td className="px-2 py-2 text-right">
                                                            $
                                                            {pkg.total.toFixed(
                                                                2
                                                            )}
                                                        </td>
                                                        <td className="px-2 py-2 text-right">
                                                            $
                                                            {pkg.decl_val.toFixed(
                                                                2
                                                            )}
                                                        </td>
                                                        <td className="px-2 py-2 text-center space-x-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() =>
                                                                    openEditPackageModal(
                                                                        idx
                                                                    )
                                                                }
                                                                className="text-blue-400 hover:text-blue-500"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() =>
                                                                    setPackages(
                                                                        packages.filter(
                                                                            (
                                                                                _,
                                                                                i
                                                                            ) =>
                                                                                i !==
                                                                                idx
                                                                        )
                                                                    )
                                                                }
                                                                className="text-red-500 hover:text-red-600"
                                                            >
                                                                <Minus className="w-4 h-4" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex justify-end mt-3 pr-1">
                                    <div className="w-full md:w-[320px] space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-white font-medium">
                                                SUBTOTAL:
                                            </span>
                                            <span>
                                                $
                                                {packages
                                                    .reduce(
                                                        (acc, p) =>
                                                            acc + p.total,
                                                        0
                                                    )
                                                    .toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-white font-medium">
                                                DESCUENTO:
                                            </span>
                                            <Input
                                                type="number"
                                                min={0}
                                                step="0.01"
                                                value={packageDiscount}
                                                onChange={(e) =>
                                                    setPackageDiscount(
                                                        parseFloat(
                                                            e.target.value
                                                        ) || 0
                                                    )
                                                }
                                                className="w-24 text-right bg-black text-white border border-red-700"
                                            />
                                        </div>
                                        <div className="border-t border-red-600 my-1 w-full" />
                                        <div className="flex justify-between items-center text-white font-semibold">
                                            <span className="text-white font-medium">
                                                TOTAL:
                                            </span>
                                            <span>
                                                $
                                                {Math.max(
                                                    0,
                                                    packages.reduce(
                                                        (acc, p) =>
                                                            acc + p.total,
                                                        0
                                                    ) - packageDiscount
                                                ).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* ADDITIONALS TAB */}
                            <TabsContent
                                value="additionals"
                                className="border border-red-600 rounded p-1 mt-1 space-y-1 bg-black text-white"
                            >
                                <Label className="mb-0.5 font-medium text-white">
                                    Adicionales
                                </Label>

                                <div className="overflow-auto border rounded border-red-700">
                                    <table className="min-w-full text-xs text-left border-collapse">
                                        <thead className="bg-black text-[10px] uppercase text-white tracking-wider border-b border-red-600">
                                            <tr>
                                                <th className="px-2 py-2">
                                                    Cantidad
                                                </th>
                                                <th className="px-2 py-2">
                                                    Unidad
                                                </th>
                                                <th className="px-2 py-2">
                                                    Artículo
                                                </th>
                                                <th className="px-2 py-2 text-right">
                                                    Precio Unitario
                                                </th>
                                                <th className="px-2 py-2 text-right">
                                                    Total
                                                </th>
                                                <th className="px-2 py-2 text-center">
                                                    Acción
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {additionals.map((item, index) => (
                                                <tr
                                                    key={index}
                                                    className="border-t border-red-700 even:bg-[#27273a] hover:bg-[#33334d]"
                                                >
                                                    {/* Cantidad */}
                                                    <td className="px-2 py-1">
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            className="text-right bg-black text-white border border-red-700"
                                                            value={
                                                                item.quantity
                                                            }
                                                            onChange={(e) =>
                                                                updateAdditional(
                                                                    index,
                                                                    "quantity",
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                        />
                                                    </td>

                                                    {/* Unidad */}
                                                    <td className="px-2 py-1">
                                                        <Input
                                                            readOnly
                                                            value={item.unit}
                                                            className="text-center bg-black text-white border border-red-700"
                                                        />
                                                    </td>

                                                    {/* Artículo */}
                                                    <td className="px-2 py-1">
                                                        <Select
                                                            value={item.article}
                                                            onValueChange={(
                                                                value
                                                            ) => {
                                                                const selected =
                                                                    artPackgOptions.find(
                                                                        (opt) =>
                                                                            opt.id ===
                                                                            value
                                                                    );
                                                                if (selected) {
                                                                    const updated =
                                                                        [
                                                                            ...additionals,
                                                                        ];
                                                                    updated[
                                                                        index
                                                                    ] = {
                                                                        ...updated[
                                                                            index
                                                                        ],
                                                                        article:
                                                                            selected.id,
                                                                        unit_price:
                                                                            Number(
                                                                                selected.unit_price
                                                                            ),
                                                                        unit: selected.unit_type,
                                                                    };
                                                                    setAdditionals(
                                                                        updated
                                                                    );
                                                                }
                                                            }}
                                                        >
                                                            <SelectTrigger className="w-full min-w-[160px] h-6 bg-black text-white border border-red-700">
                                                                <SelectValue placeholder="Seleccione" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-black text-white border border-red-700">
                                                                {artPackgOptions.map(
                                                                    (art) => (
                                                                        <SelectItem
                                                                            key={
                                                                                art.id
                                                                            }
                                                                            value={
                                                                                art.id
                                                                            }
                                                                        >
                                                                            {
                                                                                art.name
                                                                            }
                                                                        </SelectItem>
                                                                    )
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                    </td>

                                                    {/* Precio Unitario */}
                                                    <td className="px-2 py-1 text-right">
                                                        <Input
                                                            type="number"
                                                            readOnly
                                                            value={item.unit_price.toFixed(
                                                                2
                                                            )}
                                                            className="text-right bg-black text-white border border-red-700"
                                                        />
                                                    </td>

                                                    {/* Total */}
                                                    <td className="px-2 py-1 text-right">
                                                        $
                                                        {(
                                                            item.quantity *
                                                            item.unit_price
                                                        ).toFixed(2)}
                                                    </td>

                                                    {/* Acción */}
                                                    <td className="px-2 py-1 text-center">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() =>
                                                                removeAdditional(
                                                                    index
                                                                )
                                                            }
                                                            className="text-red-500 hover:text-red-600"
                                                        >
                                                            <Minus className="w-4 h-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}

                                            {/* Total General */}
                                            <tr className="border-t border-red-700">
                                                <td
                                                    colSpan={4}
                                                    className="text-right font-semibold px-2 py-2"
                                                >
                                                    TOTAL:
                                                </td>
                                                <td className="text-right font-bold text-white px-2 py-2">
                                                    {additionals
                                                        .reduce(
                                                            (acc, item) =>
                                                                acc +
                                                                item.quantity *
                                                                    item.unit_price,
                                                            0
                                                        )
                                                        .toFixed(2)}
                                                </td>
                                                <td className="text-center px-2 py-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={addAdditional}
                                                        className="text-green-500 hover:text-green-600"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Tarjeta de Totales */}
                    <div className="md:col-span-1">
                        {/* Tarjeta de Totales */}
                        <Card>
                            <CardContent className="p-2">
                                <h2 className="text-center font-semibold text-white border-b border-red-600 pb-1 mb-1 text-sm">
                                    TOTALES
                                </h2>

                                {/** Cálculos previos */}
                                {(() => {
                                    const round = (num: number) =>
                                        Math.round(num * 100) / 100;

                                    const totalAdditionals = additionals.reduce(
                                        (acc, item) =>
                                            acc +
                                            item.quantity * item.unit_price,
                                        0
                                    );

                                    const totalSeguroPaquete = packages.reduce(
                                        (accPkg, pkg) => {
                                            const seguroPorItems =
                                                pkg.items.reduce(
                                                    (accItem, item) => {
                                                        const name =
                                                            item.name?.toLowerCase() ||
                                                            "";
                                                        const isOroPlata =
                                                            name.includes(
                                                                "oro"
                                                            ) ||
                                                            name.includes(
                                                                "plata"
                                                            );
                                                        const tasa = isOroPlata
                                                            ? 0.15
                                                            : 0.05;
                                                        return (
                                                            accItem +
                                                            item.ins_val * tasa
                                                        );
                                                    },
                                                    0
                                                );
                                            return accPkg + seguroPorItems;
                                        },
                                        0
                                    );

                                    const totalPesoLbs = packages.reduce(
                                        (acc, pkg) => acc + pkg.pounds,
                                        0
                                    );
                                    const agencia = agencyOptions.find(
                                        (a) => a.id === agencyDest
                                    );
                                    const valorTransporte = agencia?.value || 0;
                                    const totalTransporteDestino = round(
                                        valorTransporte * totalPesoLbs
                                    );

                                    const totalSeguroEnvio = totalPesoLbs * 0.1;

                                    // ✅ POR ESTE:
                                    let totalDesaduanizacion = 0;
                                    const algunPaqueteSobre = packages.some(
                                        (pkg) => pkg.service_type === "SOBRE"
                                    );

                                    if (algunPaqueteSobre) {
                                        totalDesaduanizacion = 3.5;
                                    } else if (
                                        totalPesoLbs >= 1 &&
                                        totalPesoLbs <= 17
                                    ) {
                                        totalDesaduanizacion = 6;
                                    } else if (
                                        totalPesoLbs > 17 &&
                                        totalPesoLbs <= 22
                                    ) {
                                        totalDesaduanizacion = 9;
                                    } else if (totalPesoLbs > 22) {
                                        totalDesaduanizacion = 12;
                                    }

                                    // 🟢 Subtotal base SIN transmisión
                                    const subtotalBase = round(
                                        packageTotal +
                                            totalAdditionals +
                                            totalSeguroPaquete +
                                            totalSeguroEnvio +
                                            totalDesaduanizacion +
                                            totalTransporteDestino
                                    );

                                    // ✅ Transmisión es el 1% del subtotal base
                                    const transmision = round(
                                        subtotalBase * 0.01
                                    );

                                    // 🔵 Subtotal final que sí incluye transmisión
                                    const subtotal = round(
                                        subtotalBase + transmision
                                    );

                                    const iva = round(subtotal * 0.15);
                                    const totalFinal = round(subtotal + iva);

                                    const cambio = Math.max(
                                        0,
                                        round(efectivoRecibido - totalFinal)
                                    );
                                    return (
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span>Paquetes</span>
                                                <span>
                                                    ${packageTotal.toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Seguro de paquetes</span>
                                                <span>
                                                    $
                                                    {totalSeguroPaquete.toFixed(
                                                        2
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Embalaje</span>
                                                <span>
                                                    $
                                                    {totalAdditionals.toFixed(
                                                        2
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Seguro de envío</span>
                                                <span>
                                                    $
                                                    {totalSeguroEnvio.toFixed(
                                                        2
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Desaduanización</span>
                                                <span>
                                                    $
                                                    {totalDesaduanizacion.toFixed(
                                                        2
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Transporte destino</span>
                                                <span>
                                                    $
                                                    {totalTransporteDestino.toFixed(
                                                        2
                                                    )}
                                                </span>
                                            </div>

                                            <div className="flex justify-between">
                                                <span>Transmisión</span>
                                                <span>
                                                    ${transmision.toFixed(2)}
                                                </span>{" "}
                                                {/* ✅ Se muestra aquí */}
                                            </div>
                                            <div className="flex justify-between font-semibold">
                                                <span>Subtotal</span>
                                                <span>
                                                    ${subtotal.toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>IVA 15%</span>
                                                <span>${iva.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-pink-500 font-bold border-t pt-1">
                                                <span>TOTAL</span>
                                                <span>
                                                    ${totalFinal.toFixed(2)}
                                                </span>
                                            </div>

                                            {/* Pago */}
                                            <div className="pt-1 space-y-1">
                                                <div className="flex justify-between items-center">
                                                    <Label className="font-medium">
                                                        Forma de cobro
                                                    </Label>
                                                    <Select
                                                        value={payMethod}
                                                        onValueChange={(
                                                            value
                                                        ) => {
                                                            setPayMethod(value);
                                                            if (
                                                                value !==
                                                                "EFECTIVO"
                                                            ) {
                                                                setEfectivoRecibido(
                                                                    0
                                                                ); // Opcional: limpia el efectivo recibido
                                                            }
                                                        }}
                                                    >
                                                        <SelectTrigger className="w-26 bg-black text-white border border-red-600 rounded-md h-8">
                                                            <SelectValue placeholder="Seleccione" />
                                                        </SelectTrigger>

                                                        <SelectContent className="bg-black border border-red-600 text-white">
                                                            <SelectItem value="EFECTIVO">
                                                                EFECTIVO
                                                            </SelectItem>
                                                            <SelectItem value="POR COBRAR">
                                                                POR COBRAR
                                                            </SelectItem>
                                                            <SelectItem value="TRANSFERENCIA">
                                                                TRANSFERENCIA
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="flex justify-between items-center">
                                                    <Label className="font-medium">
                                                        Efectivo recibido
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        className="w-24 text-right"
                                                        min={0}
                                                        value={efectivoRecibido}
                                                        disabled={
                                                            payMethod !==
                                                            "EFECTIVO"
                                                        }
                                                        onChange={(e) => {
                                                            const value =
                                                                parseFloat(
                                                                    e.target
                                                                        .value
                                                                );
                                                            if (
                                                                !isNaN(value) &&
                                                                value >= 0
                                                            ) {
                                                                setEfectivoRecibido(
                                                                    value
                                                                );
                                                            } else {
                                                                setEfectivoRecibido(
                                                                    0
                                                                );
                                                            }
                                                        }}
                                                    />
                                                </div>

                                                <div className="flex justify-between items-center text-pink-500 font-semibold">
                                                    <Label className="font-medium">
                                                        CAMBIO
                                                    </Label>
                                                    <span className="text-xs">
                                                        ${cambio.toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </TooltipProvider>
            <div className="mt-4 flex justify-end">
                <Button
                    className={`bg-green-600 hover:bg-green-700 ${
                        isSaving ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    onClick={handleSaveReception}
                    disabled={isSaving}
                >
                    {isSaving ? "Guardando..." : "Guardar Recepción"}
                </Button>
            </div>
            {/* MODAL DE PAQUETE (nuevo o edición) */}
            <PackageModal
                open={showPackageModal}
                initialRows={packageRowsForEdit}
                onClose={() => {
                    setShowPackageModal(false);
                    setEditingPackageIndex(null);
                }}
                onSave={(rows, serviceType, perfumeDesc) =>
                    handleSavePackage(rows, serviceType, perfumeDesc)
                }
                artPackgOptions={artPackgOptions}
            />

            {/* Modal para CREAR un Sender */}
            <SenderCreateModal
                open={showSenderModal}
                onClose={setShowSenderModal}
                onSenderCreated={handleSenderCreated}
            />

            {/* Modal para BUSCAR/SELECCIONAR un Sender */}
            <SenderSearchModal
                open={showSearchModal}
                onClose={setShowSearchModal}
                onSelect={handleSenderSelect}
            />
            <RecipientCreateModal
                open={showRecipientModal}
                onClose={setShowRecipientModal}
                onRecipientCreated={handleRecipientCreated}
                defaultValues={recipientDefaults}
            />
            <RecipientSearchModal
                open={showRecipientSearch}
                onClose={setShowRecipientSearch}
                onSelect={handleRecipientSelect}
            />

            {/* ✅ MODAL DE ÉXITO */}
            <Dialog open={showSuccessModal} modal={true}>
                <DialogContent className="bg-[#1e1e2f] text-white border border-purple-700">
                    <DialogHeader>
                        <DialogTitle className={modalTitleClass}>
                            {modalTitle}
                        </DialogTitle>
                    </DialogHeader>

                    {/* Mensaje con saltos de línea */}
                    <pre className="p-2 text-sm whitespace-pre-wrap">
                        {modalMessage}
                    </pre>

                    <DialogFooter className="mt-4 flex flex-col md:flex-row md:justify-end gap-2">
                        {/* Botón Cerrar y reseteo de formulario */}
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setShowSuccessModal(false);
                                // Reset formulario
                                setSender({
                                    id: "",
                                    identification: "",
                                    full_name: "",
                                    address: "",
                                    phone: "",
                                    email: "",
                                    postal_code: "",
                                    city: "",
                                    canton: "",
                                    state: "",
                                });
                                setRecipient({
                                    id: "",
                                    identification: "",
                                    full_name: "",
                                    address: "",
                                    phone: "",
                                    email: "",
                                    postal_code: "",
                                    city: "",
                                    canton: "",
                                    state: "",
                                });
                                setPackages([]);
                                setAdditionals([
                                    {
                                        quantity: 0,
                                        unit: "",
                                        article: "",
                                        unit_price: 0,
                                    },
                                ]);
                                setPackageDiscount(0);
                                setEfectivoRecibido(0);
                                setReceptionDate(today);
                                setRoute("ecu-us");

                                axios
                                    .get("/receptions/next-number")
                                    .then((res) =>
                                        setReceptionNumber(res.data.number)
                                    );
                            }}
                        >
                            Cerrar
                        </Button>

                        {/* Enlace al XML autorizado o rechazado */}
                        {modalLink && (
                            <Button
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() => window.open(modalLink, "_blank")}
                            >
                                Ver XML generado
                            </Button>
                        )}

                        {/* Descargar PDF de tickets */}
                        <Button
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={async () => {
                                if (!pdfUrl) {
                                    alert(
                                        "No hay PDF disponible para imprimir."
                                    );
                                    return;
                                }
                                const win = window.open(pdfUrl, "_blank");
                                if (win)
                                    win.onload = () => {
                                        win.focus();
                                        win.print();
                                    };
                                else
                                    alert(
                                        "Pop-ups bloqueados. Habilítalos para imprimir."
                                    );
                            }}
                        >
                            Imprimir Tickets
                        </Button>

                        {/* Descargar factura tipo ticket */}
                        <Button
                            className="bg-indigo-600 hover:bg-indigo-700"
                            disabled={!invoiceId}
                            onClick={() => {
                                if (invoiceId) {
                                    window.open(
                                        `/invoices/${invoiceId}/ticket`,
                                        "_blank"
                                    );
                                }
                            }}
                        >
                            Descargar Factura
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
