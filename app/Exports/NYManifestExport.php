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
            'Arrival Airport', 'Airline Prefix', 'AWB Serial Number', 'House AWB',
            'Origin Airport', 'Pieces', 'Weight', 'Description', 'Importing Carrier',
            'Shipper Name', 'Shipper Street Address', 'Shipper City', 'Shipper Country',
            'Consignee Name', 'Consignee Street Address', 'Consignee City', 'Consignee State',
            'Consignee Postal Code', 'Consignee Country', 'Customs Value', 'Currency Code',
            'HTS Code', 'Barcode', 'Barcode Transit Party', 'ABV', 'Quantity', 'Height',
            'Width', 'Length', 'Shipper EORI', 'Consignee Email', 'Consignee Phone',
            'LMP Service', 'Customer Transit Party', 'Over Label Transit Party',
            'Over Label Service', 'Over Label Dynamic', 'ITEM NAME', 'Item Hscode',
            'Item Country', 'Item Pieces', 'Item Value', 'Item Currency', 'Item Weight',
            'Consignee Company Name', 'Selling MID', 'Incoterms',
            'FDAPNCNUMBER', 'FDAPRODUCTCODE', 'FDAPROGRAMCODE', 'FDAPROCESSINGCODE',
            'FDAINTENDEDUSECODE', 'FDABRANDNAME', 'FDAARRIVALTIME', 'FDANAME',
            'FDAADDRESS', 'FDACITY', 'FDACOUNTRY', 'FDAREGISTRATIONNUMBERTYPE',
            'FDAREGISTRATIONNUMBER', 'FdaEntityName', 'FdaEntityAddress', 'FdaEntityCity',
            'FdaEntityState', 'FdaEntityPostalCode', 'FdaEntityCountry',
            'FdaEntityContactName', 'FdaEntityContactEmail', 'FdaEntityContactPhone',
            'FdaEntityType', 'FdaEntityIdType', 'FdaEntityIdNo',
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

                // Descripción completa del paquete (todas las traducciones)
                $description = $package->items
                    ->map(fn($i) => $this->normalizeString($i->artPackage?->translation ?? ''))
                    ->filter()
                    ->unique()
                    ->implode(' ');

                // Valor declarado total del paquete
                $declaredValue = $package->items
                    ->sum(fn($i) => ($i->items_declrd ?? 0) * ($i->decl_val ?? 0));

                // HS Code principal (primer artículo)
                $firstHsCode = $package->items->first()?->artPackage?->codigo_hs ?? '';

                // Una fila por artículo
                foreach ($package->items as $item) {
                    $art          = $item->artPackage;
                    $translation  = $this->normalizeString($art?->translation ?? '');
                    $hsCode       = $art?->codigo_hs ?? '';
                    $categoria    = strtoupper(trim($art?->categoria ?? ''));
                    $codigoFda    = $art?->codigo_fda ?? '';
                    $hasFda       = in_array($categoria, ['COMIDA', 'COSMETICOS'], true) && $codigoFda !== '';

                    // Determinar datos FDA según categoría
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
                        // Cols 1-9: datos vuelo/paquete
                        'JFK',
                        729,
                        '9121 3673',
                        $barcodeBase,
                        'GYE',
                        1,
                        $package->kilograms ?? 0,
                        $description,
                        'AV',
                        // Cols 10-13: shipper
                        $this->clip(optional($sender)->full_name),
                        $this->clip(optional($sender)->address),
                        $this->normalizeString(optional($sender)->city),
                        'EC',
                        // Cols 14-19: consignee
                        $this->clip(optional($recipient)->full_name),
                        $this->clip(optional($recipient)->address),
                        $this->normalizeString(optional($recipient)->city),
                        $this->normalizeString(optional($recipient)->state),
                        $this->normalizeString(optional($recipient)->postal_code),
                        'US',
                        // Cols 20-22: valores
                        $declaredValue,
                        'USD',
                        $firstHsCode,
                        // Cols 23-29: vacíos
                        null, null, null, null, null, null, null,
                        // Cols 30-32: contacto consignee
                        self::COMPANY_EMAIL,
                        $this->normalizeString(optional($recipient)->phone),
                        null,
                        // Cols 33-37: vacíos
                        null, null, null, null, null,
                        // Cols 38-44: datos del ítem
                        $translation,
                        $hsCode,
                        'EC',
                        $item->items_declrd ?? '',
                        $item->decl_val ?? '',
                        'USD',
                        $item->kilograms ?? '',
                        // Cols 45-47: empresa
                        self::COMPANY_NAME,
                        self::COMPANY_ADDRESS,
                        null,
                        // Cols 48-72: FDA
                        $hasFda ? $codigoFda : null,
                        $fdaProductCode,
                        $fdaProgramCode,
                        $fdaProcessingCode,
                        $fdaIntendedUse,
                        null, // FDABRANDNAME
                        null, // FDAARRIVALTIME
                        $fdaName,
                        $fdaAddress,
                        $fdaCity,
                        $fdaCountry,
                        $fdaRegType,
                        $fdaRegNumber,
                        $entityName,
                        $entityAddress,
                        $entityCity,
                        $entityState,
                        $entityZip,
                        $entityCountry,
                        $entityContact,
                        $entityEmail,
                        $entityPhone,
                        $entityType,
                        $entityIdType,
                        $entityIdNo,
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