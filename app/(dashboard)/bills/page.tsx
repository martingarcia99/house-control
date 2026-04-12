'use client'

import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { useFetchWithCache, createCacheKey } from '@/lib/hooks/useFetchWithCache'
import { Card, CardContent, CardHeader, Button, Input, Select, Modal, Icon, getCategoryIcon } from '@/components/ui'
import { BillsSkeleton } from '@/components/ui/Skeleton'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Bill, Category } from '@/types'

interface BillResponse extends Omit<Bill, 'updatedAt'> {}
interface CategoriesResponse extends Omit<Category, 'isDefault' | 'householdId'> {}

export default function BillsPage() {
  const { household, setBills, bills, categories, setCategories } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showScanModal, setShowScanModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingBillId, setDeletingBillId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [detailBill, setDetailBill] = useState<Bill | null>(null)
  const [scanning, setScanning] = useState(false)
  const [editingBill, setEditingBill] = useState<Bill | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [scannedImage, setScannedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const fetchingRef = useRef(false)
  const [hasFetched, setHasFetched] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    issueDate: new Date().toISOString().split('T')[0],
    categoryId: '',
  })

  const { fetchWithCache, getCachedData, invalidateCache } = useFetchWithCache()

  const fetchData = useCallback(async () => {
    if (!household || fetchingRef.current) return
    fetchingRef.current = true

    const billsKey = createCacheKey('/api/bills', { householdId: household.id })
    const cached = getCachedData<{ bills: BillResponse[]; categories: CategoriesResponse[] }>(billsKey)

    if (cached) {
      setBills(cached.bills as Bill[])
      setCategories(cached.categories as Category[])
      setLoading(false)
      setHasFetched(true)
      fetchingRef.current = false
      return
    }

    try {
      const data = await fetchWithCache<{ bills: BillResponse[]; categories: CategoriesResponse[] }>(
        `/api/bills?householdId=${household.id}`,
        { staleTime: 300000 }
      )
      setBills(data.bills as Bill[])
      setCategories(data.categories as Category[])
    } catch (error) {
      console.error('Error fetching bills:', error)
    } finally {
      setLoading(false)
      setHasFetched(true)
      fetchingRef.current = false
    }
  }, [household, setBills, setCategories, fetchWithCache, getCachedData])

  useEffect(() => {
    if (household && !hasFetched && !fetchingRef.current) {
      fetchData()
    }
  }, [household, hasFetched, fetchData])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!household) return

    if (!formData.categoryId || !categories.find(c => c.id === formData.categoryId)) {
      setFormError('Selecciona una categoría')
      return
    }

    const url = editingBill ? `/api/bills/${editingBill.id}` : '/api/bills'
    const method = editingBill ? 'PUT' : 'POST'

    const payload: Record<string, unknown> = {
      amount: parseFloat(formData.amount),
      description: formData.description || undefined,
      issueDate: formData.issueDate || undefined,
      categoryId: formData.categoryId,
      householdId: household.id,
    }

    if (!editingBill && scannedImage) {
      payload.attachmentUrl = scannedImage
    }

    try {
      setFormError(null)
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
        const billsKey = createCacheKey('/api/bills', { householdId: household.id })
        for (let m = 1; m <= 12; m++) {
          const dashboardKey = createCacheKey('/api/dashboard', { householdId: household.id, month: m.toString(), year: new Date().getFullYear().toString() })
          invalidateCache(dashboardKey)
        }
        for (let m = 1; m <= 12; m++) {
          for (let y = new Date().getFullYear() - 1; y <= new Date().getFullYear(); y++) {
            const membersKey = createCacheKey('/api/households/members', { householdId: household.id, month: m.toString(), year: y.toString() })
            invalidateCache(membersKey)
          }
        }
        invalidateCache(billsKey)
        setShowModal(false)
        resetForm()
      } else {
        const data = await res.json()
        setFormError(data.error || 'Error al guardar')
      }
    } catch (error) {
      setFormError('Error al guardar')
      console.error('Error saving bill:', error)
    }
  }, [household, formData, editingBill, scannedImage, bills, setBills, invalidateCache])

const confirmDelete = useCallback(() => {
    if (!deletingBillId) return
    setShowDeleteModal(false)
     
    try {
      fetch(`/api/bills/${deletingBillId}`, {
        method: 'DELETE',
        credentials: 'include',
      }).then((res) => {
        if (res.ok) {
          setBills(bills.filter(b => b.id !== deletingBillId))
          if (household) {
            const billsKey = createCacheKey('/api/bills', { householdId: household.id })
            for (let m = 1; m <= 12; m++) {
              const dashboardKey = createCacheKey('/api/dashboard', { householdId: household.id, month: m.toString(), year: new Date().getFullYear().toString() })
              invalidateCache(dashboardKey)
            }
            for (let m = 1; m <= 12; m++) {
              for (let y = new Date().getFullYear() - 1; y <= new Date().getFullYear(); y++) {
                const membersKey = createCacheKey('/api/households/members', { householdId: household.id, month: m.toString(), year: y.toString() })
                invalidateCache(membersKey)
              }
            }
            invalidateCache(billsKey)
          }
        }
      })
    } catch (error) {
      console.error('Error deleting bill:', error)
    } finally {
      setDeletingBillId(null)
    }
  }, [deletingBillId, bills, setBills, household, invalidateCache])

  const handleDelete = useCallback((id: string) => {
    setDeletingBillId(id)
    setShowDeleteModal(true)
  }, [])

  const handleStatusChange = useCallback(async (id: string, status: string) => {
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
        if (household) {
          const billsKey = createCacheKey('/api/bills', { householdId: household.id })
          for (let m = 1; m <= 12; m++) {
            const dashboardKey = createCacheKey('/api/dashboard', { householdId: household.id, month: m.toString(), year: new Date().getFullYear().toString() })
            invalidateCache(dashboardKey)
          }
          for (let m = 1; m <= 12; m++) {
            for (let y = new Date().getFullYear() - 1; y <= new Date().getFullYear(); y++) {
              const membersKey = createCacheKey('/api/households/members', { householdId: household.id, month: m.toString(), year: y.toString() })
              invalidateCache(membersKey)
            }
          }
          invalidateCache(billsKey)
        }
      }
    } catch (error) {
      console.error('Error updating bill:', error)
    }
  }, [bills, setBills, household, invalidateCache])

  const resetForm = useCallback(() => {
    setEditingBill(null)
    setFormData({
      amount: '',
      description: '',
      issueDate: new Date().toISOString().split('T')[0],
      categoryId: '',
    })
    setScannedImage(null)
    setFormError(null)
  }, [])

  const openEditModal = useCallback((bill: Bill) => {
    setEditingBill(bill)
    const issueDateStr = bill.issueDate ? new Date(bill.issueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    setFormData({
      amount: bill.amount.toString(),
      description: bill.description || '',
      issueDate: issueDateStr,
      categoryId: bill.categoryId,
    })
    setShowModal(true)
  }, [])

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setPreviewImage(reader.result as string)
        setShowScanModal(true)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const scanBill = useCallback(async () => {
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
  }, [previewImage, categories])

  const resetScan = useCallback(() => {
    setPreviewImage(null)
    setShowScanModal(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }, [])

  const openDetailModal = useCallback((bill: Bill) => {
    setDetailBill(bill)
    setShowDetailModal(true)
  }, [])

  const statusColors = useMemo(() => ({
    PENDING: 'bg-yellow-100 text-yellow-800',
    PAID: 'bg-green-100 text-green-800',
    OVERDUE: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
  }), [])

  const getStatusLabel = useCallback((status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'Pendiente',
      PAID: 'Pagada',
      OVERDUE: 'Vencida',
      CANCELLED: 'Cancelada',
    }
    return labels[status] || status
  }, [])

  const getCategoryIconMemo = useMemo(() => getCategoryIcon, [])

  const getStatusColorsMemo = useMemo(() => statusColors, [statusColors])

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
                          name={getCategoryIconMemo(bill.category.icon)} 
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
                          <span className="text-xs text-gray-500">{bill.category.name}</span>
                          <span className="text-xs text-gray-400">
                            {bill.issueDate ? format(new Date(bill.issueDate), 'd MMM yyyy', { locale: es }) : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <p className="font-semibold text-sm">{bill.amount.toFixed(2)}€</p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-0.5 mt-2 pt-2 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
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
            <Input
              id="description"
              label="Descripción"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ej: Factura de luz febrero"
            />
            <Input
              id="issueDate"
              label="Fecha de emisión"
              type="date"
              value={formData.issueDate}
              onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
            />
            <Select
              id="category"
              label="Categoría"
              value={formData.categoryId}
              onChange={(e) => { setFormData({ ...formData, categoryId: e.target.value }); setFormError(null) }}
              options={[{ value: '', label: 'Seleccionar' }, ...categories.map(c => ({ value: c.id, label: c.name }))]}
              required
            />
            {formError && (
              <p className="text-sm text-red-600 mt-1">{formError}</p>
            )}
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
                      name={getCategoryIconMemo(detailBill.category.icon)} 
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
                    <p className="text-xs text-gray-500">Fecha de emisión</p>
                    <p className="font-medium">
                      {detailBill.issueDate ? format(new Date(detailBill.issueDate), 'd MMMM yyyy', { locale: es }) : '-'}
                    </p>
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

        <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeletingBillId(null) }} title="Eliminar factura">
          <div className="text-center py-4">
            <Icon name="alert" size={48} className="mx-auto text-red-500 mb-4" />
            <p className="text-gray-600 mb-6">¿Estás seguro de que quieres eliminar esta factura?</p>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => { setShowDeleteModal(false); setDeletingBillId(null) }}>
                Cancelar
              </Button>
              <Button variant="danger" className="flex-1" onClick={confirmDelete}>
                Eliminar
              </Button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  )
}