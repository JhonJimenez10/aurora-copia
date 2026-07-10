<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <style>
        @page {
            margin: 14px 16px;
        }

        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 10px;
            color: #111;
        }

        .header {
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 2px solid #d10000;
            padding-bottom: 6px;
        }

        .header h1 {
            font-size: 15px;
            margin: 0 0 3px 0;
            color: #d10000;
        }

        .header p {
            margin: 1px 0;
            font-size: 10px;
            color: #444;
        }

        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }

        .info-table td {
            padding: 3px 6px;
            font-size: 10px;
            vertical-align: top;
        }

        .info-table td.label {
            font-weight: bold;
            width: 110px;
            color: #333;
        }

        .agency-box {
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            background-color: #f2f2f2;
            border-left: 3px solid #d10000;
            padding: 6px;
            margin-bottom: 10px;
        }

        .section-title {
            background-color: #f2f2f2;
            font-weight: bold;
            font-size: 11px;
            padding: 3px 6px;
            border-left: 3px solid #333;
            margin: 8px 0 4px 0;
        }

        table.packages {
            width: 100%;
            border-collapse: collapse;
        }

        table.packages th,
        table.packages td {
            border: 1px solid #999;
            padding: 3px 5px;
            font-size: 9px;
        }

        table.packages th {
            background-color: #d10000;
            color: #fff;
            text-align: left;
        }

        .text-right {
            text-align: right;
        }

        .totals-row td {
            font-weight: bold;
            background-color: #f2f2f2;
        }

        .footer-note {
            margin-top: 10px;
            font-size: 8px;
            color: #777;
            text-align: center;
        }
    </style>
</head>

<body>

    <div class="header">
        <h1>REPORTE DE SACA — EMBARQUE {{ $shipment->number }}</h1>
        <p>{{ $shipment->route }}</p>
    </div>

    <table class="info-table">
        <tr>
            <td class="label">No. Saca:</td>
            <td>{{ ($shipment->sack_prefix ?? '') . $shipmentSack->sack_number }}</td>
            <td class="label">Clasificadora:</td>
            <td>{{ $shipment->agency_origin }}</td>
        </tr>
        <tr>
            <td class="label">Fecha Embarque:</td>
            <td>{{ \Carbon\Carbon::parse($shipment->date)->format('Y-m-d') }}</td>
            <td class="label">Aerolínea:</td>
            <td>{{ $shipment->airline }}</td>
        </tr>
        <tr>
            <td class="label">País Origen:</td>
            <td>{{ $shipment->country_origin }}</td>
            <td class="label">No. Embarque:</td>
            <td>{{ $shipment->number }}</td>
        </tr>
    </table>

    <div class="agency-box">
        AGENCIA DESTINO: {{ $agencyDest->name }}
        @if (!empty($agencyDest->code_letters))
            ({{ $agencyDest->code_letters }})
        @endif
    </div>

    <div class="section-title">Paquetes para esta agencia ({{ $sackPackages->count() }})</div>

    <table class="packages">
        <thead>
            <tr>
                <th>Código</th>
                <th>Contenido</th>
                <th>Tipo</th>
                <th>Remitente</th>
                <th>Destinatario</th>
                <th>Teléfono</th>
                <th>Dirección</th>
                <th class="text-right">Lbs</th>
                <th class="text-right">Kgs</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($sackPackages as $sp)
                @php $reception = $sp->package->reception; @endphp
                <tr>
                    <td>{{ $sp->package->barcode ?? '—' }}</td>
                    <td>{{ $sp->package->content ?? '—' }}</td>
                    <td>{{ $sp->package->service_type ?? '—' }}</td>
                    <td>{{ optional($reception->sender)->full_name ?? '—' }}</td>
                    <td>{{ optional($reception->recipient)->full_name ?? '—' }}</td>
                    <td>{{ optional($reception->recipient)->phone ?? '—' }}</td>
                    <td>{{ optional($reception->recipient)->address ?? '—' }}</td>
                    <td class="text-right">{{ number_format($sp->pounds, 2) }}</td>
                    <td class="text-right">{{ number_format($sp->kilograms, 2) }}</td>
                </tr>
            @endforeach
            <tr class="totals-row">
                <td colspan="7" class="text-right">TOTALES:</td>
                <td class="text-right">{{ number_format($totalPounds, 2) }}</td>
                <td class="text-right">{{ number_format($totalKilograms, 2) }}</td>
            </tr>
        </tbody>
    </table>

    <div class="footer-note">
        Generado el {{ \Carbon\Carbon::now()->format('Y-m-d H:i') }}
    </div>

</body>

</html>
