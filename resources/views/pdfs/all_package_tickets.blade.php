<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    @page {
        margin-top: 0mm; /* elimina margen superior de la página */
    }

    body {
        font-family: DejaVu Sans, sans-serif;
        font-size: 12px;
        color: #111;
        margin: 2 10px 5px 10px; /* elimina margen superior */
    }

    .center { text-align: center; }
    .barcode-container { margin-top: 0; margin-bottom: 4px; }
    .barcode { display: inline-block; margin-bottom: 0; transform: scale(0.8); transform-origin: top left; }
    .bold { font-weight: bold; }
    .red { color: #d10000; }
    .section { margin-top: 8px; padding-top: 6px; border-top: 1px solid #aaa; }
    .section-title { background-color: #f2f2f2; font-weight: bold; font-size: 13px; padding: 2px 4px; border-left: 4px solid #333; margin-bottom: 3px; }
    .info-line { margin: 1px 0; }
    .icon { display: inline-block; width: 12px; font-weight: bold; margin-right: 3px; text-align: center; }
    .bridgeport-title { text-align: center; font-size: 22px; font-weight: bold; margin-top: 8px; }
    .details-table { width: 100%; margin: 6px 0; border-collapse: collapse; }
    .details-table td { vertical-align: top; padding: 2px 4px; width: 50%; }
    .dual-section { display: table; width: 100%; margin-top: 8px; padding-top: 6px; border-top: 1px solid #aaa; }
    .dual-section .column { display: table-cell; width: 50%; vertical-align: top; padding: 0 6px; }
    .page-break { page-break-after: always; }
  </style>
</head>
<body>

@foreach($barcodes as $item)
  @php
    $package = $item['package'];
    $barcode = $item['barcode'];
    $isPorCobrar = in_array(strtoupper($reception->pay_method), ['POR COBRAR', 'TRANSFERENCIA']);
    $weightLbs = is_numeric($package->pounds) ? floatval($package->pounds) : 0;
    $weightKgs = $weightLbs * 0.453592;
  @endphp

  {{-- Código de barras pegado arriba --}}
  <div class="barcode-container center" style="padding-top: 0;">
    <div class="barcode">{!! $barcode !!}</div>
    <div class="bold">{{ $package->barcode ?? '---' }}</div>
  </div>

  {{-- POR COBRAR --}}
  @if ($isPorCobrar)
    <div class="center" style="margin-bottom: 6px;">
      <div class="bold red" style="font-size: 16px;">POR COBRAR</div>
      <div class="bold red" style="font-size: 14px;">
        {{ number_format($package->total, 2) }} + recargos
      </div>
    </div>
  @endif

  {{-- Datos generales --}}
  <table class="details-table">
    <tr>
      <td><span class="bold">No. Comprobante:</span> {{ $reception->number }}</td>
      <td><span class="bold">FECHA:</span> {{ \Carbon\Carbon::parse($reception->date_time)->format('Y-m-d') }}</td>
    </tr>
    <tr>
      @php
        $contentNames = $package->packageItems->map(function($item) {
          return $item->artPackage->translation ?? $item->artPackage->name ?? 'Artículo';
        })->toArray();
      @endphp
      <td><span class="bold">CONTENIDO:</span> {{ implode(', ', $contentNames) }}</td>
      <td><span class="bold">PESO LBS:</span> {{ number_format($weightLbs, 2) }}</td>
    </tr>
    <tr>
      <td><span class="bold">AL COBRO:</span> <span class="red">${{ number_format($package->total, 2) }}</span></td>
      <td><span class="bold">PESO KGS:</span> {{ number_format($weightKgs, 2) }}</td>
    </tr>
  </table>

  <div class="bridgeport-title">BRIDGEPORT</div>

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

  @if (!$loop->last)
    <div class="page-break"></div>
  @endif

@endforeach

</body>
</html>
