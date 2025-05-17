<?php

return [
    'cert_path'          => env('SRI_CERT_PATH'),
    'cert_password'      => env('SRI_CERT_PASSWORD'),

    'wsdl_recepcion'     => env('SRI_WSDL_RECEPCION'),
    'wsdl_autorizacion'  => env('SRI_WSDL_AUTORIZACION'),

    'dir_firmados'       => realpath(env('SRI_DIR_FIRMADOS', 'C:/facturas/facturas_firmados')),
    'dir_autorizados'    => realpath(env('SRI_DIR_AUTORIZADOS', 'C:/facturas/autorizados')),
    'dir_no_autorizados' => realpath(env('SRI_DIR_NO_AUTORIZADOS', 'C:/facturas/no_autorizados')),
];
