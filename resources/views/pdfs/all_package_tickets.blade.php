<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <style>
        @page {
            margin-top: 0mm;
        }

        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 9px;
            color: #111;
            margin: 2px 8px 4px 8px;
        }

        .center {
            text-align: center;
        }

        .barcode-container {
            margin-top: 0;
            margin-bottom: 3px;
        }

        .barcode {
            display: inline-block;
            margin-bottom: 0;
            transform: scale(0.7);
            transform-origin: top center;
        }

        .bold {
            font-weight: bold;
        }

        .red {
            color: #d10000;
        }

        .green {
            color: #008000;
        }

        .section {
            margin-top: 6px;
            padding-top: 4px;
            border-top: 1px solid #aaa;
        }

        .section-title {
            background-color: #f2f2f2;
            font-weight: bold;
            font-size: 11px;
            padding: 2px 3px;
            border-left: 3px solid #333;
            margin-bottom: 3px;
        }

        .info-line {
            margin: 1px 0;
            line-height: 1.5;
        }

        /* Teléfono más grande */
        .info-line.phone {
            font-size: 12px;
            font-weight: bold;
            margin-top: 2px;
        }

        .icon {
            display: inline-block;
            width: 10px;
            font-weight: bold;
            margin-right: 2px;
            text-align: center;
        }

        .bridgeport-title {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            margin-top: 5px;
            margin-bottom: 3px;
        }

        .details-table {
            width: 100%;
            margin: 4px 0;
            border-collapse: collapse;
        }

        .details-table td {
            vertical-align: top;
            padding: 1px 3px;
            width: 50%;
            line-height: 1.4;
        }

        .dual-section {
            display: table;
            width: 100%;
            margin-top: 6px;
            padding-top: 4px;
            border-top: 1px solid #aaa;
        }

        .dual-section .column {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            padding: 0 4px;
        }

        /* Estado de pago — más grande */
        .pay-status {
            text-align: center;
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 4px;
            letter-spacing: 1px;
        }

        /* Total al cobro — más grande */
        .pay-amount {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 4px;
        }

        .page-break {
            page-break-after: always;
        }
    </style>
</head>

<body>

    @foreach ($barcodes as $item)
        @php
            $package = $item['package'];
            $barcode = $item['barcode'];
            $payMethod = strtoupper($reception->pay_method);
            $isPagado = in_array($payMethod, ['EFECTIVO', 'TRANSFERENCIA']);
            $isPorCobrar = $payMethod === 'POR COBRAR';
            $weightLbs = is_numeric($package->pounds) ? floatval($package->pounds) : 0;
            $weightKgs = $weightLbs * 0.453592;
            $agencyDestName = $reception->agencyDest->name ?? 'AGENCIA DESTINO';
        @endphp

        {{-- Código de barras --}}
        <div class="barcode-container center" style="padding-top: 0;">
            <div class="barcode">{!! $barcode !!}</div>
            <div class="bold" style="font-size: 10px;">{{ $package->barcode ?? '---' }}</div>
        </div>

        {{-- Indicador de Pago (más grande) --}}
        @if ($isPorCobrar)
            <div class="pay-status red">POR COBRAR</div>
            <div class="pay-amount red">${{ number_format($reception->total, 2) }}</div>
        @elseif ($isPagado)
            <div class="pay-status green">PAGADO</div>
        @endif

        {{-- Datos generales --}}
        <table class="details-table">
            <tr>
                <td><span class="bold">No. Comprobante:</span> {{ $reception->number }}</td>
                <td><span class="bold">FECHA:</span>
                    {{ \Carbon\Carbon::parse($reception->date_time)->format('Y-m-d') }}</td>
            </tr>
            <tr>
                @php
                    $contentNames = $package->packageItems
                        ->map(fn($item) => $item->artPackage->name ?? 'Artículo')
                        ->toArray();
                @endphp
                <td><span class="bold">CONTENIDO:</span> {{ implode(', ', $contentNames) }}</td>
                <td><span class="bold">PESO LBS:</span> {{ number_format($weightLbs, 2) }}</td>
            </tr>
            <tr>
                <td>
                    @if ($isPorCobrar)
                        <span class="bold">AL COBRO:</span>
                        <span class="red bold">${{ number_format($reception->total, 2) }}</span>
                    @else
                        <span class="bold green">PAGADO</span>
                    @endif
                </td>
                <td><span class="bold">PESO KGS:</span> {{ number_format($weightKgs, 2) }}</td>
            </tr>
        </table>

        {{-- Agencia de destino --}}
        <div class="bridgeport-title">{{ $agencyDestName }}</div>

        {{-- REMITENTE (izquierda) y DESTINATARIO (derecha) — invertidos --}}
        <div class="dual-section">
            <div class="column">
                <div class="section-title">REMITENTE:</div>
                <p class="info-line"><span class="icon">*</span> {{ $reception->sender->full_name }}</p>
                <p class="info-line"><span class="icon">#</span> {{ $reception->sender->identification }}</p>
                <p class="info-line"><span class="icon">@</span> {{ $reception->sender->address }}</p>
                <p class="info-line phone"><span class="icon">☎</span> {{ $reception->sender->phone }}</p>
            </div>

            <div class="column">
                <div class="section-title">DESTINATARIO:</div>
                <p class="info-line"><span class="icon">*</span> {{ $reception->recipient->full_name }}</p>
                <p class="info-line"><span class="icon">#</span> {{ $reception->recipient->identification }}</p>
                <p class="info-line"><span class="icon">@</span> {{ $reception->recipient->address }}</p>
                <p class="info-line phone"><span class="icon">☎</span> {{ $reception->recipient->phone }}</p>
            </div>
        </div>

        @if (!$loop->last)
            <div class="page-break"></div>
        @endif
    @endforeach

</body>

</html>
