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

    /*
    |--------------------------------------------------------------------------
    | Carpetas (relativas a storage_path())
    |--------------------------------------------------------------------------
    */
    'dir_xml_origen'       => env('SRI_DIR_XML_ORIGEN',       'facturas/origen'),
    'dir_xml_firmados'     => env('SRI_DIR_XML_FIRMADOS',     'facturas/firmados'),
    'dir_xml_autorizados'  => env('SRI_DIR_XML_AUTORIZADOS',  'facturas/autorizados'),
    'dir_xml_no_autorizados' => env('SRI_DIR_XML_NO_AUTORIZADOS', 'facturas/no_autorizados'),
];
