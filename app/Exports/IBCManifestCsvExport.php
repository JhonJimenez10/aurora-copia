<?php

namespace App\Exports;

use App\Models\Reception;
use App\Models\Enterprise;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithCustomCsvSettings;

class IBCManifestCsvExport implements FromCollection, WithCustomCsvSettings
{
    protected string $startDate;
    protected string $endDate;
    protected string $enterpriseId;

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
        return str_replace(['ñ', 'Ñ'], ['n', 'N'], $value);
    }

    protected function clip30(?string $value): string
    {
        $t = trim($this->normalizeString($value ?? ''));
        return $t === '' ? '' : mb_substr($t, 0, self::MAX_LEN, 'UTF-8');
    }

    /** Genera las columnas vacías necesarias para completar la fila hasta 54 columnas */
    private function emptyCols(int $count): array
    {
        return array_fill(0, $count, '');
    }

    public function collection(): Collection
    {
        $rows = [];

        $rows[] = ['#'];
        $rows[] = ['#'];
        $rows[] = ['email', '1', 'all', 'gerenica@cuencanitoexpress.com'];
        $rows[] = ['mawb', '1', '72991023376', now()->format('Ymd'), 'GYE', 'JFK', 'AV7394', '72991023376'];
        $rows[] = ['#'];
        $rows[] = [
            '# record_type','record_version','profile_key','hawb','reference','internal_reference',
            'vend_ref_num','origin','final_destination','outlying','service_provider','dsl_station',
            'dls_final_destination','num_pieces','weight','weight_units','contents','currency_code',
            'declared_value','insurance_amount','description','hs_code','fda_prior_notice','terms',
            'packaging','service_type','collect_amount','cust_key','acct_num','dls_acct_num',
            'ext_cust_acct','shipper_name','shipper_address1','shipper_address2','shipper_city',
            'shipper_state','shipper_zip','shipper_country','shipper_phone','consignee_person',
            'consignee_company','consignee_street_1','consignee_street_2','consignee_city',
            'consignee_state','consignee_postal_code','consignee_country','consignee_phone',
            'consignee_email','consignee_tax_id','comments','goods_country_of_origin','container_id',
        ];

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
            foreach ($reception->packages as $package) {
                $barcodeBase = explode('.', (string)($package->barcode ?? ''))[0] ?? '';

                $description = $package->items
                    ->map(fn($item) => $this->normalizeString($item->artPackage?->translation ?? ''))
                    ->filter()
                    ->implode(' ');

                $firstHsCode = $package->items->first()?->artPackage?->codigo_hs ?? '';

                $declaredValue = 0;
                foreach ($package->items as $item) {
                    $declaredValue += (float)(($item->items_declrd ?? 0) * ($item->decl_val ?? 0));
                }

                // Fila HAWB
                $rows[] = [
                    'hawb','14','',
                    $barcodeBase,
                    '','','',
                    'GYE','USA','','','','',
                    1,
                    $package->kilograms ?? '',
                    'KG','APX','USD',
                    $declaredValue,
                    '',
                    $description,
                    $firstHsCode,
                    '','','O','','',
                    '6264','','','',
                    $this->clip30(optional($reception->sender)->full_name),
                    $this->clip30(optional($reception->sender)->address),
                    '',
                    $this->normalizeString(optional($reception->sender)->city),
                    '',
                    $this->normalizeString(optional($reception->sender)->postal_code),
                    'EC',
                    $this->normalizeString(optional($reception->sender)->phone),
                    $this->clip30(optional($reception->recipient)->full_name),
                    '',
                    $this->clip30(optional($reception->recipient)->address),
                    '',
                    $this->normalizeString(optional($reception->recipient)->city),
                    $this->normalizeString(optional($reception->recipient)->state),
                    $this->normalizeString(optional($reception->recipient)->postal_code),
                    'US',
                    $this->normalizeString(optional($reception->recipient)->phone),
                    '','','',
                    'EC','',
                ];

                // Filas commodity + FDA
                foreach ($package->items as $item) {
                    $artTranslation = $this->normalizeString($item->artPackage?->translation ?? '');
                    $artHsCode      = $item->artPackage?->codigo_hs ?? '';
                    $artCategoria   = strtoupper(trim($item->artPackage?->categoria ?? ''));
                    $artCodigoFda   = $item->artPackage?->codigo_fda ?? '';

                    // Fila commodity
                    $rows[] = array_merge([
                        'commodity','4',
                        $item->items_declrd ?? '',
                        $artTranslation,
                        '',
                        $artHsCode,
                        'EC',
                        $item->decl_val ?? '',
                        'USD',
                        $item->kilograms ?? '',
                        'K',
                    ], $this->emptyCols(43));

                    // Fila FDA: solo si categoria es COMIDA o COSMETICOS y tiene codigo_fda
                    if (
                        in_array($artCategoria, ['COMIDA', 'COSMETICOS'], true)
                        && $artCodigoFda !== ''
                    ) {
                        // ✅ CORRECCIÓN: antes siempre se ponía FOO/PRO/FOO/######
                        // sin importar la categoría. Ahora se distingue:
                        //   - COMIDA       -> FOO / PRO / FOO / ######
                        //   - COSMETICOS   -> COS / COS / COS / (vacío)
                        $isFood = $artCategoria === 'COMIDA';

                        $type1 = $isFood ? 'FOO' : 'COS';
                        $type2 = $isFood ? 'PRO' : 'COS';
                        $type3 = $isFood ? 'FOO' : 'COS';
                        $extra = $isFood ? '######' : '';

                        $rows[] = array_merge([
                            'fda','1',
                            $artCodigoFda,
                            $type1, $type2, '100', $type3, $extra,
                            $artTranslation,
                        ], $this->emptyCols(45));

                        // ✅ NUEVO: los alimentos (FOO) requieren además la fila
                        // de "Prior Notice" (commodity_misc / PNC), tal como
                        // exige el manifiesto IBC. Los cosméticos (COS) NO
                        // llevan esta fila — así queda igual que el ejemplo real.
                        if ($isFood) {
                            $rows[] = array_merge([
                                'commodity_misc', '1', 'fda_compliance_code',
                                'PNC', 'PRIORI NOTICE',
                            ], $this->emptyCols(48));
                        }
                    }
                }
            }
        }

        return collect($rows);
    }

    public function getCsvSettings(): array
    {
        return [
            'delimiter'   => ',',
            'enclosure'   => '',
            'line_ending' => PHP_EOL,
            'use_bom'     => true,
        ];
    }
}