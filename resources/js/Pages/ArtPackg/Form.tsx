import { useForm } from '@inertiajs/react'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Button } from '@/Components/ui/button'
import { Card, CardContent } from '@/Components/ui/card'
import { Switch } from '@/Components/ui/switch'

export default function ArtPackgForm({ art_packg = null }: { art_packg?: any }) {
  const { data, setData, post, put, processing, errors } = useForm({
    name: art_packg?.name || '',
    unit_type: art_packg?.unit_type || '',
    unit_price: art_packg?.unit_price || '',
    canceled: art_packg?.canceled || false,
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (art_packg) {
      put(`/art_packgs/${art_packg.id}`, { preserveScroll: true })
    } else {
      post('/art_packgs', { preserveScroll: true })
    }
  }

  return (
    <Card className="bg-[#1e1e2f] border border-purple-700 shadow-xl">
      <CardContent className="p-6 space-y-5 text-sm text-white">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nombre</Label>
              <Input
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
                className="bg-[#2a2a3d] border-gray-600 text-white"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label>Tipo de Unidad</Label>
              <Input
                value={data.unit_type}
                onChange={(e) => setData('unit_type', e.target.value)}
                className="bg-[#2a2a3d] border-gray-600 text-white"
              />
            </div>

            <div>
              <Label>Precio por Unidad</Label>
              <Input
                type="number"
                step="0.01"
                value={data.unit_price}
                onChange={(e) => setData('unit_price', e.target.value)}
                className="bg-[#2a2a3d] border-gray-600 text-white"
              />
            </div>

            <div className="pt-4">
              <Label>Anulado</Label>
              <div className="mt-1">
                <Switch
                  checked={data.canceled}
                  onCheckedChange={(val) => setData('canceled', val)}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 text-end">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white px-6" disabled={processing}>
              {art_packg ? 'Actualizar' : 'Guardar'} Artículo
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
