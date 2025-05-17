import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head } from '@inertiajs/react'
import ShippingInterface from './ShippingInterface'

export default function ReceptionIndex() {
  return (
    <AuthenticatedLayout>
      <Head title="Recepción de Paquetes" />
      <div className="py-6 px-4">
        <ShippingInterface />
      </div>
    </AuthenticatedLayout>
  )
}
