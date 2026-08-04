<?php

namespace App\Exports;

use App\Models\Reception;
use App\Models\Enterprise;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithHeadings;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class NYManifestExport implements FromCollection, ShouldAutoSize, WithStyles, WithHeadings
{
    protected string $startDate;
    protected string $endDate;
    protected string $enterpriseId;

    // Datos fijos de la entidad (Interline Express)
    private const ENTITY_NAME    = 'INTERLINE EXPRESS';
    private const ENTITY_ADDRESS = '149-15 177th Street';
    private const ENTITY_CITY    = 'Jamaica';
    private const ENTITY_STATE   = 'NY';
    private const ENTITY_ZIP     = '11434';
    private const ENTITY_COUNTRY = 'US';
    private const ENTITY_CONTACT = 'Don Lam';
    private const ENTITY_EMAIL   = 'don@mark3intl.com';
    private const ENTITY_PHONE   = '7189178056';
    private const ENTITY_TYPE    = 'FSV';

    // Datos fijos del shipper (empresa)
    private const COMPANY_NAME    = 'CUENCANITO EXPRESS COURIER & CARGO LOGISTIC S.A.S';
    private const COMPANY_ADDRESS = 'GRAN COLOMBIA 3 76 Y VARGAS MACHUCA';
    private const COMPANY_EMAIL   = 'operacionescue@cuencanitoexpress.com';
    private const COMPANY_ARRIVAL = '104 42 ROOSEVELT AVE';
    private const COMPANY_CITY    = 'QUEENS';
    private const COMPANY_STATE   = 'NY';
    private const COMPANY_COUNTRY = 'SFR';

    private const MAX_LEN = 30;

    public function __construct(string $startDate, string $endDate, string $enterpriseId)
    {
        $this->startDate    = $startDate;
        $this->endDate      = $endDate;
        $this->enterpriseId = $enterpriseId;
    }

    protected function normalizeString(?string $value): string
    {
        if (!$value) return '';
        return str_replace(['ñ', 'Ñ', "\xa0"], ['n', 'N', ' '], trim($value));
    }

    protected function clip(?string $value, int $max = 30): string
    {
        $t = $this->normalizeString($value ?? '');
        return $t === '' ? '' : mb_substr($t, 0, $max, 'UTF-8');
    }

    public function headings(): array
    {
        return [
            'Arrival Airport',          // 1  A
            'Airline Prefix',           // 2  B
            'AWB Serial Number',        // 3  C
            'House AWB',                // 4  D
            'Origin Airport',           // 5  E
            'Pieces',                   // 6  F
            'Weight',                   // 7  G
            'Description',              // 8  H
            'Importing Carrier',        // 9  I
            'Shipper Name',             // 10 J
            'Shipper Street Address',   // 11 K
            'Shipper City',             // 12 L
            'Shipper Country',          // 13 M
            'Consignee Name',           // 14 N
            'Consignee Street Address', // 15 O
            'Consignee City',           // 16 P
            'Consignee State',          // 17 Q
            'Consignee Postal Code',    // 18 R
            'Consignee Country',        // 19 S
            'Customs Value',            // 20 T
            'Currency Code',            // 21 U
            'HTS Code',                 // 22 V
            'Barcode',                  // 23 W
            'Barcode Transit Party',    // 24 X
            'ABV',                      // 25 Y
            'Quantity',                 // 26 Z
            'Height',                   // 27 AA
            'Width',                    // 28 AB
            'Length',                   // 29 AC
            'Shipper EORI',             // 30 AD
            'Consignee Email',          // 31 AE
            'Consignee Phone',          // 32 AF
            'LMP Service',              // 33 AG
            'Customer Transit Party',   // 34 AH
            'Over Label Transit Party', // 35 AI
            'Over Label Service',       // 36 AJ
            'Over Label Dynamic',       // 37 AK
            'ITEM NAME',                // 38 AL
            'Item Hscode',              // 39 AM
            'Item Country',             // 40 AN
            'Item Pieces',              // 41 AO
            'Item Value',               // 42 AP
            'Item Currency',            // 43 AQ
            'Item Weight',              // 44 AR
            'Consignee Company Name',   // 45 AS
            'Selling MID',              // 46 AT
            'Incoterms',                // 47 AU
            'FDAPNCNUMBER',             // 48 AV
            'FDAPRODUCTCODE',           // 49 AW
            'FDAPROGRAMCODE',           // 50 AX
            'FDAPROCESSINGCODE',        // 51 AY
            'FDAINTENDEDUSECODE',       // 52 AZ
            'FDABRANDNAME',             // 53 BA
            'FDAARRIVALTIME',           // 54 BB
            'FDANAME',                  // 55 BC
            'FDAADDRESS',               // 56 BD
            'FDACITY',                  // 57 BE
            'FDACOUNTRY',               // 58 BF
            'FDAREGISTRATIONNUMBERTYPE',// 59 BG
            'FDAREGISTRATIONNUMBER',    // 60 BH
            'FdaEntityName',            // 61 BI
            'FdaEntityAddress',         // 62 BJ
            'FdaEntityCity',            // 63 BK
            'FdaEntityState',           // 64 BL
            'FdaEntityPostalCode',      // 65 BM
            'FdaEntityCountry',         // 66 BN
            'FdaEntityContactName',     // 67 BO
            'FdaEntityContactEmail',    // 68 BP
            'FdaEntityContactPhone',    // 69 BQ
            'FdaEntityType',            // 70 BR
            'FdaEntityIdType',          // 71 BS
            'FdaEntityIdNo',            // 72 BT
        ];
    }

    public function collection(): Collection
    {
        $rows = [];

        $query = Reception::with(['sender', 'recipient', 'packages.items.artPackage'])
            ->whereBetween('date_time', [$this->startDate, $this->endDate])
            ->where('annulled', false);

        if ($this->enterpriseId !== 'all') {
            $query->where('enterprise_id', $this->enterpriseId);
        } else {
            $coavproIds = Enterprise::where('commercial_name', 'COAVPRO')->pluck('id')->toArray();
            if (!empty($coavproIds)) {
                $query->whereNotIn('enterprise_id', $coavproIds);
            }
        }

        $receptions = $query
            ->orderBy('enterprise_id')
            ->orderByDesc('date_time')
            ->get();

        foreach ($receptions as $reception) {
            $sender    = $reception->sender;
            $recipient = $reception->recipient;

            foreach ($reception->packages as $package) {
                $barcodeBase = explode('.', $package->barcode ?? '')[0] ?? '';

                $description = $package->items
                    ->map(fn($i) => $this->normalizeString($i->artPackage?->translation ?? ''))
                    ->filter()
                    ->unique()
                    ->implode(' ');

                $declaredValue = $package->items
                    ->sum(fn($i) => ($i->items_declrd ?? 0) * ($i->decl_val ?? 0));

                $firstHsCode = $package->items->first()?->artPackage?->codigo_hs ?? '';

                foreach ($package->items as $item) {
                    $art          = $item->artPackage;
                    $translation  = $this->normalizeString($art?->translation ?? '');
                    $hsCode       = $art?->codigo_hs ?? '';
                    $categoria    = strtoupper(trim($art?->categoria ?? ''));
                    $codigoFda    = $art?->codigo_fda ?? '';
                    $hasFda       = in_array($categoria, ['COMIDA', 'COSMETICOS'], true) && $codigoFda !== '';

                    if ($hasFda && $categoria === 'COMIDA') {
                        $fdaProductCode    = 'FOO';
                        $fdaProgramCode    = 'PRO';
                        $fdaProcessingCode = '210.00';
                        $fdaIntendedUse    = 'FOO';
                        $fdaName           = self::COMPANY_NAME;
                        $fdaAddress        = self::COMPANY_ARRIVAL;
                        $fdaCity           = self::COMPANY_CITY;
                        $fdaCountry        = self::COMPANY_COUNTRY;
                        $fdaRegType        = null;
                        $fdaRegNumber      = null;
                        $entityName        = self::ENTITY_NAME;
                        $entityAddress     = self::ENTITY_ADDRESS;
                        $entityCity        = self::ENTITY_CITY;
                        $entityState       = self::ENTITY_STATE;
                        $entityZip         = self::ENTITY_ZIP;
                        $entityCountry     = self::ENTITY_COUNTRY;
                        $entityContact     = self::ENTITY_CONTACT;
                        $entityEmail       = self::ENTITY_EMAIL;
                        $entityPhone       = self::ENTITY_PHONE;
                        $entityType        = self::ENTITY_TYPE;
                        $entityIdType      = null;
                        $entityIdNo        = null;
                    } elseif ($hasFda && $categoria === 'COSMETICOS') {
                        $fdaProductCode    = 'COS';
                        $fdaProgramCode    = 'UNK';
                        $fdaProcessingCode = '130.00';
                        $fdaIntendedUse    = null;
                        $fdaName           = null;
                        $fdaAddress        = null;
                        $fdaCity           = null;
                        $fdaCountry        = null;
                        $fdaRegType        = null;
                        $fdaRegNumber      = null;
                        $entityName        = null;
                        $entityAddress     = null;
                        $entityCity        = null;
                        $entityState       = null;
                        $entityZip         = null;
                        $entityCountry     = null;
                        $entityContact     = null;
                        $entityEmail       = null;
                        $entityPhone       = null;
                        $entityType        = null;
                        $entityIdType      = null;
                        $entityIdNo        = null;
                    } else {
                        $fdaProductCode    = null;
                        $fdaProgramCode    = null;
                        $fdaProcessingCode = null;
                        $fdaIntendedUse    = null;
                        $fdaName           = null;
                        $fdaAddress        = null;
                        $fdaCity           = null;
                        $fdaCountry        = null;
                        $fdaRegType        = null;
                        $fdaRegNumber      = null;
                        $entityName        = null;
                        $entityAddress     = null;
                        $entityCity        = null;
                        $entityState       = null;
                        $entityZip         = null;
                        $entityCountry     = null;
                        $entityContact     = null;
                        $entityEmail       = null;
                        $entityPhone       = null;
                        $entityType        = null;
                        $entityIdType      = null;
                        $entityIdNo        = null;
                    }

                    $rows[] = [
                        // 1-9: datos vuelo/paquete
                        'JFK',                                              // 1  A  Arrival Airport
                        729,                                                // 2  B  Airline Prefix
                        '9121 3673',                                        // 3  C  AWB Serial Number
                        $barcodeBase,                                       // 4  D  House AWB
                        'GYE',                                              // 5  E  Origin Airport
                        1,                                                  // 6  F  Pieces
                        $package->kilograms ?? 0,                          // 7  G  Weight
                        $description,                                       // 8  H  Description
                        'AV',                                               // 9  I  Importing Carrier
                        // 10-13: shipper
                        $this->clip(optional($sender)->full_name),         // 10 J  Shipper Name
                        $this->clip(optional($sender)->address),           // 11 K  Shipper Street Address
                        $this->normalizeString(optional($sender)->city),   // 12 L  Shipper City
                        'EC',                                               // 13 M  Shipper Country
                        // 14-19: consignee
                        $this->clip(optional($recipient)->full_name),      // 14 N  Consignee Name
                        $this->clip(optional($recipient)->address),        // 15 O  Consignee Street Address
                        $this->normalizeString(optional($recipient)->city),// 16 P  Consignee City
                        $this->normalizeString(optional($recipient)->state),// 17 Q Consignee State
                        $this->normalizeString(optional($recipient)->postal_code), // 18 R Consignee Postal Code
                        'US',                                               // 19 S  Consignee Country
                        // 20-22: valores
                        $declaredValue,                                     // 20 T  Customs Value
                        'USD',                                              // 21 U  Currency Code
                        $firstHsCode,                                       // 22 V  HTS Code
                        // 23-29: vacíos
                        null,                                               // 23 W  Barcode
                        null,                                               // 24 X  Barcode Transit Party
                        null,                                               // 25 Y  ABV
                        null,                                               // 26 Z  Quantity
                        null,                                               // 27 AA Height
                        null,                                               // 28 AB Width
                        null,                                               // 29 AC Length
                        // 30-32: email y teléfono del consignee
                        null,                                               // 30 AD Shipper EORI  ← vacío
                        self::COMPANY_EMAIL,                               // 31 AE Consignee Email ← CORRECTO
                        $this->normalizeString(optional($recipient)->phone), // 32 AF Consignee Phone ← CORRECTO
                        // 33-37: vacíos
                        null,                                               // 33 AG LMP Service
                        null,                                               // 34 AH Customer Transit Party
                        null,                                               // 35 AI Over Label Transit Party
                        null,                                               // 36 AJ Over Label Service
                        null,                                               // 37 AK Over Label Dynamic
                        // 38-44: datos del ítem
                        $translation,                                       // 38 AL ITEM NAME
                        $hsCode,                                            // 39 AM Item Hscode
                        'EC',                                               // 40 AN Item Country
                        $item->items_declrd ?? '',                         // 41 AO Item Pieces
                        $item->decl_val ?? '',                             // 42 AP Item Value
                        'USD',                                              // 43 AQ Item Currency
                        $item->kilograms ?? '',                            // 44 AR Item Weight
                        // 45-47: empresa
                        self::COMPANY_NAME,                                // 45 AS Consignee Company Name
                        self::COMPANY_ADDRESS,                             // 46 AT Selling MID
                        null,                                               // 47 AU Incoterms
                        // 48-72: FDA
                        $hasFda ? $codigoFda : null,                       // 48 AV FDAPNCNUMBER
                        $fdaProductCode,                                    // 49 AW FDAPRODUCTCODE
                        $fdaProgramCode,                                    // 50 AX FDAPROGRAMCODE
                        $fdaProcessingCode,                                 // 51 AY FDAPROCESSINGCODE
                        $fdaIntendedUse,                                    // 52 AZ FDAINTENDEDUSECODE
                        null,                                               // 53 BA FDABRANDNAME
                        null,                                               // 54 BB FDAARRIVALTIME
                        $fdaName,                                           // 55 BC FDANAME
                        $fdaAddress,                                        // 56 BD FDAADDRESS
                        $fdaCity,                                           // 57 BE FDACITY
                        $fdaCountry,                                        // 58 BF FDACOUNTRY
                        $fdaRegType,                                        // 59 BG FDAREGISTRATIONNUMBERTYPE
                        $fdaRegNumber,                                      // 60 BH FDAREGISTRATIONNUMBER
                        $entityName,                                        // 61 BI FdaEntityName
                        $entityAddress,                                     // 62 BJ FdaEntityAddress
                        $entityCity,                                        // 63 BK FdaEntityCity
                        $entityState,                                       // 64 BL FdaEntityState
                        $entityZip,                                         // 65 BM FdaEntityPostalCode
                        $entityCountry,                                     // 66 BN FdaEntityCountry
                        $entityContact,                                     // 67 BO FdaEntityContactName
                        $entityEmail,                                       // 68 BP FdaEntityContactEmail
                        $entityPhone,                                       // 69 BQ FdaEntityContactPhone
                        $entityType,                                        // 70 BR FdaEntityType
                        $entityIdType,                                      // 71 BS FdaEntityIdType
                        $entityIdNo,                                        // 72 BT FdaEntityIdNo
                    ];
                }
            }
        }

        return collect($rows);
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->getStyle('1:1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '1F4E79']],
        ]);
        $sheet->getStyle($sheet->calculateWorksheetDimension())->applyFromArray([
            'font' => ['name' => 'Arial', 'size' => 10],
        ]);
        return [];
    }
}