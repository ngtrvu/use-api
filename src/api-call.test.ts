import { TextDecoder, TextEncoder } from 'util'
import { apiCall } from './api-call'

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('apiCall', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  describe('JSON API calls', () => {
    it('should make a GET request with JSON response', async () => {
      const mockResponse = { data: 'test' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const testApi = apiCall('test', () => ({
        endpoint: '/api/test',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }))

      const result = await testApi.queryFn({})
      expect(result).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    })

    it('should make a POST request with JSON body', async () => {
      const mockResponse = { success: true }
      const requestBody = { name: 'test' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const testApi = apiCall('test', () => ({
        endpoint: '/api/test',
        method: 'POST',
        body: requestBody,
        headers: {
          'Content-Type': 'application/json',
        },
      }))

      const result = await testApi.queryFn({})
      expect(result).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })
    })
  })

  describe('Streaming API calls', () => {
    it('should handle streaming responses', async () => {
      const chunks = ['Hello', 'World', '!']
      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: async () => {
              const chunk = chunks.shift()
              if (!chunk) return { done: true, value: undefined }
              return {
                done: false,
                value: new TextEncoder().encode(chunk),
              }
            },
          }),
        },
      }
      mockFetch.mockResolvedValueOnce(mockResponse)

      const receivedChunks: string[] = []
      const testApi = apiCall('test', () => ({
        endpoint: '/api/stream',
        method: 'GET',
        streaming: true,
      }))

      await testApi.queryFn({}, (chunk) => {
        receivedChunks.push(new TextDecoder().decode(chunk))
      })

      expect(receivedChunks).toEqual(['Hello', 'World', '!'])
    })
  })

  describe('FormData API calls', () => {
    it('should handle FormData requests', async () => {
      const mockResponse = { success: true }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const formData = new FormData()
      formData.append('file', new Blob(['test']), 'test.txt')

      const testApi = apiCall('test', () => ({
        endpoint: '/api/upload',
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      }))

      const result = await testApi.queryFn({})
      expect(result).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      })
    })
  })

  describe('Error handling', () => {
    it('should throw error for non-OK responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      const testApi = apiCall('test', () => ({
        endpoint: '/api/not-found',
        method: 'GET',
      }))

      await expect(testApi.queryFn({})).rejects.toThrow(
        'HTTP error! status: 404',
      )
    })

    it('should throw error for streaming responses when no onStreaming callback is provided', async () => {
      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: async () => ({ done: true, value: undefined }),
          }),
        },
      }
      mockFetch.mockResolvedValueOnce(mockResponse)

      const testApi = apiCall('test', () => ({
        endpoint: '/api/stream',
        method: 'GET',
        streaming: true,
      }))

      await expect(testApi.queryFn({})).rejects.toThrow(
        'Streaming response requires onStreaming callback',
      )
    })

    it('should throw error when streaming response has no body', async () => {
      const mockResponse = {
        ok: true,
        body: undefined,
      }
      mockFetch.mockResolvedValueOnce(mockResponse)

      const testApi = apiCall('test', () => ({
        endpoint: '/api/stream',
        method: 'GET',
        streaming: true,
      }))

      await expect(testApi.queryFn({}, () => {})).rejects.toThrow(
        'Streaming response has no body',
      )
    })
  })
})
