"use client";

import React from "react";
import { useForm } from "@inertiajs/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/Components/ui/select";
import axios from "axios";

interface RecipientFormData {
  country: string;
  id_type: string;
  identification: string;
  full_name: string;
  address: string;
  phone: string;
  whatsapp: boolean;
  email: string;
  postal_code: string;
  city: string;
  canton: string;
  state: string;
  blocked: boolean;
  alert: boolean;
  [key: string]: any;
}

interface RecipientCreateModalProps {
  open: boolean;
  onClose: (open: boolean) => void;
  onRecipientCreated: (data: RecipientFormData) => void;
}

export default function RecipientCreateModal({
  open,
  onClose,
  onRecipientCreated,
}: RecipientCreateModalProps) {
  const { data, setData, post, processing, errors, reset } = useForm<RecipientFormData>({
    country: "ECUADOR",
    id_type: "CEDULA",
    identification: "",
    full_name: "",
    address: "",
    phone: "",
    whatsapp: false,
    email: "",
    postal_code: "",
    city: "",
    canton: "",
    state: "",
    blocked: false,
    alert: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('/recipients-json', data);
      onRecipientCreated(response.data.recipient); // ✅ usa el recipient creado
      reset();
      onClose(false); // ✅ cierra el modal sin redirigir
    } catch (error) {
      console.error("Error al guardar el destinatario:", error);
      alert("Hubo un error al guardar el destinatario ❌");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1e1e2f] text-white border border-purple-700 shadow-xl max-w-2xl p-4 rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Crear Nuevo Destinatario</DialogTitle>
          <DialogDescription className="text-sm text-gray-400">
            Completa los campos para registrar al destinatario.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">

            {/* Tipo de ID */}
            <div>
              <Label className="text-sm">Tipo de identificación</Label>
              <Select value={data.id_type} onValueChange={(val) => setData("id_type", val)}>
                <SelectTrigger className="text-sm w-full bg-[#2a2a3d] text-white border border-gray-600">
                  <SelectValue placeholder="Seleccionar tipo de ID" />
                </SelectTrigger>
                <SelectContent className="bg-[#2a2a3d] text-white">
                  <SelectItem value="RUC">RUC</SelectItem>
                  <SelectItem value="CEDULA">CEDULA</SelectItem>
                  <SelectItem value="PASAPORTE">PASAPORTE</SelectItem>
                </SelectContent>
              </Select>
              {errors.id_type && <p className="text-red-500 text-xs">{errors.id_type}</p>}
            </div>

            {/* Identificación */}
            <div>
              <Label className="text-sm">Identificación</Label>
              <Input
                className="text-sm bg-[#2a2a3d] text-white border border-gray-600"
                value={data.identification}
                onChange={(e) => setData("identification", e.target.value)}
              />
              {errors.identification && <p className="text-red-500 text-xs">{errors.identification}</p>}
            </div>

            {/* Nombre completo */}
            <div>
              <Label className="text-sm">Apellidos y nombres</Label>
              <Input
                className="text-sm bg-[#2a2a3d] text-white border border-gray-600"
                value={data.full_name}
                onChange={(e) => setData("full_name", e.target.value)}
              />
              {errors.full_name && <p className="text-red-500 text-xs">{errors.full_name}</p>}
            </div>

            {/* País */}
            <div>
              <Label className="text-sm">País</Label>
              <Select value={data.country} onValueChange={(val) => setData("country", val)}>
                <SelectTrigger className="text-sm w-full bg-[#2a2a3d] text-white border border-gray-600">
                  <SelectValue placeholder="Seleccionar país" />
                </SelectTrigger>
                <SelectContent className="bg-[#2a2a3d] text-white">
                  <SelectItem value="ECUADOR">ECUADOR</SelectItem>
                </SelectContent>
              </Select>
              {errors.country && <p className="text-red-500 text-xs">{errors.country}</p>}
            </div>

            {/* Dirección */}
            <div className="md:col-span-2">
              <Label className="text-sm">Dirección</Label>
              <Input
                className="text-sm bg-[#2a2a3d] text-white border border-gray-600"
                value={data.address}
                onChange={(e) => setData("address", e.target.value)}
              />
              {errors.address && <p className="text-red-500 text-xs">{errors.address}</p>}
            </div>

            {/* Teléfono + WhatsApp */}
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label className="text-sm">Celular</Label>
                <Input
                  className="text-sm bg-[#2a2a3d] text-white border border-gray-600"
                  value={data.phone}
                  onChange={(e) => setData("phone", e.target.value)}
                />
                {errors.phone && <p className="text-red-500 text-xs">{errors.phone}</p>}
              </div>
              <div className="flex items-center gap-2 pb-1">
                <input
                  type="checkbox"
                  checked={data.whatsapp}
                  onChange={(e) => setData("whatsapp", e.target.checked)}
                  className="h-4 w-4"
                />
                <Label className="text-sm">WhatsApp</Label>
              </div>
            </div>

            {/* Email */}
            <div>
              <Label className="text-sm">Correo electrónico</Label>
              <Input
                type="email"
                className="text-sm bg-[#2a2a3d] text-white border border-gray-600"
                value={data.email}
                onChange={(e) => setData("email", e.target.value)}
              />
            </div>

            {/* Código Postal */}
            <div>
              <Label className="text-sm">Código Postal</Label>
              <Input
                className="text-sm bg-[#2a2a3d] text-white border border-gray-600"
                value={data.postal_code}
                onChange={(e) => setData("postal_code", e.target.value)}
              />
            </div>

            {/* Ciudad */}
            <div>
              <Label className="text-sm">Parroquia / City</Label>
              <Input
                className="text-sm bg-[#2a2a3d] text-white border border-gray-600"
                value={data.city}
                onChange={(e) => setData("city", e.target.value)}
              />
            </div>

            {/* Cantón */}
            <div>
              <Label className="text-sm">Cantón / Country</Label>
              <Input
                className="text-sm bg-[#2a2a3d] text-white border border-gray-600"
                value={data.canton}
                onChange={(e) => setData("canton", e.target.value)}
              />
            </div>

            {/* Provincia */}
            <div>
              <Label className="text-sm">Provincia / State</Label>
              <Input
                className="text-sm bg-[#2a2a3d] text-white border border-gray-600"
                value={data.state}
                onChange={(e) => setData("state", e.target.value)}
              />
            </div>

            {/* Bloqueo */}
            <div>
              <Label className="text-sm">Bloqueo</Label>
              <Select
                value={data.blocked ? "1" : "0"}
                onValueChange={(val) => setData("blocked", val === "1")}
              >
                <SelectTrigger className="text-sm w-full bg-[#2a2a3d] text-white border border-gray-600">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent className="bg-[#2a2a3d] text-white">
                  <SelectItem value="0">SIN BLOQUEO</SelectItem>
                  <SelectItem value="1">BLOQUEADO</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Alerta */}
            <div>
              <Label className="text-sm">Alerta</Label>
              <Select
                value={data.alert ? "1" : "0"}
                onValueChange={(val) => setData("alert", val === "1")}
              >
                <SelectTrigger className="text-sm w-full bg-[#2a2a3d] text-white border border-gray-600">
                  <SelectValue placeholder="Seleccionar alerta" />
                </SelectTrigger>
                <SelectContent className="bg-[#2a2a3d] text-white">
                  <SelectItem value="0">SIN ALERTA</SelectItem>
                  <SelectItem value="1">ALERTA</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => onClose(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={processing}>
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
