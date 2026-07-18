'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import { useFetchWithCache, createCacheKey } from '@/lib/hooks/useFetchWithCache'
import { Card, CardContent, Button, Icon, IconBadge } from '@/components/ui'
import { format } from 'date-fns'

interface Message {
  id: string
  role: 'USER' | 'ASSISTANT'
  content: string
  createdAt: string
}

export default function ChatPage() {
  const { household, setChatMessages, chatMessages, addChatMessage } = useAppStore()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [hasFetchedMessages, setHasFetchedMessages] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fetchingRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const { fetchWithCache, getCachedData, cancelRequest } = useFetchWithCache()

  const fetchMessages = useCallback(async () => {
    if (!household || fetchingRef.current) return
    fetchingRef.current = true
    setLoadingMessages(true)

    const cacheKey = createCacheKey('/api/ai/chat', {})
    const cached = getCachedData<{ messages: Message[] }>(cacheKey)

    if (cached?.messages) {
      setChatMessages(cached.messages)
      setLoadingMessages(false)
      setHasFetchedMessages(true)
      fetchingRef.current = false
      return
    }

    try {
      const data = await fetchWithCache<{ messages: Message[] }>('/api/ai/chat', { staleTime: 60000 })
      setChatMessages(data?.messages || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoadingMessages(false)
      setHasFetchedMessages(true)
      fetchingRef.current = false
    }
  }, [household, setChatMessages, fetchWithCache, getCachedData])

  useEffect(() => {
    if (household && !hasFetchedMessages && !fetchingRef.current) {
      fetchMessages()
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [household, hasFetchedMessages, fetchMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleSend = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !household || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'USER',
      content: input,
      createdAt: new Date().toISOString(),
    }
    
    addChatMessage(userMessage)
    setInput('')
    setLoading(true)

    try {
      abortControllerRef.current = new AbortController()
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({ message: input, householdId: household.id }),
      })

      const data = await res.json()
      
      if (data.assistantMessage) {
        addChatMessage(data.assistantMessage)
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error sending message:', error)
      }
    } finally {
      setLoading(false)
      abortControllerRef.current = null
    }
  }, [input, household, loading, addChatMessage])

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setInput(suggestion)
  }, [])

  const suggestions = useMemo(() => [
    '¿En qué gasto más este mes?',
    '¿Cómo puedo ahorrar este mes?',
    '¿Qué facturas tengo pendientes?',
    'Dame consejos para reducir gastos',
  ], [])

  const renderMessage = useCallback((msg: Message) => (
    <div
      key={msg.id}
      className={`flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl ${
          msg.role === 'USER'
            ? 'bg-primary-600 text-white rounded-br-md shadow-sm shadow-primary-600/20'
            : 'bg-gray-100 text-gray-900 rounded-bl-md'
        }`}
      >
        <p className="text-sm">{msg.content}</p>
        <p className={`text-[10px] mt-1 ${msg.role === 'USER' ? 'text-primary-200' : 'text-gray-500'}`}>
          {format(new Date(msg.createdAt), 'HH:mm')}
        </p>
      </div>
    </div>
  ), [])

  return (
    <div className="h-[100dvh] bg-gray-50 flex flex-col overflow-hidden">
      <header className="bg-white border-b border-gray-200 px-4 pt-4 md:pt-safe pb-3 flex-shrink-0">
        <div className="max-w-4xl mx-auto flex items-center gap-2.5">
          <IconBadge name="sparkles" size="sm" />
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate leading-tight">Asistente IA</h1>
            <p className="text-sm text-gray-500 truncate">Pregunta sobre tus gastos</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full flex flex-col min-h-0 overflow-hidden pb-12">
        <Card className="flex-1 flex flex-col min-h-0 mx-2 md:mx-4 mb-0 overflow-hidden">
          <CardContent className="flex-1 overflow-y-auto p-3 space-y-3">
            {loadingMessages ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mr-2"></div>
                <span className="text-gray-500">Cargando mensajes...</span>
              </div>
            ) : chatMessages.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name="message" size={32} className="text-primary-600" />
                </div>
                <p className="text-gray-600 mb-4">¡Hola! Soy tu asistente financiero. ¿En qué puedo ayudarte?</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {chatMessages.map(renderMessage)}
                <div ref={messagesEndRef} />
              </>
            )}
          </CardContent>
        </Card>

        <form onSubmit={handleSend} className="p-2 bg-white border-t border-gray-200">
          <div className="flex gap-2 max-w-4xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta..."
              className="flex-1 px-3.5 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 text-base bg-white"
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !input.trim()}>
              <Icon name="send" size={18} />
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}