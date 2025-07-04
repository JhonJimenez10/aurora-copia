<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Factura {{ $invoice->number }}</title>
    <style>
        @page {
            size: 74mm 280mm; /* ancho típico de un ticket */
            margin: 5mm;
        }

        body {
            font-family: Arial, sans-serif;
            font-size: 10px;
            margin: 0;
            text-align: center;
        }

        .container {
            max-width: 250px;
            margin: 0 auto;
        }

        .bold { font-weight: bold; }
        .section { margin: 8px 0; }
        .line { border-top: 1px dashed #000; margin: 8px 0; }
        .small { font-size: 9px; margin-top: 5px; }
        .values { margin-top: 5px; }
        .left-align { text-align: left; margin-top: 5px; }
        .info-row { display: flex; justify-content: space-between; }
        .signature {
            margin-top: 12px;
            display: flex;
            justify-content: space-between;
            text-align: center;
        }
        .signature div {
            width: 45%;
        }
        .signature-line {
            border-top: 1px solid #000;
            margin-bottom: 3px;
        }
    </style>
</head>
<body>

<div class="container">

    {{-- ENCABEZADO --}}
    <div class="bold">{{ strtoupper($invoice->enterprise->name ?? 'NOMBRE EMPRESA') }}</div>
    <div>{{ strtoupper($invoice->enterprise->commercial_name ?? 'COMERCIAL') }}</div>
    <div>RUC: {{ $invoice->enterprise->ruc ?? '-' }}</div>
    <div style="font-size: 9px;">{{ strtoupper($invoice->enterprise->matrix_address ?? 'DIRECCIÓN EMPRESA') }}</div>


    {{-- FACTURA Y FECHA --}}
    <div class="section left-align" style="font-size: 10px; margin-top: 4px;">
        <div>
            <span class="bold">Factura o Guía Nro.:</span> {{ $invoice->number }}
        </div>
        <div>
            <span class="bold">Fecha:</span> {{ \Carbon\Carbon::parse($invoice->issue_date)->format('d M Y H:i:s') }}
        </div>
    </div>

    {{-- TRACKING --}}
    @if($invoice->reception?->tracking_code)
    <div class="section">
        <div class="bold">Código tracking:</div>
        <div>{{ $invoice->reception->tracking_code }}</div>
        <div>Estimado cliente para consultar el tracking de su envío ingrese a:</div>
        <div class="small">www.cuencanitoexpress.com/tracking.php</div>
    </div>
    @endif

    {{-- REMITENTE --}}
    <div class="section left-align">
        <div class="bold">Remitente:</div>
        <div>{{ $invoice->sender->full_name }}</div>
        <div><span class="bold">C.I. / RUC:</span> {{ $invoice->sender->identification }}</div>
        <div><span class="bold">Dirección:</span> {{ $invoice->sender->address }}</div>
        <div><span class="bold">Teléfono:</span> {{ $invoice->sender->phone }}</div>
        <div><span class="bold">Código Postal:</span> {{ $invoice->sender->postal_code }}</div>
    </div>

    {{-- DESTINATARIO --}}
    @if($invoice->reception?->recipient)
    <div class="section left-align">
        <div class="bold">Destinatario:</div>
        <div>{{ $invoice->reception->recipient->full_name }}</div>
        <div><span class="bold">C.I. / RUC:</span> {{ $invoice->reception->recipient->identification }}</div>
        <div><span class="bold">Dirección:</span> {{ $invoice->reception->recipient->address }}</div>
        <div><span class="bold">Teléfono:</span> {{ $invoice->reception->recipient->phone }}</div>
        <div><span class="bold">Código Postal:</span> {{ $invoice->reception->recipient->postal_code }}</div>
    </div>
    @endif

   {{-- AGENCIA DESTINO --}}
    @if($invoice->reception?->agencyDest)
    <div class="section left-align">
        <div><span class="bold">Agencia destino:</span> {{ $invoice->reception->agencyDest->trade_name ?? '-' }}</div>
        <div><span class="bold">Dirección:</span> {{ $invoice->reception->agencyDest->address ?? '-' }}</div>
        <div><span class="bold">Teléfono:</span> {{ $invoice->reception->agencyDest->phone ?? '-' }}</div>
    </div>
    @endif



    {{-- SERVICIO --}}
    <div class="section left-align">
        <div><span class="bold">Tipo de servicio:</span> {{ $invoice->reception?->route ?? 'PAQUETERIA INTERNACIONAL' }}</div>
        <div><span class="bold">Tiempo de entrega:</span> 2 - 3 días</div>
        <div><span class="bold">Valor declarado:</span> {{ number_format($declaredValue, 2) }}</div>
    </div>

    {{-- PESO, CONTENIDO Y TARIFA --}}
    <div class="section left-align" style="font-size: 10px;">
        <table style="width: 100%; font-family: Arial, sans-serif;">
            <colgroup>
                <col style="width: 22%;">
                <col style="width: 56%;">
                <col style="width: 22%;">
            </colgroup>
            <thead>
                <tr>
                    <th style="text-align: left;">Peso</th>
                    <th style="text-align: left;">Declaración del contenido</th>
                    <th style="text-align: right;">Tarifa</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>{{ number_format($weight, 2) }}</td>
                    <td>{{ $contentDescription }}</td>
                    <td style="text-align: right;">{{ number_format($tarifa_paquetes, 2) }}</td>
                </tr>
            </tbody>
        </table>
    </div>

    {{-- ADICIONALES Y TOTALES --}}
    <div class="section values">
        <table style="width: 100%; font-family: Arial, sans-serif; border-collapse: collapse;">
            <tbody>
                @php
                    $rows = [
                        ['SEGURO PAQUETES', $total_seguro_paquetes],
                        ['EMBALAJE', $total_embalaje],
                        ['SEGURO ENVÍO', $total_seguro_envio],
                        ['DESADUANIZACIÓN', $total_desaduanizacion],
                        ['TRANSPORTE DESTINO', $total_transporte_destino],
                        ['TRANSMISIÓN', $total_transmision],
                        ['SUBTOTAL 0%', $subtotal_0],
                        ['SUBTOTAL 15%', $subtotal_15],
                        ['IVA 15%', $vat],
                    ];
                @endphp

                @foreach($rows as [$label, $value])
                    <tr>
                        <td style="text-align: right; font-weight: bold; padding: 1px 0;">{{ $label }}</td>
                        <td style="text-align: right; padding: 1px 0;">
                            {{ number_format($value, 2) }}
                        </td>
                    </tr>
                @endforeach

                {{-- VALOR TOTAL con "POR COBRAR" --}}
                <tr>
                    <td style="text-align: left; font-weight: bold; padding: 1px 0;">
                        @if(strtoupper($invoice->reception?->pay_method) === 'POR COBRAR')
                            *POR COBRAR*
                        @endif
                    </td>
                    <td style="text-align: right; font-weight: bold; padding: 1px 0;">
                        {{ number_format($total, 2) }}
                    </td>
                </tr>
            </tbody>
        </table>
    </div>





    {{-- FIRMAS --}}
    <div class="signature" style="margin-top: 40px;">
        <table style="width: 100%; font-size: 9px;">
            <tr>
                <td style="text-align: center; width: 50%;">
                    <div style="border-top: 1px solid #000; width: 90%; margin: 0 auto 2px auto;"></div>
                    (f) Operador
                </td>
                <td style="text-align: center; width: 50%;">
                    <div style="border-top: 1px solid #000; width: 90%; margin: 0 auto 2px auto;"></div>
                    (f) Cliente
                </td>
            </tr>
        </table>
    </div>

    {{-- CONDICIONES --}}
    <div class="section left-align" style="font-size: 8px; line-height: 1.2; margin-top: 8px;">
        <div class="bold" style="text-align: center; font-size: 9px; margin-bottom: 2px;">CONDICIONES GENERALES</div>

        <div style="margin-bottom: 0;">
            <span class="bold">EL OPERADOR POSTAL</span>, indemnizará al Usuario, en caso de daño, pérdida, robo, hurto, explotación o avería y el retraso no justificado, aplicando lo dispuesto en el Reglamento de Títulos Habilitantes y de la Gestión del Sector Postal, expedido por el Ministerio de Telecomunicaciones y la Sociedad de la Información.
        </div>
        <div style="margin-bottom: 0;">
            <span class="bold">EL OPERADOR POSTAL</span> declara en este instrumento que los datos de los clientes se encuentran protegidos por la Ley, salvo pedido expreso de autoridad competente o judicial.
        </div>
        <div style="margin-bottom: 0;">
            <span class="bold">EL REMITENTE</span> podrá recuperar los envíos postales no entregados al destinatario y el Operador Postal tiene la obligación de entregarlos. Cumplido el tiempo de custodia, podrá destruir los envíos como rezagados.
        </div>
        <div style="margin-bottom: 0;">
            <span class="bold">EL USUARIO</span> podrá presentar reclamos y sugerencias a través del portal institucional, aplicando lo dispuesto por el Ministerio de Telecomunicaciones y la Sociedad de la Información.
        </div>
    </div>



</div>

</body>
</html>
