'use client'

import { useRef, useCallback, useEffect } from 'react'

interface CacheEntry<T> {
  data: T
  timestamp: number
  etag?: string
  hash?: string
}

interface FetchOptions {
  staleTime?: number
  cacheKey?: string
  deduplicate?: boolean
}

const globalCache = new Map<string, CacheEntry<unknown>>()
const pendingRequests = new Map<string, Promise<unknown>>()
const requestControllers = new Map<string, AbortController>()

function hashData(data: unknown): string {
  return JSON.stringify(data)
}

function isDataEqual(a: unknown, b: unknown): boolean {
  return hashData(a) === hashData(b)
}

export function useFetchWithCache() {
  const abortControllers = useRef(requestControllers)

  const fetchWithCache = useCallback(async <T>(
    url: string,
    options: FetchOptions = {}
  ): Promise<T> => {
    const { 
      staleTime = 15 * 60 * 1000,
      cacheKey = url,
      deduplicate = true
    } = options
    
    const now = Date.now()
    const cached = globalCache.get(cacheKey) as CacheEntry<T> | undefined
    
    if (cached && now - cached.timestamp < staleTime) {
      return cached.data
    }

    if (deduplicate && pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey) as Promise<T>
    }

    const controller = new AbortController()
    abortControllers.current.set(cacheKey, controller)

    const headers: Record<string, string> = {}
    if (cached?.etag) headers['If-None-Match'] = cached.etag

    const fetchPromise = fetch(url, {
      headers: { ...headers, 'Content-Type': 'application/json' },
      credentials: 'include',
      signal: controller.signal,
    }).then(async (res) => {
      if (res.status === 304 && cached) {
        globalCache.set(cacheKey, { ...cached, timestamp: now })
        pendingRequests.delete(cacheKey)
        abortControllers.current.delete(cacheKey)
        return cached.data
      }

      if (!res.ok) {
        const httpError = new Error(`HTTP ${res.status}`) as Error & { status: number }
        httpError.status = res.status
        throw httpError
      }
      
      const data = await res.json()
      const etag = res.headers.get('ETag') || undefined
      
      if (cached && isDataEqual(cached.data, data)) {
        globalCache.set(cacheKey, { ...cached, timestamp: now, etag })
        pendingRequests.delete(cacheKey)
        abortControllers.current.delete(cacheKey)
        return cached.data
      }
      
      globalCache.set(cacheKey, { data, timestamp: now, etag })
      pendingRequests.delete(cacheKey)
      abortControllers.current.delete(cacheKey)
      
      return data as T
    }).catch((error: unknown) => {
      pendingRequests.delete(cacheKey)
      abortControllers.current.delete(cacheKey)
      if (error instanceof Error && error.name === 'AbortError') {
        return Promise.reject(error)
      }
      throw error
    })

    pendingRequests.set(cacheKey, fetchPromise as Promise<unknown>)
    
    return fetchPromise
  }, [])

  const cancelRequest = useCallback((cacheKey: string) => {
    const controller = abortControllers.current.get(cacheKey)
    if (controller) {
      controller.abort()
      abortControllers.current.delete(cacheKey)
      pendingRequests.delete(cacheKey)
    }
  }, [])

  const invalidateCache = useCallback((cacheKey?: string) => {
    if (cacheKey) {
      globalCache.delete(cacheKey)
    } else {
      globalCache.clear()
    }
  }, [])

  const getCachedData = useCallback(<T>(cacheKey: string): T | null => {
    const entry = globalCache.get(cacheKey) as CacheEntry<T> | undefined
    return entry?.data ?? null
  }, [])

  const prefetch = useCallback(async <T>(url: string, options: FetchOptions = {}) => {
    return fetchWithCache<T>(url, { ...options, deduplicate: true })
  }, [fetchWithCache])

  return { 
    fetchWithCache, 
    cancelRequest, 
    invalidateCache, 
    getCachedData,
    prefetch
  }
}

export function createCacheKey(endpoint: string, params?: Record<string, string>): string {
  if (!params) return endpoint
  const searchParams = new URLSearchParams(params)
  return `${endpoint}?${searchParams.toString()}`
}