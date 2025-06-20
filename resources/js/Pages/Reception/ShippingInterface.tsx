"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
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

export default function ShippingInterface() {
    const { auth } = usePage().props as any;
    const enterpriseId = auth.user.enterprise_id;
    const [currentTab, setCurrentTab] = useState("sender");
    // ⏬  dentro del componente:
    const [recipientDefaults, setRecipientDefaults] = useState<Partial<Person>>(
        {}
    );
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
    const [payMethod, setPayMethod] = useState<string>("efectivo");
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
        // 1) cálculos y validaciones previas
        const packagingTotal = additionals.reduce(
            (acc, a) => acc + a.quantity * a.unit_price,
            0
        );
        const subtotal = packageTotal + packagingTotal;
        const vat = subtotal * 0.15;
        const total = subtotal + vat;
        const change = Math.max(0, efectivoRecibido - total);

        if (!agencyDest) {
            alert("Por favor seleccione una agencia de destino.");
            return;
        }
        if (efectivoRecibido < total) {
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
            ins_pkg: 0,
            packaging: packagingTotal,
            ship_ins: 0,
            clearance: 0,
            trans_dest: 0,
            transmit: 0,
            subtotal,
            vat15: vat,
            total,
            pay_method: payMethod,
            cash_recv: efectivoRecibido,
            change,
            packages,
            additionals,
        };

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

    const handleSavePackage = (rows: PackageRow[]) => {
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
            service_type: rows[0].unidad,
            content: contenido, // ← aquí ya tienes lo que viste en el modal
            pounds: totalLbs,
            kilograms: totalLbs * 0.453592,
            total: totalTotal,
            decl_val: totalDecl,
            ins_val: totalIns,
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

    return (
        <div className="max-w-6xl mx-auto p-4 bg-[#1e1e2f] text-white border border-purple-700 rounded-xl shadow-xl text-xs">
            <TooltipProvider>
                {/* Cabecera */}
                <div className="flex items-center justify-between mb-1">
                    <h1 className="text-base font-bold">RECEPCIÓN</h1>
                    <div className="flex space-x-1">
                        <Button variant="ghost" size="icon">
                            <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                            <Clipboard className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                            <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                            <Printer className="h-4 w-4" />
                        </Button>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={openSearchModal}
                                >
                                    <Search className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="text-[10px]">Search Sender</p>
                            </TooltipContent>
                        </Tooltip>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="text-center mb-1">
                    <span className="text-pink-500 text-[10px]">
                        Nuevo registro...
                    </span>
                </div>

                {/* Datos principales */}
                <div className="grid grid-cols-3 gap-2 mb-2">
                    {/* Number */}
                    <div className="flex flex-col">
                        <Label className="mb-0.5 font-medium">Número:</Label>
                        <Input
                            value={receptionNumber}
                            className="w-full"
                            readOnly
                        />
                    </div>
                    {/* Route */}
                    <div className="flex flex-col">
                        <Label className="mb-0.5 font-medium">Ruta</Label>
                        <Select
                            value={route}
                            onValueChange={(val) => setRoute(val)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="ECUADOR - ESTADOS UNIDOS" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ecu-us">
                                    ECUADOR - ESTADOS UNIDOS
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {/* Date */}
                    <div className="flex flex-col">
                        <Label className="mb-0.5 font-medium">
                            Fecha y hora:
                        </Label>
                        <Input
                            type="date"
                            className="w-full text-white bg-transparent border
             [&::-webkit-calendar-picker-indicator]:invert
             [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                            value={receptionDate}
                            onChange={(e) => setReceptionDate(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2">
                    {/* Ag. origen */}
                    <div className="flex flex-col">
                        <Label className="mb-0.5 font-medium">Ag. origen</Label>
                        <Input value="CUENCA CENTRO" readOnly />
                    </div>
                    {/* Ag. destino */}
                    <div className="flex flex-col">
                        <Label className="mb-0.5 font-medium">
                            Ag. destino
                        </Label>
                        <Select
                            value={agencyDest}
                            onValueChange={setAgencyDest}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Seleccionar destino" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="QUEENS">QUEENS</SelectItem>
                                <SelectItem value="MIAMI">MIAMI</SelectItem>
                                <SelectItem value="LOS ANGELES">
                                    LOS ANGELES
                                </SelectItem>
                            </SelectContent>
                        </Select>
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
                            <TabsList className="w-full grid grid-cols-4 bg-muted text-muted-foreground text-[10px] rounded-none">
                                <TabsTrigger value="sender" className="py-1">
                                    REMITENTE
                                </TabsTrigger>
                                <TabsTrigger value="recipient" className="py-1">
                                    DESTINATARIO
                                </TabsTrigger>
                                <TabsTrigger value="packages" className="py-1">
                                    PAQUETES
                                </TabsTrigger>
                                <TabsTrigger
                                    value="additionals"
                                    className="py-1"
                                >
                                    ADICIONALES
                                </TabsTrigger>
                            </TabsList>

                            {/* SENDER TAB */}
                            <TabsContent
                                value="sender"
                                className="border rounded p-1 mt-1 space-y-1"
                            >
                                <div className="flex justify-between items-center">
                                    <Label className="font-medium">
                                        Identificación
                                    </Label>
                                    <div className="flex space-x-1">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={openSearchModal}
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
                                                >
                                                    <Plus className="w-4 h-4 text-green-500" />
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
                                    value={sender.identification}
                                    onChange={(e) =>
                                        setSender({
                                            ...sender,
                                            identification: e.target.value,
                                        })
                                    }
                                />
                                <Label className="font-medium">
                                    Apellidos y nombres
                                </Label>
                                <Input
                                    value={sender.full_name}
                                    onChange={(e) =>
                                        setSender({
                                            ...sender,
                                            full_name: e.target.value,
                                        })
                                    }
                                />
                                <Label className="font-medium">Dirección</Label>
                                <Input
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
                                        <Label className="font-medium">
                                            Celular
                                        </Label>
                                        <Input
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
                                        <Label className="font-medium">
                                            Correo electrónico
                                        </Label>
                                        <Input
                                            type="email"
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
                                        <Label className="font-medium">
                                            Código postal
                                        </Label>
                                        <Input
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
                                        <Label className="font-medium">
                                            Parroquia/City
                                        </Label>
                                        <Input
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
                                        <Label className="font-medium">
                                            Cantón / Country
                                        </Label>
                                        <Input
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
                                    <Label className="font-medium">
                                        Provincia / State
                                    </Label>
                                    <Input
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
                            <TabsContent
                                value="recipient"
                                className="border rounded p-1 mt-1 space-y-1"
                            >
                                <div className="flex justify-between items-center">
                                    <Label className="font-medium">
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
                                                >
                                                    <Plus className="w-4 h-4 text-green-500" />
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
                                />
                                <Label className="font-medium">
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
                                />
                                <Label className="font-medium">Dirección</Label>
                                <Input
                                    value={recipient.address}
                                    onChange={(e) =>
                                        setRecipient({
                                            ...recipient,
                                            address: e.target.value,
                                        })
                                    }
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                                    <div>
                                        <Label className="font-medium">
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
                                        />
                                    </div>
                                    <div>
                                        <Label className="font-medium">
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
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
                                    <div>
                                        <Label className="font-medium">
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
                                        />
                                    </div>
                                    <div>
                                        <Label className="font-medium">
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
                                        />
                                    </div>
                                    <div>
                                        <Label className="font-medium">
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
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label className="font-medium">
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
                                    />
                                </div>
                            </TabsContent>

                            {/* PACKAGES TAB */}
                            <TabsContent
                                value="packages"
                                className="border rounded p-1 mt-1 space-y-1"
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <Label className="text-sm text-blue-400 font-semibold">
                                        Paquetes
                                    </Label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    setShowPackageModal(true)
                                                }
                                            >
                                                <Plus className="w-4 h-4 text-green-500" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="text-[10px]">
                                                Agregar
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>

                                <div className="overflow-auto border rounded border-purple-700">
                                    <table className="min-w-full text-xs text-left border-collapse">
                                        <thead className="bg-[#2a2a3d] text-[10px] uppercase text-purple-300 tracking-wider">
                                            <tr>
                                                <th className="px-2 py-2 border-b border-purple-700">
                                                    Tipo Servicio
                                                </th>
                                                <th className="px-2 py-2 border-b border-purple-700">
                                                    Contenido
                                                </th>
                                                <th className="px-2 py-2 border-b border-purple-700 text-right">
                                                    Peso (lbs)
                                                </th>
                                                <th className="px-2 py-2 border-b border-purple-700 text-right">
                                                    Peso (kg)
                                                </th>
                                                <th className="px-2 py-2 border-b border-purple-700 text-right">
                                                    Valor
                                                </th>
                                                <th className="px-2 py-2 border-b border-purple-700 text-right">
                                                    V.Declarado
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {packages.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={6}
                                                        className="text-center text-muted-foreground py-3"
                                                    >
                                                        No hay paquetes añadidos
                                                        todavía
                                                    </td>
                                                </tr>
                                            ) : (
                                                packages.map((pkg, idx) => (
                                                    <tr
                                                        key={idx}
                                                        onClick={() =>
                                                            openEditPackageModal(
                                                                idx
                                                            )
                                                        }
                                                        className="border-t border-purple-800 even:bg-[#27273a] hover:bg-[#33334d] transition-all cursor-pointer"
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
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Fila SUBTOTAL / DESCUENTO / TOTAL */}
                                <div className="flex justify-end mt-3 pr-1">
                                    <div className="w-full md:w-[320px] space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-white font-medium">
                                                SUBTOTAL:
                                            </span>
                                            <span className="text-right">
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
                                                className="w-24 text-right bg-[#1e1e2f] text-white border border-gray-600"
                                            />
                                        </div>
                                        <div className="border-t border-purple-700 my-1 w-full" />
                                        <div className="flex justify-between items-center text-blue-400 font-semibold">
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
                                className="border rounded p-1 mt-1 space-y-2"
                            >
                                <Label className="text-sm text-blue-400 font-semibold">
                                    Adicionales
                                </Label>
                                <div className="overflow-auto border rounded border-purple-700">
                                    <table className="min-w-full text-xs text-left border-collapse">
                                        <thead className="bg-[#2a2a3d] text-[10px] uppercase text-purple-300 tracking-wider">
                                            <tr>
                                                <th className="px-2 py-2 border-b border-purple-700">
                                                    Cantidad
                                                </th>
                                                <th className="px-2 py-2 border-b border-purple-700">
                                                    Unidad
                                                </th>
                                                <th className="px-2 py-2 border-b border-purple-700">
                                                    Artículo
                                                </th>
                                                <th className="px-2 py-2 border-b border-purple-700 text-right">
                                                    Precio Unitario
                                                </th>
                                                <th className="px-2 py-2 border-b border-purple-700 text-right">
                                                    Total
                                                </th>
                                                <th className="px-2 py-2 border-b border-purple-700 text-center">
                                                    Acción
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {additionals.map((item, index) => (
                                                <tr
                                                    key={index}
                                                    className="border-t border-purple-800 even:bg-[#27273a] hover:bg-[#33334d] transition-all"
                                                >
                                                    {/* CANTIDAD */}
                                                    <td className="px-2 py-1">
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            className="text-right bg-[#1e1e2f] text-white border border-gray-600"
                                                            value={
                                                                item.quantity
                                                            }
                                                            onChange={(e) => {
                                                                const value =
                                                                    Math.max(
                                                                        0,
                                                                        parseFloat(
                                                                            e
                                                                                .target
                                                                                .value
                                                                        ) || 0
                                                                    );
                                                                updateAdditional(
                                                                    index,
                                                                    "quantity",
                                                                    value.toString()
                                                                );
                                                            }}
                                                        />
                                                    </td>

                                                    {/* UNIDAD */}
                                                    <td className="px-2 py-1">
                                                        <Input
                                                            readOnly
                                                            value={item.unit}
                                                            className="text-center bg-[#1e1e2f] text-white border border-gray-600"
                                                        />
                                                    </td>

                                                    {/* ARTÍCULO */}
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
                                                            <SelectTrigger className="w-full min-w-[180px] h-6 bg-[#2a2a3d] text-white border border-gray-600">
                                                                <SelectValue placeholder="Artículo seleccionado" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-[#2a2a3d] text-white">
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

                                                    {/* PRECIO UNITARIO */}
                                                    <td className="px-2 py-1 text-right">
                                                        <Input
                                                            type="number"
                                                            readOnly
                                                            value={item.unit_price.toFixed(
                                                                2
                                                            )}
                                                            className="text-right bg-[#1e1e2f] text-white border border-gray-600"
                                                        />
                                                    </td>

                                                    {/* TOTAL */}
                                                    <td className="px-2 py-1 text-right">
                                                        {(
                                                            item.quantity *
                                                            item.unit_price
                                                        ).toFixed(2)}
                                                    </td>

                                                    {/* ACCIÓN: REMOVE */}
                                                    <td className="px-2 py-1 text-center">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() =>
                                                                removeAdditional(
                                                                    index
                                                                )
                                                            }
                                                        >
                                                            <span className="text-lg text-red-500">
                                                                −
                                                            </span>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}

                                            {/* TOTAL GENERAL */}
                                            <tr className="border-t border-purple-800">
                                                <td
                                                    colSpan={4}
                                                    className="text-right font-semibold px-2 py-2"
                                                >
                                                    TOTAL:
                                                </td>
                                                <td className="text-right font-bold text-blue-400 px-2 py-2">
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
                                                    >
                                                        <Plus className="w-4 h-4 text-green-500" />
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
                                <h2 className="text-center font-semibold text-blue-500 border-b pb-1 mb-1 text-sm">
                                    TOTALES
                                </h2>

                                {/** Cálculos previos */}
                                {(() => {
                                    const totalAdditionals = additionals.reduce(
                                        (acc, item) =>
                                            acc +
                                            item.quantity * item.unit_price,
                                        0
                                    );
                                    const subtotal =
                                        packageTotal + totalAdditionals;
                                    const iva = subtotal * 0.15;
                                    const totalFinal = subtotal + iva;
                                    const cambio = Math.max(
                                        0,
                                        efectivoRecibido - totalFinal
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
                                                <span>$0.00</span>
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
                                                <span>$0.00</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Desaduanización</span>
                                                <span>$0.00</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Transporte destino</span>
                                                <span>$0.00</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Transmisión</span>
                                                <span>$0.00</span>
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
                                                        onValueChange={
                                                            setPayMethod
                                                        }
                                                    >
                                                        <SelectTrigger className="w-24">
                                                            <SelectValue placeholder="Seleccione" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="EFECTIVO">
                                                                EFECTIVO
                                                            </SelectItem>
                                                            <SelectItem value="TARJETA">
                                                                TARJETA
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
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleSaveReception}
                >
                    Guardar Recepción
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
                onSave={handleSavePackage}
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
            <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
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

                        {/* Descargar factura en PDF */}
                        <Button
                            className="bg-yellow-600 hover:bg-yellow-700"
                            disabled={!invoiceId}
                            onClick={() => {
                                if (invoiceId) {
                                    window.open(
                                        `/invoices/${invoiceId}/pdf`,
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
