interface ApiOptions {
  endpoint: string
  method: string
  body?: any
  streaming?: boolean
  headers?: Record<string, string>
}

export const apiCall = (apiName: string, fn: Function) => {
  const call = async (params: any, onStreaming?: (chunk: any) => void) => {
    const options: ApiOptions = fn(params)
    const fetchOptions: RequestInit = {
      method: options.method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    }

    if (options.body) {
      fetchOptions.body = JSON.stringify(options.body)
    }

    if (options.streaming) {
      const response = await fetch(options.endpoint, fetchOptions)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      if (response.body && onStreaming) {
        const reader = response.body.getReader()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          onStreaming(value)
        }
        return
      }
    }

    const response = await fetch(options.endpoint, fetchOptions)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  }

  return {
    queryKey: apiName,
    queryFn: call,
  }
}
