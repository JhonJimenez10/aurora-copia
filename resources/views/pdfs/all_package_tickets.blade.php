<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <style>
        @page {
            margin: 0mm;
            size: letter;
        }

        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 14px;
            color: #111;
            margin: 0;
            padding: 0;
        }

        .ticket-container {
            height: 50vh;
            page-break-after: always;
            padding: 15px 20px;
            box-sizing: border-box;
            position: relative;
        }

        .ticket-container:last-child {
            page-break-after: auto;
        }

        .center {
            text-align: center;
        }

        .barcode-container {
            margin-top: 5px;
            margin-bottom: 10px;
        }

        .barcode {
            display: inline-block;
            margin-bottom: 5px;
            transform: scale(1.2);
            transform-origin: top center;
        }

        .barcode-number {
            font-weight: bold;
            font-size: 16px;
            margin-top: 5px;
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
            margin-top: 12px;
            padding-top: 10px;
            border-top: 2px solid #aaa;
        }

        .section-title {
            background-color: #f2f2f2;
            font-weight: bold;
            font-size: 16px;
            padding: 6px 8px;
            border-left: 5px solid #333;
            margin-bottom: 8px;
        }

        .info-line {
            margin: 6px 0;
            line-height: 1.6;
            font-size: 14px;
        }

        .icon {
            display: inline-block;
            width: 18px;
            font-weight: bold;
            margin-right: 5px;
            text-align: center;
            font-size: 14px;
        }

        .bridgeport-title {
            text-align: center;
            font-size: 28px;
            font-weight: bold;
            margin-top: 12px;
            margin-bottom: 12px;
            padding: 8px;
            background-color: #f8f8f8;
            border: 2px solid #333;
        }

        .payment-indicator {
            text-align: center;
            margin-bottom: 10px;
            padding: 8px;
        }

        .payment-indicator-text {
            font-weight: bold;
            font-size: 20px;
        }

        .details-table {
            width: 100%;
            margin: 10px 0;
            border-collapse: collapse;
            font-size: 14px;
        }

        .details-table td {
            vertical-align: top;
            padding: 6px 8px;
            width: 50%;
            line-height: 1.6;
        }

        .dual-section {
            display: table;
            width: 100%;
            margin-top: 12px;
            padding-top: 10px;
            border-top: 2px solid #aaa;
        }

        .dual-section .column {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            padding: 0 10px;
        }

        .dual-section .column:first-child {
            border-right: 1px dashed #999;
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

        <div class="ticket-container">
            {{-- Código de barras --}}
            <div class="barcode-container center">
                <div class="barcode">{!! $barcode !!}</div>
                <div class="barcode-number">{{ $package->barcode ?? '---' }}</div>
            </div>

            {{-- Indicador de Pago --}}
            @if ($isPorCobrar)
                <div class="payment-indicator">
                    <div class="payment-indicator-text red">POR COBRAR</div>
                </div>
            @elseif ($isPagado)
                <div class="payment-indicator">
                    <div class="payment-indicator-text green">PAGADO</div>
                </div>
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
                            ->map(function ($item) {
                                return $item->artPackage->name ?? 'Artículo';
                            })
                            ->toArray();
                    @endphp
                    <td><span class="bold">CONTENIDO:</span> {{ implode(', ', $contentNames) }}</td>
                    <td><span class="bold">PESO LBS:</span> {{ number_format($weightLbs, 2) }}</td>
                </tr>
                <tr>
                    @if ($isPorCobrar)
                        <td>
                            <span class="bold">AL COBRO:</span>
                            <span class="red bold" style="font-size: 16px;">
                                ${{ number_format($reception->total, 2) }}
                            </span>
                        </td>
                    @else
                        <td>
                            <span class="bold green" style="font-size: 16px;">PAGADO</span>
                        </td>
                    @endif

                    <td><span class="bold">PESO KGS:</span> {{ number_format($weightKgs, 2) }}</td>
                </tr>
            </table>

            {{-- Agencia de destino --}}
            <div class="bridgeport-title">{{ $agencyDestName }}</div>

            {{-- Información del remitente y destinatario --}}
            <div class="dual-section">
                <div class="column">
                    <div class="section-title">DESTINATARIO:</div>
                    <p class="info-line"><span class="icon">*</span> {{ $reception->recipient->full_name }}</p>
                    <p class="info-line"><span class="icon">#</span> {{ $reception->recipient->identification }}</p>
                    <p class="info-line"><span class="icon">@</span> {{ $reception->recipient->address }}</p>
                    <p class="info-line"><span class="icon">☎</span> {{ $reception->recipient->phone }}</p>
                </div>

                <div class="column">
                    <div class="section-title">REMITENTE:</div>
                    <p class="info-line"><span class="icon">*</span> {{ $reception->sender->full_name }}</p>
                    <p class="info-line"><span class="icon">#</span> {{ $reception->sender->identification }}</p>
                    <p class="info-line"><span class="icon">@</span> {{ $reception->sender->address }}</p>
                    <p class="info-line"><span class="icon">☎</span> {{ $reception->sender->phone }}</p>
                </div>
            </div>
        </div>
    @endforeach

</body>

</html>
