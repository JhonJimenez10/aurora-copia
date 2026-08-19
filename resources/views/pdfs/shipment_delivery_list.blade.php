<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Listado para entregas</title>
<style>
    @page {
        margin: 145px 25px 50px 25px;
    }

    body {
        font-family: DejaVu Sans, Arial, sans-serif;
        font-size: 9px;
        color: #000;
        margin: 0;
        padding: 0;
    }

    /* ─── Encabezado repetido en cada página ─────────────────── */
    .header {
        position: fixed;
        top: -145px;
        left: 0;
        right: 0;
        height: 145px;
    }

    .company-row {
        overflow: hidden;
        margin-bottom: 6px;
    }

    .company-name {
        float: left;
        font-size: 10px;
    }

    .elaborado {
        float: right;
        font-size: 9px;
    }

    .report-title {
        text-align: center;
        font-size: 14px;
        font-weight: bold;
        margin-bottom: 10px;
    }

    .meta-row {
        overflow: hidden;
        margin-bottom: 10px;
        font-size: 10px;
    }

    .meta-left {
        float: left;
    }

    .meta-right {
        float: right;
    }

    .meta-left div,
    .meta-right div {
        margin-bottom: 2px;
    }

    /* ─── Pie de página repetido en cada página ──────────────── */
    .footer {
        position: fixed;
        bottom: -45px;
        left: 0;
        right: 0;
        height: 30px;
        font-size: 9px;
        overflow: hidden;
    }

    .footer .left {
        float: left;
    }

    .footer .right {
        float: right;
    }

    /* ─── Tabla de detalle ────────────────────────────────────── */
    table {
        width: 100%;
        border-collapse: collapse;
    }

    thead th {
        border: 1px solid #000;
        font-weight: bold;
        font-size: 8px;
        padding: 3px 4px;
        text-align: left;
        background: #ffffff;
    }

    tbody td {
        border: 1px solid #000;
        font-size: 8px;
        padding: 3px 4px;
        vertical-align: top;
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
        <div class="company-row">
            <span class="company-name">Cuencanito Express Courier S.A.S.</span>
            <span class="elaborado">Elaborado el: {{ $elaboradoEl }}</span>
        </div>
        <div class="report-title">Listado para entregas</div>
        <div class="meta-row">
            <div class="meta-left">
                <div><strong>Embarque :</strong> &nbsp;{{ $formattedNumber }}</div>
                <div><strong>Ag. Destino :</strong> &nbsp;{{ $agencyName }}</div>
            </div>
            <div class="meta-right">
                <div><strong>Fecha embarque :</strong> &nbsp;{{ $fechaEmbarque }}</div>
            </div>
        </div>
    </div>

    <div class="footer">
        <span class="left">Elaborado con el sistema CourierAgil &trade; 098 614 2084</span>
        <span class="right">P&aacute;gina {PAGE_NUM} de {PAGE_COUNT}</span>
    </div>

    <table>
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