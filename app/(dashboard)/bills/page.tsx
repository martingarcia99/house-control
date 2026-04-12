'use client'

import { useEffect, useState, useRef, useMemo, memo, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, Button, Input, Select, Modal, Icon, getCategoryIcon } from '@/components/ui'
import { BillsSkeleton } from '@/components/ui/Skeleton'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Bill {
  id: string
  amount: number
  description?: string | null
  dueDate: string
  categoryId: string
  householdId: string
  paidById: string
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  attachmentUrl?: string | null
  notes?: string | null
  createdAt: string
  category: {
    id: string
    name: string
    icon?: string | null
    color?: string | null
  }
  paidBy: {
    id: string
    name: string
  }
}

export default function BillsPage() {
  const { household, setBills, bills, categories, setCategories } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showScanModal, setShowScanModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailBill, setDetailBill] = useState<Bill | null>(null)
  const [scanning, setScanning] = useState(false)
  const [editingBill, setEditingBill] = useState<Bill | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [scannedImage, setScannedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    categoryId: '',
    status: 'PENDING',
  })

  useEffect(() => {
    async function fetchData() {
      if (!household) return
      
      try {
        const res = await fetch(`/api/bills?householdId=${household.id}`, { credentials: 'include' })
        const data = await res.json()
        
        if (res.ok) {
          setBills(data.bills)
          setCategories(data.categories)
        }
      } catch (error) {
        console.error('Error fetching bills:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [household, setBills, setCategories])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!household) return

    const url = editingBill ? `/api/bills/${editingBill.id}` : '/api/bills'
    const method = editingBill ? 'PUT' : 'POST'

    const payload: Record<string, unknown> = {
      ...formData,
      amount: parseFloat(formData.amount),
      householdId: household.id,
    }

    if (!editingBill && scannedImage) {
      payload.attachmentUrl = scannedImage
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const data = await res.json()
        if (editingBill) {
          setBills(bills.map(b => b.id === editingBill.id ? data.bill : b))
        } else {
          setBills([data.bill, ...bills])
        }
        setShowModal(false)
        resetForm()
      }
    } catch (error) {
      console.error('Error saving bill:', error)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta factura?')) return
    
    try {
      const res = await fetch(`/api/bills/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (res.ok) {
        setBills(bills.filter(b => b.id !== id))
      }
    } catch (error) {
      console.error('Error deleting bill:', error)
    }
  }

  async function handleStatusChange(id: string, status: string) {
    try {
      const res = await fetch(`/api/bills/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      })

      if (res.ok) {
        const data = await res.json()
        setBills(bills.map(b => b.id === id ? data.bill : b))
      }
    } catch (error) {
      console.error('Error updating bill:', error)
    }
  }

  function resetForm() {
    setEditingBill(null)
    setFormData({
      amount: '',
      description: '',
      dueDate: format(new Date(), 'yyyy-MM-dd'),
      categoryId: '',
      status: 'PENDING',
    })
    setScannedImage(null)
  }

  function openEditModal(bill: Bill) {
    setEditingBill(bill)
    setFormData({
      amount: bill.amount.toString(),
      description: bill.description || '',
      dueDate: format(new Date(bill.dueDate), 'yyyy-MM-dd'),
      categoryId: bill.categoryId,
      status: bill.status,
    })
    setShowModal(true)
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setPreviewImage(reader.result as string)
        setShowScanModal(true)
      }
      reader.readAsDataURL(file)
    }
  }

  async function scanBill() {
    if (!previewImage) return

    setScanning(true)
    try {
      const base64Data = previewImage.split(',')[1]
      const mimeType = previewImage.split(',')[0].replace('data:', '').replace(';base64', '')

      const formDataToSend = new FormData()
      const blob = new Blob([Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))], { type: mimeType })
      formDataToSend.append('image', blob, 'bill.jpg')

      const res = await fetch('/api/bills/scan', {
        method: 'POST',
        credentials: 'include',
        body: formDataToSend,
      })

      const data = await res.json()

      if (data.success && data.data) {
        const extracted = data.data

        if (extracted.category) {
          const matchedCategory = categories.find(
            c => c.name.toLowerCase().includes(extracted.category.toLowerCase())
          )
          if (matchedCategory) {
            setFormData(prev => ({ ...prev, categoryId: matchedCategory.id }))
          }
        }

        setFormData(prev => ({
          ...prev,
          amount: extracted.amount?.toString() || prev.amount,
          description: extracted.description || prev.description,
          dueDate: extracted.dueDate || prev.dueDate,
        }))

        setShowScanModal(false)
        setShowModal(true)
        setScannedImage(previewImage)
      } else {
        alert(data.error || 'Error al analizar la factura')
      }
    } catch (error) {
      console.error('Error scanning bill:', error)
      alert('Error al procesar la imagen')
    } finally {
      setScanning(false)
    }
  }

  function resetScan() {
    setPreviewImage(null)
    setShowScanModal(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  function openDetailModal(bill: Bill) {
    setDetailBill(bill)
    setShowDetailModal(true)
  }

  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PAID: 'bg-green-100 text-green-800',
    OVERDUE: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <header className="bg-white border-b border-gray-200 px-4 pt-4 pb-3">
          <div className="max-w-4xl mx-auto flex justify-between items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">Facturas</h1>
            <div className="flex gap-2">
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
              <div className="w-16 h-8 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-2 md:px-4 py-4">
          <BillsSkeleton />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 px-4 pt-4 pb-3">
        <div className="max-w-4xl mx-auto flex justify-between items-center gap-2">
          <h1 className="text-xl font-bold text-gray-900">Facturas</h1>
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleImageSelect}
              className="hidden"
            />
            <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Icon name="camera" size={16} />
            </Button>
            <Button size="sm" onClick={() => { resetForm(); setShowModal(true) }}>
              <Icon name="plus" size={16} className="mr-1" />
              <span className="hidden sm:inline">Nueva</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-2 md:px-4 py-4">
        {bills.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Icon name="file" size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No hay facturas todavía</p>
              <Button className="mt-4" onClick={() => setShowModal(true)}>
                Añadir primera factura
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {bills.map((bill) => (
              <Card key={bill.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openDetailModal(bill)}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex gap-3 min-w-0 flex-1">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${bill.category.color}20` }}
                      >
                        <Icon 
                          name={getCategoryIcon(bill.category.icon)} 
                           style={{ color: bill.category.color ?? '#6b7280' }}
                          size={20}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm truncate">{bill.description || bill.category.name}</p>
                          {bill.attachmentUrl && (
                            <Icon name="paperclip" size={12} className="text-gray-400 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-500">
                            {format(new Date(bill.dueDate), "d MMM", { locale: es })}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="text-xs text-gray-500">{bill.category.name}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <p className="font-semibold text-sm">{bill.amount.toFixed(2)}€</p>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusColors[bill.status]}`}>
                        {bill.status === 'PENDING' ? 'Pendiente' : bill.status === 'PAID' ? 'Pagada' : bill.status === 'OVERDUE' ? 'Vencida' : 'Cancelada'}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-end gap-0.5 mt-2 pt-2 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                    {bill.status !== 'PAID' && (
                      <Button variant="ghost" size="sm" className="p-1.5 h-7" onClick={() => handleStatusChange(bill.id, 'PAID')}>
                        <Icon name="check" size={14} />
                        <span className="ml-1 text-xs">Pagar</span>
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="p-1.5 h-7" onClick={() => openEditModal(bill)}>
                      <Icon name="edit" size={14} />
                      <span className="ml-1 text-xs">Editar</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="p-1.5 h-7 text-red-500 hover:text-red-600" onClick={() => handleDelete(bill.id)}>
                      <Icon name="trash" size={14} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm() }} title={editingBill ? 'Editar factura' : 'Nueva factura'}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Importe</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white"
                >
                  <option value="PENDING">Pendiente</option>
                  <option value="PAID">Pagada</option>
                  <option value="OVERDUE">Vencida</option>
                  <option value="CANCELLED">Cancelada</option>
                </select>
              </div>
            </div>
            <Input
              id="description"
              label="Descripción"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ej: Factura de luz febrero"
            />
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de vencimiento</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-1 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-xs"
                required
              />
            </div>
            <Select
              id="category"
              label="Categoría"
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              options={categories.map(c => ({ value: c.id, label: c.name }))}
              required
            />
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => { setShowModal(false); resetForm() }}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                {editingBill ? 'Guardar' : 'Crear'}
              </Button>
            </div>
          </form>
        </Modal>

        <Modal isOpen={showScanModal} onClose={resetScan} title="Escanear factura">
          <div className="space-y-2">
            {previewImage && (
              <div className="relative">
                <img 
                  src={previewImage} 
                  alt="Factura" 
                  className="w-full max-h-64 object-contain rounded-lg bg-gray-100"
                />
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              {scanning ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mr-2"></div>
                  <span>Analizando factura con IA...</span>
                </div>
              ) : (
                <>
                  <Button onClick={scanBill} className="w-full">
                    <Icon name="sparkles" size={18} className="mr-1" />
                    Extraer datos con IA
                  </Button>
                  <Button variant="secondary" onClick={resetScan} className="w-full">
                    Cancelar
                  </Button>
                </>
              )}
            </div>
          </div>
        </Modal>

        <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Detalle de factura" size="lg">
          {detailBill && (
            <div className="flex flex-col max-h-[70vh]">
              <div className="flex-1 overflow-y-auto space-y-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${detailBill.category.color}20` }}
                  >
                    <Icon 
                      name={getCategoryIcon(detailBill.category.icon)} 
                       style={{ color: detailBill.category.color ?? '#6b7280' }}
                      size={24}
                    />
                  </div>
                  <div>
                    <p className="font-semibold">{detailBill.description || detailBill.category.name}</p>
                    <p className="text-sm text-gray-500">{detailBill.category.name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Importe</p>
                    <p className="font-semibold text-lg">{detailBill.amount.toFixed(2)}€</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Estado</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[detailBill.status]}`}>
                      {detailBill.status === 'PENDING' ? 'Pendiente' : detailBill.status === 'PAID' ? 'Pagada' : detailBill.status === 'OVERDUE' ? 'Vencida' : 'Cancelada'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Fecha vencimiento</p>
                    <p className="font-medium">{format(new Date(detailBill.dueDate), 'd MMMM yyyy', { locale: es })}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Pagado por</p>
                    <p className="font-medium">{detailBill.paidBy.name}</p>
                  </div>
                </div>

                {detailBill.attachmentUrl && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Documento escaneado</p>
                    <img 
                      src={detailBill.attachmentUrl} 
                      alt="Factura escaneada" 
                      className="w-full rounded-lg border border-gray-200"
                    />
                  </div>
                )}

                {detailBill.notes && (
                  <div>
                    <p className="text-xs text-gray-500">Notas</p>
                    <p className="text-sm">{detailBill.notes}</p>
                  </div>
                )}
              </div>
            
            <div className="flex gap-2 pt-3 border-t mt-4 flex-shrink-0">
              <Button 
                variant="secondary" 
                className="flex-1" 
                onClick={() => {
                  setShowDetailModal(false)
                  openEditModal(detailBill)
                }}
              >
                <Icon name="edit" size={16} className="mr-1" />
                Editar
              </Button>
              <Button 
                className="flex-1" 
                onClick={() => setShowDetailModal(false)}
              >
                Cerrar
              </Button>
            </div>
            </div>
          )}
        </Modal>
      </main>
    </div>
  )
}
