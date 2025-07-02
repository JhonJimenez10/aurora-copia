<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Ticket Factura {{ $invoice->number }}</title>
    <style>
        body {
            font-family: monospace;
            font-size: 11px;
            margin: 0;
            padding: 8px;
        }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .section { margin: 8px 0; }
        table { width: 100%; border-collapse: collapse; }
        td { vertical-align: top; }
        .totals td { padding: 2px 0; }
        .line { border-top: 1px dashed #000; margin: 4px 0; }
        .small { font-size: 9px; }
        .flex-between {
            display: flex;
            justify-content: space-between;
        }
    </style>
</head>
<body>
    {{-- ENCABEZADO --}}
    <div class="center bold">CUENCANITO EXPRESS – CUENCA CENTRO</div>
    <div class="center">CUENCANITO EXPRESS COURIER & CARGO</div>
    <div class="center">RUC: {{ $invoice->enterprise->ruc }}</div>
    <div class="center">GRAN COLOMBIA 3 76 Y VARGAS MACHUCA</div>

    <div class="section">
        <div><span class="bold">Factura o Guía Nro.:</span> {{ $invoice->number }}</div>
        <div><span class="bold">Fecha:</span> {{ \Carbon\Carbon::parse($invoice->issue_date)->format('d M Y') }} {{ now()->format('H:i:s') }}</div>
    </div>

    {{-- TRACKING --}}
    @if($invoice->reception?->tracking_code)
    <div class="section">
        <div><span class="bold">Código tracking:</span> {{ $invoice->reception->tracking_code }}</div>
        <div>Estimado cliente para consultar el tracking de su envío ingrese a:</div>
        <div class="small">www.cuencanitoexpress.com/tracking.php</div>
    </div>
    @endif

    {{-- REMITENTE --}}
    <div class="section">
        <div class="bold">Remitente:</div>
        <div>{{ $invoice->sender->full_name }}</div>
        <div>C.I. / RUC: {{ $invoice->sender->identification }}</div>
        <div>Dirección: {{ $invoice->sender->address }}</div>
        <div>Teléfono: {{ $invoice->sender->phone }}</div>
        <div>Código Postal: {{ $invoice->sender->postal_code }}</div>
    </div>

    {{-- DESTINATARIO --}}
    @if($invoice->reception?->recipient)
    <div class="section">
        <div class="bold">Destinatario:</div>
        <div>{{ $invoice->reception->recipient->full_name }}</div>
        <div>C.I. / RUC: {{ $invoice->reception->recipient->identification }}</div>
        <div>Dirección: {{ $invoice->reception->recipient->address }}</div>
        <div>Teléfono: {{ $invoice->reception->recipient->phone }}</div>
        <div>Código Postal: {{ $invoice->reception->recipient->postal_code }}</div>
    </div>
    @endif

    {{-- AGENCIA DESTINO --}}
    @if($invoice->reception?->agencyDest)
    <div class="section">
        <div><span class="bold">Agencia destino:</span> {{ $invoice->reception->agencyDest->trade_name }}</div>
        <div>Dirección: {{ $invoice->reception->agencyDest->address }}</div>
        <div>Teléfono: {{ $invoice->reception->agencyDest->phone }}</div>
    </div>
    @endif

    {{-- SERVICIO --}}
    <div class="section">
        <div><span class="bold">Tipo de servicio:</span> {{ $invoice->reception?->shipping_type ?? 'PAQUETERIA INTERNACIONAL' }}</div>
        <div><span class="bold">Tiempo de entrega:</span> 2 - 3 días</div>
        <div><span class="bold">Valor declarado:</span> {{ number_format($invoice->reception?->declared_value ?? 0, 2) }}</div>
    </div>

    {{-- PESO Y CONTENIDO --}}
    <div class="section flex-between">
        <div><span class="bold">Peso:</span> {{ number_format($invoice->reception?->weight ?? 0, 2) }}</div>
        <div><span class="bold">Tarifa:</span> {{ number_format($invoice->invDetails->first()->unit_price ?? 0, 2) }}</div>
    </div>
    <div><span class="bold">Declaración del contenido:</span> {{ $invoice->reception?->content_description }}</div>

    {{-- DETALLE DE ADICIONALES --}}
    <div class="section">
        @foreach($invoice->invDetails as $detail)
            @if($loop->first)
                @continue
            @endif
            <div class="flex-between">
                <div>{{ strtoupper($detail->description) }}</div>
                <div>{{ number_format($detail->total, 2) }}</div>
            </div>
        @endforeach
    </div>

    {{-- TOTALES --}}
    <div class="line"></div>
    <table class="totals">
        <tr><td>SUBTOTAL 0%</td><td class="text-right">{{ number_format($invoice->subtotal_0 ?? 0, 2) }}</td></tr>
        <tr><td>SUBTOTAL 15%</td><td class="text-right">{{ number_format($invoice->subtotal, 2) }}</td></tr>
        <tr><td>IVA 15%</td><td class="text-right">{{ number_format($invoice->vat, 2) }}</td></tr>
        <tr><td class="bold">VALOR TOTAL</td><td class="text-right bold">{{ number_format($invoice->total, 2) }}</td></tr>
    </table>
    <div class="line"></div>

    {{-- FIRMAS --}}
    <div class="section flex-between">
        <div class="center">(f) Operador</div>
        <div class="center">(f) Cliente</div>
    </div>

    {{-- CONDICIONES --}}
    <div class="small">
        <div class="bold">CONDICIONES GENERALES</div>
        EL OPERADOR POSTAL, indemnizará al Usuario, en caso de daño, pérdida, robo, hurto, explotación o avería y el retraso no justificado, aplicando lo dispuesto en el Reglamento de Títulos Habilitantes y de la Gestión del Sector Postal, expedido por el Ministerio de Telecomunicaciones y la Sociedad de la Información.<br><br>

        EL OPERADOR POSTAL, declara en este instrumento que los datos de los clientes se encuentran protegidos por la Ley, salvo pedido expreso de autoridad competente o judicial.<br><br>

        EL REMITENTE podrá recuperar los envíos postales no entregados al destinatario y el Operador Postal tiene la obligación de entregar los mismos, una vez cumplido el tiempo o custodia del Operador podrá realizar el procedimiento para destruir los envíos como rezagadas establecido en el Reglamento de Títulos Habilitantes y de la Gestión del Sector Postal.<br><br>

        EL USUARIO podrá solicitar información, reclamos, quejas y sugerencias a través del portal institucional, en cumplimiento de lo establecido en el Reglamento de Títulos Habilitantes y de la Gestión del Sector Postal.
    </div>
</body>
</html>
