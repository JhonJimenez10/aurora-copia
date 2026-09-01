<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Listado para entregas</title>
    <style>
        @page {
            size: letter landscape;
            margin: 112px 20px 45px 20px;
        }

        body {
            font-family: DejaVu Sans, Arial, sans-serif;
            font-size: 9px;
            color: #000;
            margin: 0;
            padding: 0;
        }

        /* ─── Encabezado repetido en cada página ─────────────────────
       IMPORTANTE: nada de "float" aquí adentro. DomPDF renderiza mal
       (o duplicado) los elementos flotados dentro de position:fixed.
       Todo el layout del header se hace con <table>, que sí es estable. */
        .header {
            position: fixed;
            top: -112px;
            left: 0;
            right: 0;
            height: 112px;
        }

        .header-top-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 4px;
        }

        .header-top-table td {
            border: none;
            padding: 0;
            font-size: 9px;
            vertical-align: top;
        }

        .header-top-table .company-name {
            text-align: left;
            font-size: 10px;
            font-weight: bold;
        }

        .header-top-table .elaborado {
            text-align: right;
        }

        .report-title {
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            margin: 4px 0 6px 0;
        }

        .header-meta-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
        }

        .header-meta-table td {
            border: none;
            padding: 0 0 2px 0;
            vertical-align: top;
            font-weight: bold;
            /* etiqueta y valor en negrita, igual que el original */
        }

        .header-meta-table .meta-left {
            text-align: left;
            width: 60%;
        }

        .header-meta-table .meta-right {
            text-align: right;
            width: 40%;
        }

        /* ─── Pie de página repetido en cada página ──────────────────
       Igual que el header: table en vez de floats. */
        .footer {
            position: fixed;
            bottom: -45px;
            left: 0;
            right: 0;
            height: 30px;
        }

        .footer-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
        }

        .footer-table td {
            border: none;
            padding: 0;
            vertical-align: middle;
        }

        .footer-table .left {
            text-align: left;
        }

        .footer-table .right {
            text-align: right;
        }

        /* ─── Tabla de detalle ────────────────────────────────────── */
        table.data-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            /* respeta los % de ancho, no se desborda */
        }

        table.data-table thead th {
            border: 1px solid #000;
            font-weight: bold;
            font-size: 8px;
            padding: 3px 4px;
            text-align: left;
            background: #ffffff;
            word-wrap: break-word;
        }

        table.data-table tbody td {
            border: 1px solid #000;
            font-size: 8px;
            padding: 3px 4px;
            vertical-align: top;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }

        table.data-table tbody tr {
            page-break-inside: avoid;
            /* una fila nunca se parte entre páginas */
        }

        .text-right {
            text-align: right;
        }

        .text-center {
            text-align: center;
        }

        .empty-row td {
            text-align: center;
            padding: 20px;
            font-style: italic;
            color: #555;
        }
    </style>
</head>

<body>

    <div class="header">
        <table class="header-top-table">
            <tr>
                <td class="company-name">Cuencanito Express Courier S.A.S.</td>
                <td class="elaborado">Elaborado el: {{ $elaboradoEl }}</td>
            </tr>
        </table>

        <div class="report-title">Listado para entregas</div>

        <table class="header-meta-table">
            <tr>
                <td class="meta-left">
                    <div><strong>Embarque :</strong> &nbsp;{{ $formattedNumber }}</div>
                    <div><strong>Ag. Destino :</strong> &nbsp;{{ $agencyName }}</div>
                </td>
                <td class="meta-right">
                    <div><strong>Fecha embarque :</strong> &nbsp;{{ $fechaEmbarque }}</div>
                </td>
            </tr>
        </table>
    </div>

    <div class="footer">
        <table class="footer-table">
            <tr>
                <td class="left">Elaborado con el sistema CourierAgil &trade; 098 614 2084</td>
                <td class="right">P&aacute;gina {PAGE_NUM} de {PAGE_COUNT}</td>
            </tr>
        </table>
    </div>

    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 9%;">No. Recepci&oacute;n</th>
                <th style="width: 9%;">Ag. Origen</th>
                <th style="width: 14%;">Remitente</th>
                <th style="width: 14%;">Destinatario</th>
                <th style="width: 10%;">Tel&eacute;fono destinatario</th>
                <th style="width: 6%;" class="text-right">Peso libras</th>
                <th style="width: 5%;" class="text-center">Piezas</th>
                <th style="width: 8%;">Valor por cobrar</th>
                <th style="width: 19%;">Contenido</th>
                <th style="width: 6%;">Firma</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($rows as $row)
                <tr>
                    <td>{{ $row['code'] }}</td>
                    <td>{{ $row['agency_origin'] }}</td>
                    <td>{{ $row['sender'] }}</td>
                    <td>{{ $row['recipient'] }}</td>
                    <td>{{ $row['phone'] }}</td>
                    <td class="text-right">{{ number_format($row['pounds'], 2) }}</td>
                    <td class="text-center">{{ $row['pieces'] }}</td>
                    <td></td>
                    <td>{{ $row['content'] }}</td>
                    <td></td>
                </tr>
            @empty
                <tr class="empty-row">
                    <td colspan="10">
                        No hay paquetes para esta agencia destino en este embarque.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

</body>

</html>
