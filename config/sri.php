<?php
return [
    // WSDL de recepción y autorización
    'wsdl_recepcion'    => env(
        'SRI_WSDL_RECEPCION',
        'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl'
    ),
    'wsdl_autorizacion' => env(
        'SRI_WSDL_AUTORIZACION',
        'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl'
    ),

    // Carpeta donde guardaremos los XML autorizados
    'autorizados_dir'   => env(
        'SRI_DIR_AUTORIZADOS',
        storage_path('app/autorizados')
    ),
    'no_autorizados_dir'  => env(
        'SRI_DIR_NO_AUTORIZADOS',
        storage_path('app/no_autorizados')
    ),
];
