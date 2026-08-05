// ─── Tipos compartidos del módulo de Embarques ─────────────────

// Paquete tal como aparece dentro de una saca YA asignada a un embarque.
// transfer_number/transfer_sack_id son opcionales aquí porque en algunos
// puntos del árbol (ej. datos legados) podrían no venir informados.
export interface SackPackage {
    id: string;
    barcode: string;
    content: string;
    service_type: string;
    pounds: number;
    kilograms: number;
    destination_agency?: string | null;
    destination_agency_id?: string | null;
    transfer_sack_id?: string;
    transfer_number?: string;
    enterprise_id?: string | null;
    enterprise_name?: string | null;
}

// Paquete SUELTO disponible para armar una saca (viene de
// /api/shipments/available-sacks, ya desglosado, no agrupado por saca de
// traslado). Estos campos SIEMPRE vienen informados desde el backend,
// por eso aquí son obligatorios (evita el error de "possibly undefined").
export interface AvailablePackage {
    id: string;
    barcode: string;
    content: string;
    service_type: string;
    pounds: number;
    kilograms: number;
    destination_agency?: string | null;
    destination_agency_id?: string | null;
    transfer_sack_id: string;
    transfer_number: string;
    enterprise_id?: string | null;
    enterprise_name?: string | null;
    sack_number: number | null; // no. de saca de TRASLADO de origen (solo referencia)
    from_city: string;
    to_city: string;
}

// Saca YA armada dentro de un embarque, con sus paquetes desglosados.
export interface AssignedSack {
    shipment_sack_id: string;
    id: string;
    sack_number: string;
    from_city: string;
    to_city: string;
    transfer_number: string;
    packages_count: number;
    pounds_total: number;
    kilograms_total: number;
    destination_agencies?: string;
    packages: SackPackage[];
}

export interface ShipmentRow {
    id: string;
    number: string;
    date: string;
    country_origin?: string;
    agency_origin?: string;
    sack_prefix?: string;
    route: string;
    airline: string;
    airport_origin: string;
    airport_dest: string;
    cargo_agency?: string | null;
    palletizer?: string | null;
    open?: boolean;
    status: string;
}
