import { ApiCall } from './types'

interface ApiOptions {
  endpoint: string
  method: string
  body?: any
  streaming?: boolean
  headers?: Record<string, string>
}

const defaultHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
}

export const apiCall = (apiName: string, fn: Function): ApiCall => {
  const call = async (params: any, onStreaming?: (chunk: any) => void) => {
    const options: ApiOptions = fn(params)
    const fetchOptions: RequestInit = {
      method: options.method,
      headers: options.headers ? options.headers : defaultHeaders,
    }

    if (options.body) {
      // Don't stringify if it's FormData
      fetchOptions.body =
        options.body instanceof FormData
          ? options.body
          : JSON.stringify(options.body)
    }

    if (options.streaming) {
      const response = await fetch(options.endpoint, fetchOptions)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const error: any = new Error(`HTTP error! status: ${response.status}`)
        error.status = response.status
        error.data = errorData
        throw error
      }

      if (!response.body) {
        throw new Error('Streaming response has no body')
      }

      if (onStreaming) {
        const reader = response.body.getReader()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          onStreaming(value)
        }
        return
      }

      throw new Error('Streaming response requires onStreaming callback')
    }

    const response = await fetch(options.endpoint, fetchOptions)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const error: any = new Error(`HTTP error! status: ${response.status}`)
      error.status = response.status
      error.data = errorData
      throw error
    }
    return response.json()
  }

  return {
    apiName: apiName,
    queryFn: call,
  } as ApiCall
}
