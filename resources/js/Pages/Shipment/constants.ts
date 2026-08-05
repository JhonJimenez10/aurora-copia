// ─── Constantes compartidas del módulo de Embarques ────────────

export const SACK_PREFIX_OPTIONS = ["B", "C", "D", "E", "F", "G", "H"];

export const AIRLINE_OPTIONS = [
    "AEROMEXICO",
    "AVIANCA",
    "COPA",
    "LATAM",
    "DELTA",
    "DHL",
];

// Prefijo numérico fijo que corresponde al número de embarque según la aerolínea
export const AIRLINE_NUMBER_PREFIX: Record<string, string> = {
    AEROMEXICO: "139",
    AVIANCA: "729",
    COPA: "230",
    LATAM: "145",
    DELTA: "006",
    DHL: "155",
};

// País y agencia de origen: siempre fijos, no editables por el usuario
export const FIXED_COUNTRY_ORIGIN = "ECUADOR";
export const FIXED_AGENCY_ORIGIN = "CUENCA";

// Ruta: por ahora un único destino disponible, pre-seleccionado
export const ROUTE_OPTIONS = ["ECUADOR - ESTADOS UNIDOS"];
export const DEFAULT_ROUTE = ROUTE_OPTIONS[0];

export const AIRPORT_ORIGIN_OPTIONS = [
    "GUAYAQUIL - JOSE JOAQUIN DE OLMEDO",
    "QUITO - MARISCAL SUCRE",
];

export const AIRPORT_DEST_OPTIONS = ["CHICAGO-O'HARE", "JOHN F.KENNEDY"];

export const CARGO_AGENCY_OPTIONS = [
    "CARGO FLEX",
    "DOLY CARGO",
    "ECUADOR CARGO GYE",
    "ECUADOR CARGO QUITO",
    "FERVA CARGO",
    "MULTIMODAL",
    "NAAS LOGISTICS",
    "TRANSOCEANICA",
];

export const PALLETIZER_OPTIONS = [
    "EXP AIR",
    "GENERAL AIR",
    "NOVACARGO",
    "PETRALI",
];

export const inputCls =
    "w-full bg-[#111] border border-red-900/50 text-white rounded-md px-3 py-2 text-sm " +
    "focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 " +
    "placeholder:text-gray-600 transition-colors";

export const inputLockedCls =
    "w-full bg-[#0a0a0a] border border-red-900/20 text-gray-400 rounded-md px-3 py-2 text-sm " +
    "cursor-not-allowed select-none";

export const selectCls =
    "w-full bg-[#111] border border-red-900/50 text-white rounded-md px-3 py-2 text-sm " +
    "focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 " +
    "transition-colors cursor-pointer appearance-none " +
    "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23f87171%22 stroke-width=%222%22><polyline points=%226 9 12 15 18 9%22></polyline></svg>')] " +
    "bg-no-repeat bg-[right_0.75rem_center] bg-[length:16px] pr-9";
