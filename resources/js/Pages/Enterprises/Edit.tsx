import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head } from '@inertiajs/react'
import EnterpriseForm from './Form'

export default function Edit({ enterprise }: any) {
  return (
    <AuthenticatedLayout>
      <Head title="Editar Empresa" />
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Editar Empresa</h1>
        <EnterpriseForm enterprise={enterprise} />
      </div>
    </AuthenticatedLayout>
  )
}
