import { Head, Link, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { PageProps } from '@/types'
import { useState } from 'react'
import { Button } from '@/Components/ui/button'

interface ArtPackg {
  id: string
  name: string
  unit_type: string
  unit_price: string
  canceled: boolean
}

export default function ArtPackgIndex({ artPackgs }: PageProps<{ artPackgs: ArtPackg[] }>) {
  const [loading, setLoading] = useState(false)

  return (
    <AuthenticatedLayout>
      <Head title="Artículos de Embalaje" />

      <div className="container mx-auto px-4 py-8">
        {/* Cabecera con fondo degradado */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 rounded-t-lg">
          <h1 className="text-2xl font-bold">Artículos de Embalaje</h1>
          <p className="text-purple-100 text-sm">Listado de artículos utilizados para embalar paquetes</p>
        </div>

        {/* Cuerpo del módulo */}
        <div className="bg-slate-900 border border-slate-800 px-6 py-4 rounded-b-lg shadow-md">
          <div className="flex justify-end mb-4">
            <Link href="/art_packgs/create">
              <Button className="bg-green-600 hover:bg-green-700">+ Nuevo Artículo</Button>
            </Link>
          </div>

          <div className="overflow-auto rounded-lg border border-slate-700">
            <table className="min-w-full text-sm text-white table-auto">
              <thead className="bg-purpleDark text-white">
                <tr>
                  <th className="px-4 py-2 text-left">Nombre</th>
                  <th className="px-4 py-2 text-left">Tipo de Unidad</th>
                  <th className="px-4 py-2 text-left">Precio</th>
                  <th className="px-4 py-2 text-left">Anulado</th>
                  <th className="px-4 py-2 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {artPackgs.map((item) => (
                  <tr key={item.id} className="border-t border-slate-700 hover:bg-slate-800">
                    <td className="px-4 py-2">{item.name}</td>
                    <td className="px-4 py-2">{item.unit_type}</td>
                    <td className="px-4 py-2">${item.unit_price}</td>
                    <td className="px-4 py-2">{item.canceled ? 'Sí' : 'No'}</td>
                    <td className="px-4 py-2 space-x-2">
                      <Link href={`/art_packgs/${item.id}/edit`}>
                        <Button className="bg-purpleLight hover:bg-purpleDark text-white">Editar</Button>
                      </Link>
                      <Button
                        onClick={() => {
                          if (confirm('¿Estás seguro de que deseas eliminar este artículo?')) {
                            router.delete(`/art_packgs/${item.id}`, { preserveScroll: true })
                          }
                        }}
                        className="bg-red-600 hover:bg-red-800 text-white"
                      >
                        Eliminar
                      </Button>
                    </td>
                  </tr>
                ))}
                {!artPackgs.length && (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-slate-400">
                      No hay artículos registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
