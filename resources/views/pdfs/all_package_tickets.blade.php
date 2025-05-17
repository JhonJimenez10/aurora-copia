
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #111; margin: 20px; }
    .center { text-align: center; }
    .barcode-container { text-align: center; margin-bottom: 10px; }
    .barcode { display: inline-block; margin-bottom: 5px; }
    .bold { font-weight: bold; }
    .red { color: #d10000; }
    .section { margin-top: 15px; padding-top: 10px; border-top: 1px solid #aaa; }
    .section-title { background-color: #f2f2f2; font-weight: bold; font-size: 13px; padding: 4px 6px; border-left: 4px solid #333; margin-bottom: 5px; }
    .info-line { margin: 2px 0; }
    .icon { display: inline-block; width: 14px; font-weight: bold; margin-right: 4px; text-align: center; }
    .bridgeport-title { text-align: center; font-size: 16px; font-weight: bold; margin-top: 10px; }
    .details-table { width: 100%; margin: 10px 0; border-collapse: collapse; }
    .details-table td { vertical-align: top; padding: 4px 6px; width: 50%; }
    .dual-section { display: table; width: 100%; margin-top: 15px; padding-top: 10px; border-top: 1px solid #aaa; }
    .dual-section .column { display: table-cell; width: 50%; vertical-align: top; padding: 0 10px; }
    .page-break { page-break-after: always; }
  </style>
</head>
<body>

@foreach($barcodes as $item)
  @php
    $package = $item['package'];
    $barcode = $item['barcode'];
  @endphp

  <div class="barcode-container">
    <div class="barcode">{!! $barcode !!}</div>
    <div class="bold">{{ $package->barcode ?? '---' }}</div>
  </div>

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

      <td><span class="bold">PESO LBS:</span> {{ number_format($package->weight, 2) }}</td>
    </tr>
    <tr>
      <td><span class="bold">AL COBRO:</span> <span class="red">${{ number_format($package->total, 2) }}</span></td>
      <td><span class="bold">PESO KGS:</span> {{ number_format($package->weight * 0.453592, 2) }}</td>
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
