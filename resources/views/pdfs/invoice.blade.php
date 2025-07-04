{{-- resources/views/pdfs/invoice.blade.php --}}
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Factura {{ $invoice->number }}</title>
  <style>
    body {
      font-family: DejaVu Sans, sans-serif;
      font-size: 9px;
      margin: 0;
      padding: 0;
    }
    /*centramos este h2 dentro de 45.5% de ancho */
    .no-logo {
      color: red;
      font-size: 32px;      /* tamaño más grande */
      font-weight: bold;    /* negrita */
      margin: 16px 0;
      display: block;
      width: 45.5%;         /* mismo ancho que el recuadro izquierdo */
      text-align: center;
      line-height: 1;
    }
    /* Cabecera con dos recuadros */
    .header-container {
      margin-bottom: 8px;
      position: relative;
    }
    .box {
      float: left;
      width: 45.5%;
      margin-right: 4%;
      border: 1px solid #000;
      border-radius: 10px;
      padding: 8px;
      box-sizing: border-box;
    }
    .box:last-of-type {
      margin-right: 0;
    }
    /* ← Aquí bajamos sólo el recuadro izquierdo */
    .header-container .box:first-of-type {
      margin-top: 63px; /* ajusta este valor a tu gusto */
    }
    /* ↑ Forzar altura mínima del recuadro DERECHO */
    .header-container .box:nth-of-type(2) {
      margin-top: -85px;
      min-height: 300px; /* ajústalo para estirarlo hacia abajo */
    }
    /* ↑ NUEVAS REGLAS PARA MÁS ESPACIO ↑ */
    /* Más padding vertical en celdas solo del recuadro derecho */
    .header-container .box:nth-of-type(2) td {
      padding: 8px 4px;
    }
    /* Separación extra antes del código de barras */
    .header-container .box:nth-of-type(2) .barcode-container {
      margin-top: 16px;
    }
    .clearfix { clear: both; }
    .box table {
      width: 100%;
      border-collapse: collapse;
    }
    .box td {
      padding: 2px 4px;
      vertical-align: top;
    }
    .box td.label {
      font-weight: bold;
      text-transform: uppercase;
      width: 40%;
      white-space: nowrap;
    }
    /* R.U.C. y FACTURA más grandes */
    .box:nth-of-type(2) tr:nth-child(1) td,
    .box:nth-of-type(2) tr:nth-child(2) td {
      font-size: 14px;
    }
    /* Código de barras */
    .barcode-container {
      text-align: center;
      margin-top: 8px;
    }
    .barcode-container img {
      width: 100%;
      height: auto;
      display: block;
      margin: 0 auto;
    }
    /* Sección Cliente */
    .client-box {
      clear: both;
      border: 1px solid #000;
      border-radius: 5px;
      padding: 6px;
      margin-bottom: 8px;
    }
    .client-box p { margin: 2px 0; }
    .client-box strong { font-weight: bold; }
    .client-box .info-line { white-space: nowrap; }
    .client-box .info-item {
      display: inline-block;
      margin-right: 150px;
    }
    /* Detalle de líneas */
    .invoice-details {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
    }
    .invoice-details th,
    .invoice-details td {
      border: 1px solid #000;
      padding: 4px;
    }
    .invoice-details th {
      background: #f0f0f0;
      text-align: center;
    }
    .text-center { text-align: center; }
    .text-right  { text-align: right; }
    .small       { font-size: 7px; }
    /* Pago y Totales */
    .bottom-container {
      width: 100%;
      margin-top: 8px;
    }
    .payment-box {
      float: left;
      width: 60%;
      box-sizing: border-box;
    }
    .payment-box table {
      width: 100%;
      border-collapse: collapse;
    }
    .payment-box th,
    .payment-box td {
      border: 1px solid #000;
      padding: 4px;
    }
    .payment-box th {
      background: #f0f0f0;
      text-align: left;
      font-weight: bold;
    }
    .totals-box {
      float: right;
      width: 35%;
      padding: 4px;
      box-sizing: border-box;
    }
    .totals {
      width: 100%;
      border-collapse: collapse;
    }
    .totals td {
      border: 1px solid #000;
      padding: 4px;
      text-align: right;
    }
    .totals td:first-child {
      text-align: left;
      font-weight: bold;
      width: 70%;
    }
  </style>
</head>
<body>

  {{-- Título centrado sobre el recuadro izquierdo --}}
  <h2 class="no-logo">NO TIENE LOGO</h2>

  {{-- Cabecera --}}
  <div class="header-container">
    {{-- IZQUIERDA (bajada) --}}
    <div class="box">
      <table>
        <tr><td colspan="2"><strong>{{ $invoice->enterprise->name }}</strong></td></tr>
        <tr><td colspan="2">&nbsp;</td></tr>
        <tr>
          <td class="label">Dirección<br>Matriz:</td>
          <td>{{ $invoice->enterprise->main_address }}</td>
        </tr>
        <tr><td colspan="2">&nbsp;</td></tr>
        <tr>
          <td class="label">Dirección<br>Sucursal:</td>
          <td>{{ $invoice->enterprise->branch_address }}</td>
        </tr>
        <tr><td colspan="2">&nbsp;</td></tr>
        <tr>
          <td class="label">Obligado a llevar contabilidad:</td>
          <td>{{ $invoice->enterprise->accounting_obligated ? 'SI' : 'NO' }}</td>
        </tr>
      </table>
    </div>

    {{-- DERECHA (queda arriba) --}}
    <div class="box">
      <table>
        <tr><td class="label">R.U.C.:</td><td>{{ $invoice->enterprise->ruc }}</td></tr>
        <tr><td class="label">FACTURA</td><td></td></tr>
        <tr><td class="label">No.:</td><td>{{ $invoice->number }}</td></tr>
        <tr><td class="label">Autorización:</td><td>{{ $invoice->auth_number }}</td></tr>
        <tr><td class="label">Fecha autorización:</td>
            <td>{{ optional($invoice->auth_date)->format('d/m/Y H:i:s') }}</td></tr>
        <tr><td class="label">Ambiente:</td><td>PRODUCCIÓN</td></tr>
        <tr><td class="label">Emisión:</td><td>NORMAL</td></tr>
        <tr><td class="label">Clave de acceso:</td><td></td></tr>
      </table>
      <div class="barcode-container">
        <img src="data:image/png;base64,{{ DNS1D::getBarcodePNG($invoice->access_key,'C128',1,30) }}"
             alt="barcode">
        <div class="small">{{ $invoice->access_key }}</div>
      </div>
    </div>
    <div class="clearfix"></div>
  </div>

  {{-- Cliente --}}
  <div class="client-box">
    <p><strong>Razón Social / Nombres y Apellidos:</strong> {{ $invoice->sender->full_name }}</p>
    <p><strong>Identificación:</strong> {{ $invoice->sender->identification }}</p>
    <p class="info-line">
      <span class="info-item"><strong>Fecha:</strong>
        {{ \Carbon\Carbon::parse($invoice->issue_date)->format('d/m/Y') }}</span>
      <span class="info-item"><strong>Placa / Matrícula:</strong>
        {{ $invoice->reception->vehicle_plate ?? '' }}</span>
      <span class="info-item"><strong>Guía:</strong>
        {{ $invoice->reception->guide_number ?? '' }}</span>
    </p>
    <p><strong>Dirección:</strong> {{ $invoice->sender->address }}</p>
  </div>

  {{-- Detalle de líneas --}}
  <table class="invoice-details">
    <thead>
      <tr>
        <th>Cod. Principal</th>
        <th>Cod. Auxiliar</th>
        <th>Cantidad</th>
        <th>Descripción</th>
        <th>Precio U.</th>
        <th>Descuento</th>
        <th>Precio Total</th>
      </tr>
    </thead>
    <tbody>
      @foreach($invoice->invDetails as $line)
      <tr>
        <td class="text-center">{{ $line->principal_code }}</td>
        <td class="text-center">{{ $line->auxiliary_code }}</td>
        <td class="text-right">{{ number_format($line->quantity,2) }}</td>
        <td>{{ $line->description }}</td>
        <td class="text-right">{{ number_format($line->unit_price,6) }}</td>
        <td class="text-right">{{ number_format($line->discount ?? 0,2) }}</td>
        <td class="text-right">{{ number_format($line->total,2) }}</td>
      </tr>
      @endforeach
    </tbody>
  </table>

  {{-- Pago y Totales --}}
  <div class="bottom-container">
    <div class="payment-box">
      <table>
        <thead><tr><th>Forma de pago</th><th>Valor</th></tr></thead>
        <tbody>
          <tr>
            <td>{{ strtoupper($invoice->reception->pay_method) }}</td>
            <td class="text-right">{{ number_format($invoice->reception->cash_recv,2) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="totals-box">
      <table class="totals">
        <tr><td>SUBTOTAL 15%</td><td>{{ number_format($invoice->subtotal_15 ?? 0, 2) }}</td></tr>
        <tr><td>SUBTOTAL 0%</td><td>{{ number_format($invoice->subtotal_0 ?? 0, 2) }}</td></tr>
        <tr><td>SUBTOTAL NO OBJETO DE IVA</td><td>{{ number_format($invoice->subtotal_no_objeto_iva ?? 0, 2) }}</td></tr>
        <tr><td>SUBTOTAL EXENTO DE IVA</td><td>{{ number_format($invoice->subtotal_exento_iva ?? 0, 2) }}</td></tr>
        <tr><td>SUBTOTAL SIN IMPUESTOS</td><td>{{ number_format($invoice->subtotal_sin_impuestos ?? 0, 2) }}</td></tr>
        <tr><td>TOTAL DESCUENTO</td><td>{{ number_format($invoice->total_descuento ?? 0, 2) }}</td></tr>

        <!-- Nuevos conceptos -->
        <tr><td>SEGURO DE PAQUETES</td><td>{{ number_format($invoice->total_seguro_paquetes ?? 0, 2) }}</td></tr>
        <tr><td>SEGURO DE ENVÍO</td><td>{{ number_format($invoice->total_seguro_envio ?? 0, 2) }}</td></tr>
        <tr><td>DESADUANIZACIÓN</td><td>{{ number_format($invoice->total_desaduanizacion ?? 0, 2) }}</td></tr>
        <tr><td>TRANSMISIÓN</td><td>{{ number_format($invoice->total_transmision ?? 0, 2) }}</td></tr>

        <tr><td>ICE</td><td>{{ number_format($invoice->ice ?? 0, 2) }}</td></tr>
        <tr><td>IVA 15%</td><td>{{ number_format($invoice->vat ?? 0, 2) }}</td></tr>
        <tr><td>TOTAL DEVOLUCIÓN IVA</td><td>{{ number_format($invoice->total_devolucion_iva ?? 0, 2) }}</td></tr>
        <tr><td>IRBPNR</td><td>{{ number_format($invoice->irbpnr ?? 0, 2) }}</td></tr>
        <tr><td>PROPINA</td><td>{{ number_format($invoice->propina ?? 0, 2) }}</td></tr>

        <tr><td><strong>VALOR TOTAL</strong></td><td><strong>{{ number_format($invoice->total ?? 0, 2) }}</strong></td></tr>
    </table>
    </div>
    <div class="clearfix"></div>
  </div>

</body>
</html>
