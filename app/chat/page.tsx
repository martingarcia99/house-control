'use client'

import { useEffect, useState, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, Button, Icon } from '@/components/ui'
import { Navigation } from '@/components/Navigation'
import { format } from 'date-fns'

interface Message {
  id: string
  role: 'USER' | 'ASSISTANT'
  content: string
  createdAt: string
}

export default function ChatPage() {
  const { household, chatMessages, setChatMessages, addChatMessage } = useAppStore()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchMessages() {
      if (!household) return
      
      try {
        const res = await fetch('/api/ai/chat', { credentials: 'include' })
        const text = await res.text()
        console.log('Chat API response:', res.status, text)
        const data = JSON.parse(text)
        if (res.ok) setChatMessages(data.messages || [])
      } catch (error) {
        console.error('Error fetching messages:', error)
      }
    }
    
    fetchMessages()
  }, [household, setChatMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  async function handleSend(e: React.FormEvent) {
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
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: input, householdId: household.id }),
      })

      const data = await res.json()
      
      if (data.assistantMessage) {
        addChatMessage(data.assistantMessage)
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setLoading(false)
    }
  }

  const suggestions = [
    '¿En qué gasto más este mes?',
    '¿Cómo puedo ahorrar este mes?',
    '¿Qué facturas tengo pendientes?',
    'Dame consejos para reducir gastos',
  ]

  return (
    <div className="h-[100dvh] bg-gray-50 flex flex-col overflow-hidden">
      <header className="bg-white border-b border-gray-200 px-4 pt-4 md:pt-safe pb-3 flex-shrink-0 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <Icon name="sparkles" className="text-primary-600 flex-shrink-0" size={22} />
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">Asistente IA</h1>
            <p className="text-sm text-gray-500 truncate">Pregunta sobre tus gastos</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full flex flex-col min-h-0 overflow-hidden pt-[4.5rem] pb-12">
        <Card className="flex-1 flex flex-col min-h-0 mx-2 md:mx-4 mb-0 overflow-hidden">
          <CardContent className="flex-1 overflow-y-auto p-3 space-y-3">
            {chatMessages.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name="message" size={32} className="text-primary-600" />
                </div>
                <p className="text-gray-600 mb-4">¡Hola! Soy tu asistente financiero. ¿En qué puedo ayudarte?</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(suggestion)}
                      className="px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                      msg.role === 'USER'
                        ? 'bg-primary-600 text-white rounded-br-md'
                        : 'bg-gray-100 text-gray-900 rounded-bl-md'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.role === 'USER' ? 'text-primary-200' : 'text-gray-500'}`}>
                      {msg.createdAt ? format(new Date(msg.createdAt), 'HH:mm') : ''}
                    </p>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-2 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>
        </Card>
        
        <div className="flex-shrink-0 px-2 md:px-4 py-1 bg-gray-50">
          <form onSubmit={handleSend} className="flex gap-2 max-w-4xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta..."
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !input.trim()}>
              <Icon name="send" size={18} />
            </Button>
          </form>
        </div>
      </main>
      <Navigation />
    </div>
  )
}
