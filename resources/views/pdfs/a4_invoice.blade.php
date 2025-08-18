{{-- resources/views/pdfs/a4_invoice.blade.php --}}
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Factura {{ $invoice->number }}</title>
<style>
  /* Hoja A4 VERTICAL con márgenes */
  @page { size: A4 portrait; margin: 12mm; }

  * { box-sizing: border-box; }
  html, body { font-family: DejaVu Sans, Arial, Helvetica, sans-serif; color:#000; }
  body { font-size: 10px; margin: 0; }
  table { border-collapse: collapse; width: 100%; }

  /* Área visible: mitad superior del A4, sin rotaciones */
  .ticket {
    width: 186mm;      /* ancho útil (210 - 24) */
    height: 136mm;     /* media altura (297 - 24 = 273; /2 ≈ 136.5) */
    padding: 6mm 6mm 4mm 6mm;
  }

  /* utilidades */
  .title { font-size: 15px; font-weight: 700; letter-spacing:.2px; }
  .b { font-weight: 700; } .u { text-decoration: underline; }
  .right { text-align:right; } .center { text-align:center; }
  .small { font-size: 9px; } .xs { font-size: 8.5px; }
  .mt-6{margin-top:6px} .mb-6{margin-bottom:6px} .mb-10{margin-bottom:10px}
  .p-6{padding:6px}

  .line { border-top:1px solid #000; height:0; margin:6px 0; }
  .box { border:1px solid #000; }
  .thead td { font-weight:700; border-bottom:1px solid #000; padding:4px 6px; }
  .kv td { padding:3px 6px; vertical-align:top; }

  .cols-2 td, .cols-3 td { vertical-align:top; }

  /* totales (rótulos a la izquierda, valor a la derecha) */
  .tots td { padding:3px 6px; }
  .tots .lbl{ white-space:nowrap; }
  .tots .val{ text-align:right; width: 42mm; }

  .hr-sig { border-top:1px solid #000; height:0; margin-top:20px; }
  .barcode {
    border:1px solid #000; height:16mm; display:flex; align-items:center; justify-content:center;
    letter-spacing:2px; font-size:12px; margin-top:8px;
  }

  .no-break { page-break-inside: avoid; }
</style>
</head>
<body>

<div class="ticket no-break">

  {{-- CABECERA --}}
  <table class="cols-2 mb-10">
    <tr>
      <td style="width:62%;">
        <div class="title">{{ strtoupper($invoice->enterprise->commercial_name ?? $invoice->enterprise->name ?? 'EMPRESA') }}</div>
        @if(!empty($invoice->enterprise?->matrix_address))
          <div class="small">{{ strtoupper($invoice->enterprise->matrix_address) }}</div>
        @endif
        @if(!empty($invoice->enterprise?->city) || !empty($invoice->enterprise?->province))
          <div class="small">{{ strtoupper(trim(($invoice->enterprise->city ?? '').' '.($invoice->enterprise->province ?? ''))) }}</div>
        @endif
        @if(!empty($invoice->enterprise?->phone))
          <div class="small">Tel.: {{ $invoice->enterprise->phone }}</div>
        @endif
      </td>
      <td class="right" style="width:38%;">
        <div class="small">FECHA: {{ \Carbon\Carbon::parse($invoice->issue_date)->format('d/m/Y h:i A') }}</div>
        <div class="b" style="margin:3px 0 2px;">FACTURA</div>
        <div class="b" style="font-size:14px;">{{ $invoice->number }}</div>
        @if($invoice->status ?? false)
          <div class="small">Status: {{ strtoupper($invoice->status) }}</div>
        @endif
      </td>
    </tr>
  </table>

  {{-- REMITENTE / BENEFICIARIO / AGENCIA --}}
  <table class="cols-3 box mb-10" cellspacing="0" cellpadding="0">
    <tr class="thead">
      <td class="center" style="width:34%;">REMITENTE</td>
      <td class="center" style="width:33%;">BENEFICIARIO</td>
      <td class="center" style="width:33%;">AGENCIA DESTINO</td>
    </tr>
    <tr class="kv">
      <td>
        <div class="b">{{ $invoice->sender->full_name ?? '-' }}</div>
        <div>C.I./RUC: {{ $invoice->sender->identification ?? '-' }}</div>
        <div>Dirección: {{ $invoice->sender->address ?? '-' }}</div>
        <div>Teléfono: {{ $invoice->sender->phone ?? '-' }}</div>
        @if(!empty($invoice->sender?->postal_code))
          <div>Código Postal: {{ $invoice->sender->postal_code }}</div>
        @endif
      </td>
      <td>
        @if($invoice->reception?->recipient)
          <div class="b">{{ $invoice->reception->recipient->full_name }}</div>
          <div>C.I./RUC: {{ $invoice->reception->recipient->identification }}</div>
          <div>Dirección: {{ $invoice->reception->recipient->address }}</div>
          <div>Teléfono: {{ $invoice->reception->recipient->phone }}</div>
          @if(!empty($invoice->reception->recipient?->postal_code))
            <div>Código Postal: {{ $invoice->reception->recipient->postal_code }}</div>
          @endif
        @else
          <div class="xs">—</div>
        @endif
      </td>
      <td>
        @if($invoice->reception?->agencyDest)
          <div class="b">{{ $invoice->reception->agencyDest->trade_name ?? '-' }}</div>
          <div>{{ $invoice->reception->agencyDest->address ?? '-' }}</div>
          <div>{{ $invoice->reception->agencyDest->city ?? '-' }}</div>
          <div>Tel.: {{ $invoice->reception->agencyDest->phone ?? '-' }}</div>
        @else
          <div class="xs">—</div>
        @endif
      </td>
    </tr>
  </table>

  {{-- SERVICIO --}}
  <table class="mb-6">
    <tr>
      <td style="width:60%;">
        <div class="box p-6">
          <div class="b u">Servicio</div>
          <div><span class="b">Tipo de servicio:</span> {{ $invoice->reception?->route ?? 'PAQUETERÍA INTERNACIONAL' }}</div>
          <div><span class="b">Tiempo de entrega:</span> 2 - 3 días</div>
          <div><span class="b">Valor declarado:</span> {{ number_format($declaredValue, 2) }}</div>
        </div>
      </td>
      <td style="width:40%;"></td>
    </tr>
  </table>

  {{-- PESO / CONTENIDO / TARIFA (igual que ticket) --}}
  <div class="mb-10">
    <table style="width:100%;">
      <colgroup>
        <col style="width: 22%;">
        <col style="width: 56%;">
        <col style="width: 22%;">
      </colgroup>
      <thead class="thead">
        <tr>
          <td>Peso</td>
          <td>Declaración del contenido</td>
          <td class="right">Tarifa</td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{{ number_format($weight, 2) }}</td>
          <td>{{ $contentDescription ?: '—' }}</td>
          <td class="right">{{ number_format($tarifa_paquetes, 2) }}</td>
        </tr>
      </tbody>
    </table>
  </div>

  {{-- ADICIONALES Y TOTALES (rótulos EXACTOS al ticket) --}}
  <table class="tots mb-10">
    <tbody>
      <tr><td class="lbl">SEGURO PAQUETES</td>      <td class="val">{{ number_format($total_seguro_paquetes,2) }}</td></tr>
      <tr><td class="lbl">EMBALAJE</td>             <td class="val">{{ number_format($total_embalaje,2) }}</td></tr>
      <tr><td class="lbl">SEGURO ENVÍO</td>         <td class="val">{{ number_format($total_seguro_envio,2) }}</td></tr>
      <tr><td class="lbl">DESADUANIZACIÓN</td>      <td class="val">{{ number_format($total_desaduanizacion,2) }}</td></tr>
      <tr><td class="lbl">TRANSPORTE DESTINO</td>   <td class="val">{{ number_format($total_transporte_destino,2) }}</td></tr>
      <tr><td class="lbl">TRANSMISIÓN</td>          <td class="val">{{ number_format($total_transmision,2) }}</td></tr>
      <tr><td class="lbl">SUBTOTAL 0%</td>          <td class="val">{{ number_format($subtotal_0,2) }}</td></tr>
      <tr><td class="lbl">SUBTOTAL 15%</td>         <td class="val">{{ number_format($subtotal_15,2) }}</td></tr>
      <tr><td class="lbl">IVA 15%</td>              <td class="val">{{ number_format($vat,2) }}</td></tr>
      <tr>
        <td class="lbl b">
          @php $pm = strtoupper($invoice->reception?->pay_method ?? ''); @endphp
          TOTAL @if(in_array($pm, ['POR COBRAR','TRANSFERENCIA'])) — *POR COBRAR*@endif
        </td>
        <td class="val b">{{ number_format($total,2) }}</td>
      </tr>
    </tbody>
  </table>

  {{-- Operador + código "simulado" y firmas (como referencia visual de tu ticket) --}}
  <div class="small">Operador: {{ strtoupper(auth()->user()->name ?? '') }}</div>
  <div class="barcode">* {{ preg_replace('/[^0-9A-Za-z]/','',$invoice->number) }} *</div>

  <table class="w-100 mt-6">
    <tr>
      <td class="center" style="width:50%;">
        <div class="hr-sig"></div>
        <div class="small">Remitente</div>
      </td>
      <td class="center" style="width:50%;">
        <div class="hr-sig"></div>
        <div class="small">Beneficiario</div>
      </td>
    </tr>
  </table>

  {{-- Condiciones --}}
  <div class="line"></div>
  <div class="xs">
    ALL CARGO SHIPMENTS ARE SUBJECT TO AN INSPECTION. RESPONSABILIDAD POR PÉRDIDA O DETERIORO DEL 100% AL VALOR DECLARADO Y DE UN MÁXIMO DE 30 DÓLARES POR FACTURA CUANDO NO HA SIDO DECLARADO EL VALOR. EXIMO DE TODA RESPONSABILIDAD A LA COMPAÑÍA POR EL CONTENIDO DEL ENVÍO.
  </div>

</div>

</body>
</html>
