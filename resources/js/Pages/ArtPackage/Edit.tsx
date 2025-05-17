import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head } from '@inertiajs/react'
import ArtPackageForm from './Form'

export default function Edit({ art_package }: any) {
  return (
    <AuthenticatedLayout>
      <Head title="Editar Artículo por Agencia" />
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Editar Artículo</h1>
        <ArtPackageForm art_package={art_package} />
      </div>
    </AuthenticatedLayout>
  )
}
