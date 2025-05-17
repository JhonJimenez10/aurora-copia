import { useForm } from '@inertiajs/react'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Button } from '@/Components/ui/button'
import { Card, CardContent } from '@/Components/ui/card'
import { Switch } from '@/Components/ui/switch'

interface EnterpriseFormData {
  ruc: string
  name: string
  commercial_name: string
  matrix_address: string
  branch_address: string
  accounting: boolean
  phone: string
  email: string
  signature: File | null
  signature_password: string
  [key: string]: any
}

export default function EnterpriseForm({ enterprise = null }: { enterprise?: any }) {
  const { data, setData, post, put, processing, errors } = useForm<EnterpriseFormData>({
    ruc: enterprise?.ruc || '',
    name: enterprise?.name || '',
    commercial_name: enterprise?.commercial_name || '',
    matrix_address: enterprise?.matrix_address || '',
    branch_address: enterprise?.branch_address || '',
    accounting: enterprise?.accounting || false,
    phone: enterprise?.phone || '',
    email: enterprise?.email || '',
    signature: null,
    signature_password: enterprise?.signature_password || '',
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (enterprise) {
      put(`/enterprises/${enterprise.id}`, {
        preserveScroll: true,
        forceFormData: true,
      })
    } else {
      post('/enterprises', {
        preserveScroll: true,
        forceFormData: true,
      })
    }
  }

  return (
    <Card className="bg-[#1e1e2f] border border-purple-700 shadow-xl">
      <CardContent className="p-6 space-y-5 text-sm text-white">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-white">RUC</Label>
              <Input value={data.ruc} onChange={(e) => setData('ruc', e.target.value)} className="bg-[#2a2a3d] border-gray-600 text-white" />
              {errors.ruc && <p className="text-red-500 text-xs mt-1">{errors.ruc}</p>}
            </div>

            <div>
              <Label className="text-white">Nombre Legal</Label>
              <Input value={data.name} onChange={(e) => setData('name', e.target.value)} className="bg-[#2a2a3d] border-gray-600 text-white" />
            </div>

            <div>
              <Label className="text-white">Nombre Comercial</Label>
              <Input value={data.commercial_name} onChange={(e) => setData('commercial_name', e.target.value)} className="bg-[#2a2a3d] border-gray-600 text-white" />
            </div>

            <div>
              <Label className="text-white">Dirección Matriz</Label>
              <Input value={data.matrix_address} onChange={(e) => setData('matrix_address', e.target.value)} className="bg-[#2a2a3d] border-gray-600 text-white" />
            </div>

            <div>
              <Label className="text-white">Dirección Sucursal</Label>
              <Input value={data.branch_address} onChange={(e) => setData('branch_address', e.target.value)} className="bg-[#2a2a3d] border-gray-600 text-white" />
            </div>

            <div>
              <Label className="text-white">Correo</Label>
              <Input value={data.email} onChange={(e) => setData('email', e.target.value)} className="bg-[#2a2a3d] border-gray-600 text-white" />
            </div>

            <div>
              <Label className="text-white">Teléfono</Label>
              <Input value={data.phone} onChange={(e) => setData('phone', e.target.value)} className="bg-[#2a2a3d] border-gray-600 text-white" />
            </div>
          </div>

          <div className="pt-4 border-t border-purple-700">
            <Label className="text-white">¿Lleva contabilidad?</Label>
            <div className="mt-1">
              <Switch checked={data.accounting} onCheckedChange={(val) => setData('accounting', val)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-white">Certificado (.p12)</Label>
              <Input type="file" accept=".p12" onChange={(e) => setData('signature', e.target.files?.[0] || null)} className="bg-[#2a2a3d] text-white" />
              {errors.signature && <p className="text-red-500 text-xs mt-1">{errors.signature}</p>}
            </div>

            <div>
              <Label className="text-white">Clave del Certificado</Label>
              <Input type="password" value={data.signature_password} onChange={(e) => setData('signature_password', e.target.value)} className="bg-[#2a2a3d] border-gray-600 text-white" />
            </div>
          </div>

          <div className="pt-4 text-end">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white px-6" disabled={processing}>
              {enterprise ? 'Actualizar' : 'Guardar'} Empresa
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
