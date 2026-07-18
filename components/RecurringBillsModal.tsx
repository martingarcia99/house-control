'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from '@/lib/toastStore'
import { Button, Icon, Modal, Select, getCategoryIcon } from '@/components/ui'
import type { Category, RecurringBill } from '@/types'

interface RecurringBillsModalProps {
  isOpen: boolean
  onClose: () => void
  householdId: string
  categories: Category[]
}

const emptyForm = { amount: '', description: '', categoryId: '', dayOfMonth: '1', dueDay: '' }

export function RecurringBillsModal({ isOpen, onClose, householdId, categories }: RecurringBillsModalProps) {
  const [items, setItems] = useState<RecurringBill[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const fetchedRef = useRef(false)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/bills/recurring?householdId=${householdId}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setItems(data.recurringBills || [])
      }
    } catch (error) {
      console.error('Error fetching recurring bills:', error)
    } finally {
      setLoading(false)
    }
  }, [householdId])

  useEffect(() => {
    if (isOpen && !fetchedRef.current) {
      fetchedRef.current = true
      fetchItems()
    }
    if (!isOpen) {
      fetchedRef.current = false
      setShowForm(false)
      setForm(emptyForm)
    }
  }, [isOpen, fetchItems])

  const handleCreate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.categoryId) {
      toast.error('Selecciona una categoría')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/bills/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount: parseFloat(form.amount),
          description: form.description || undefined,
          categoryId: form.categoryId,
          householdId,
          dayOfMonth: parseInt(form.dayOfMonth),
          dueDay: form.dueDay ? parseInt(form.dueDay) : null,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setItems((prev) => [data.recurringBill, ...prev])
        setShowForm(false)
        setForm(emptyForm)
        toast.success('Recurrente creada')
      } else {
        const data = await res.json()
        toast.error(data.error || 'No se pudo crear la recurrente')
      }
    } catch (error) {
      console.error('Error creating recurring bill:', error)
      toast.error('No se pudo crear la recurrente')
    } finally {
      setSaving(false)
    }
  }, [form, householdId])

  const handleToggle = useCallback(async (item: RecurringBill) => {
    try {
      const res = await fetch(`/api/bills/recurring/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ active: !item.active }),
      })
      if (res.ok) {
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, active: !item.active } : i)))
      } else {
        toast.error('No se pudo actualizar')
      }
    } catch (error) {
      console.error('Error toggling recurring bill:', error)
      toast.error('No se pudo actualizar')
    }
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/bills/recurring/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== id))
        toast.success('Recurrente eliminada')
      } else {
        toast.error('No se pudo eliminar')
      }
    } catch (error) {
      console.error('Error deleting recurring bill:', error)
      toast.error('No se pudo eliminar')
    }
  }, [])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Facturas recurrentes">
      <div className="space-y-3">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Se crean automáticamente cada mes el día configurado. Ideal para luz, internet, alquiler…
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
          </div>
        ) : items.length === 0 && !showForm ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No tienes recurrentes todavía
          </p>
        ) : (
          <div className="space-y-2 max-h-[40vh] overflow-y-auto">
            {items.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 ${
                  item.active ? '' : 'opacity-50'
                }`}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${item.category.color}20` }}
                >
                  <Icon
                    name={getCategoryIcon(item.category.icon)}
                    style={{ color: item.category.color ?? '#6b7280' }}
                    size={18}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{item.description || item.category.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {item.amount.toFixed(2)}€ · día {item.dayOfMonth}
                    {item.dueDay ? ` · vence día ${item.dueDay}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => handleToggle(item)}
                  className={`text-xs px-2 py-1 rounded-lg font-medium transition-colors ${
                    item.active
                      ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                >
                  {item.active ? 'Activa' : 'Pausada'}
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Icon name="trash" size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {showForm ? (
          <form onSubmit={handleCreate} className="space-y-3 border-t border-gray-100 dark:border-gray-800 pt-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Importe</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/40 text-sm bg-white dark:bg-gray-900"
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/40 text-sm bg-white dark:bg-gray-900"
                  placeholder="Ej: Internet"
                />
              </div>
            </div>
            <Select
              id="recurring-category"
              label="Categoría"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              options={[{ value: '', label: 'Seleccionar' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
              required
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Se crea el día</label>
                <input
                  type="number"
                  min={1}
                  max={28}
                  value={form.dayOfMonth}
                  onChange={(e) => setForm({ ...form, dayOfMonth: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/40 text-sm bg-white dark:bg-gray-900"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Vence el día (opcional)</label>
                <input
                  type="number"
                  min={1}
                  max={28}
                  value={form.dueDay}
                  onChange={(e) => setForm({ ...form, dueDay: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/40 text-sm bg-white dark:bg-gray-900"
                  placeholder="—"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => { setShowForm(false); setForm(emptyForm) }}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" isLoading={saving}>
                Crear
              </Button>
            </div>
          </form>
        ) : (
          <Button variant="secondary" className="w-full justify-center" onClick={() => setShowForm(true)}>
            <Icon name="plus" size={16} className="mr-1" />
            Nueva recurrente
          </Button>
        )}
      </div>
    </Modal>
  )
}
