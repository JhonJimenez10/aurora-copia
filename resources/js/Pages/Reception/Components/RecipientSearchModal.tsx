"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";

interface Recipient {
  id: number;
  full_name: string;
  identification: string;
  email: string;
  phone: string;
  city: string;
}

interface RecipientSearchModalProps {
  open: boolean;
  onClose: (open: boolean) => void;
  onSelect: (recipient: Recipient) => void;
}

export default function RecipientSearchModal({
  open,
  onClose,
  onSelect,
}: RecipientSearchModalProps) {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setQuery("");
      fetchRecipients("");
    }
  }, [open]);

  const fetchRecipients = async (searchQuery: string) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/recipients/search?identification=${encodeURIComponent(searchQuery)}`
      );
      setRecipients(response.data || []);
    } catch (error) {
      console.error("Error loading recipients", error);
      setRecipients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchRecipients(query);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1e1e2f] text-white border border-purple-700 shadow-xl max-w-3xl p-4 rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            Buscar Destinatario
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mt-2">
          <Input
            placeholder="Buscar por identificación"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="text-sm bg-[#2a2a3d] text-white border border-gray-600 placeholder:text-gray-400"
          />
          <Button onClick={handleSearch} className="text-sm">
            Buscar
          </Button>
        </div>

        <div className="mt-4 min-h-[200px] max-h-[400px] overflow-y-auto border border-gray-600 rounded">
          {loading ? (
            <p className="text-gray-400 text-sm p-2">Cargando...</p>
          ) : recipients.length === 0 ? (
            <p className="text-gray-400 text-sm p-2">
              No se encontraron resultados.
            </p>
          ) : (
            <table className="w-full text-sm table-auto">
              <thead className="bg-[#2a2a3d] sticky top-0 text-white">
                <tr>
                  <th className="px-2 py-1 text-left">Nombre</th>
                  <th className="px-2 py-1 text-left">Identificación</th>
                  <th className="px-2 py-1 text-left">Correo</th>
                  <th className="px-2 py-1 text-left">Teléfono</th>
                  <th className="px-2 py-1 text-left">Ciudad</th>
                </tr>
              </thead>
              <tbody>
                {recipients.map((recipient) => (
                  <tr
                    key={recipient.id}
                    className="hover:bg-[#33334d] border-t border-gray-700 cursor-pointer"
                    onClick={() => {
                      onSelect(recipient);
                      onClose(false);
                    }}
                  >
                    <td className="px-2 py-1">{recipient.full_name}</td>
                    <td className="px-2 py-1">{recipient.identification}</td>
                    <td className="px-2 py-1">{recipient.email}</td>
                    <td className="px-2 py-1">{recipient.phone}</td>
                    <td className="px-2 py-1">{recipient.city}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <DialogFooter className="mt-4 flex justify-end">
          <Button onClick={() => onClose(false)} variant="secondary">
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
