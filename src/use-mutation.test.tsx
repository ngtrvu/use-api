import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useMutation } from './use-mutation'

const streamingChunks = [
  'f:{"messageId":"msg-YJrhY5pO3exHoJi2CSFCsW3T"}',
  '0:"Hello"',
  '0:"!"',
  '0:"How"',
  '0:"can"',
  '0:"I"',
  '0:"assist"',
  '0:"you"',
  '0:"today"',
  '0:"?"',
]

describe('useMutation', () => {
  let queryClient: QueryClient

  // Setup wrapper with QueryClientProvider
  const wrapper = ({ children }: { children: React.ReactNode }) => {
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: {
          retry: false,
        },
      },
    })
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }

  beforeEach(() => {
    // Clear query cache between tests
    queryClient?.clear()
  })

  it('should handle successful mutation', async () => {
    const mockData = { id: 1, name: 'Test' }
    const mockApiCall = {
      apiName: 'test',
      queryFn: jest.fn().mockResolvedValue(mockData),
    }

    const { result } = renderHook(() => useMutation(mockApiCall, {}), {
      wrapper,
    })

    expect(result.current.isPending).toBe(false)
    expect(result.current.data).toBeUndefined()

    act(() => {
      result.current.mutate({ name: 'Test' })
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(mockApiCall.queryFn).toHaveBeenCalledWith(
      { name: 'Test' },
      undefined,
    )
    expect(result.current.data).toEqual(mockData)
    expect(result.current.error).toBeNull()
  })

  it('should handle mutation with resourceName', async () => {
    const mockResponse = { data: { user: { id: 1, name: 'Test' } } }
    const mockApiCall = {
      apiName: 'test',
      queryFn: jest.fn().mockResolvedValue(mockResponse),
    }

    const { result } = renderHook(
      () => useMutation(mockApiCall, { resourceName: 'data.user' }),
      { wrapper },
    )

    act(() => {
      result.current.mutate({ name: 'Test' })
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.data).toEqual({ id: 1, name: 'Test' })
    expect(result.current.rawData).toEqual(mockResponse)
  })

  it('should handle mutation error', async () => {
    const mockError = new Error('API Error')
    const mockApiCall = {
      apiName: 'test',
      queryFn: jest.fn().mockRejectedValue(mockError),
    }

    const { result } = renderHook(() => useMutation(mockApiCall, {}), {
      wrapper,
    })

    act(() => {
      result.current.mutate({ name: 'Test' })
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.data).toBeUndefined()
  })

  it('should handle streaming data', async () => {
    const mockOnStreaming = jest.fn()
    const finalResponse = { status: 'completed' }

    const mockApiCall = {
      apiName: 'test',
      queryFn: jest.fn().mockImplementation(async (params, onStreaming) => {
        // Simulate streaming chunks
        streamingChunks.forEach((chunk) => {
          onStreaming?.(chunk)
        })
        return finalResponse
      }),
    }

    const { result } = renderHook(
      () => useMutation(mockApiCall, { onStreaming: mockOnStreaming }),
      { wrapper },
    )

    act(() => {
      result.current.mutate({ test: true })
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    // Verify streaming chunks were received
    expect(mockOnStreaming).toHaveBeenCalledTimes(streamingChunks.length)
    streamingChunks.forEach((chunk, index) => {
      expect(mockOnStreaming).toHaveBeenNthCalledWith(index + 1, chunk)
    })

    // Verify final response
    expect(result.current.data).toEqual(finalResponse)
  })

  it('should handle streaming with JSON chunks', async () => {
    const mockOnStreaming = jest.fn()
    const finalResponse = { status: 'completed' }

    const mockApiCall = {
      apiName: 'test',
      queryFn: jest.fn().mockImplementation(async (params, onStreaming) => {
        streamingChunks.forEach((chunk) => {
          onStreaming?.(chunk)
        })
        return finalResponse
      }),
    }

    const { result } = renderHook(
      () => useMutation(mockApiCall, { onStreaming: mockOnStreaming }),
      { wrapper },
    )

    act(() => {
      result.current.mutate({ test: true })
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    // Verify JSON chunks were received
    expect(mockOnStreaming).toHaveBeenCalledTimes(streamingChunks.length)
    streamingChunks.forEach((chunk, index) => {
      expect(mockOnStreaming).toHaveBeenNthCalledWith(index + 1, chunk)
    })

    expect(result.current.data).toEqual(finalResponse)
  })

  it('should handle async mutation with mutateAsync', async () => {
    const mockData = { id: 1, name: 'Test' }
    const mockApiCall = {
      apiName: 'test',
      queryFn: jest.fn().mockResolvedValue(mockData),
    }

    const { result } = renderHook(() => useMutation(mockApiCall, {}), {
      wrapper,
    })

    let response
    await act(async () => {
      response = await result.current.mutateAsync({ name: 'Test' })
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(response).toEqual(mockData)
    expect(result.current.data).toEqual(mockData)
  })

  describe('Streaming functionality', () => {
    it('should handle streaming with delay between chunks', async () => {
      const mockOnStreaming = jest.fn()
      const finalResponse = { status: 'completed' }

      const mockApiCall = {
        apiName: 'test',
        queryFn: jest.fn().mockImplementation(async (params, onStreaming) => {
          // Simulate streaming with delays
          for (const chunk of streamingChunks) {
            await new Promise((resolve) => setTimeout(resolve, 10))
            onStreaming?.(chunk)
          }
          return finalResponse
        }),
      }

      const { result } = renderHook(
        () => useMutation(mockApiCall, { onStreaming: mockOnStreaming }),
        { wrapper },
      )

      act(() => {
        result.current.mutate({ test: true })
      })

      await waitFor(() => {
        expect(mockOnStreaming).toHaveBeenCalledTimes(streamingChunks.length)
      })

      expect(result.current.data).toEqual(finalResponse)
      expect(mockOnStreaming.mock.calls).toEqual(
        streamingChunks.map((chunk) => [chunk]),
      )
    })

    it('should handle streaming errors during chunk processing', async () => {
      const errorMessage = 'Streaming error'
      const mockOnStreaming = jest.fn()

      const mockApiCall = {
        apiName: 'test',
        queryFn: jest.fn().mockImplementation(async (params, onStreaming) => {
          onStreaming?.('Chunk 1')
          onStreaming?.('Chunk 2')
          throw new Error(errorMessage)
        }),
      }

      const { result } = renderHook(
        () => useMutation(mockApiCall, { onStreaming: mockOnStreaming }),
        { wrapper },
      )

      act(() => {
        result.current.mutate({ test: true })
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      expect(mockOnStreaming).toHaveBeenCalledTimes(2)
      expect(result.current.error).toBeTruthy()
      expect(result.current.data).toBeUndefined()
    })

    it('should handle streaming with different data types', async () => {
      const streamingChunksWithDifferentDataTypes = [
        { type: 'text', content: 'Hello' },
        123,
        true,
        ['array', 'data'],
        { type: 'completion', content: 'World' },
      ]
      const mockOnStreaming = jest.fn()
      const finalResponse = { status: 'completed' }

      const mockApiCall = {
        apiName: 'test',
        queryFn: jest.fn().mockImplementation(async (params, onStreaming) => {
          streamingChunksWithDifferentDataTypes.forEach((chunk) => {
            onStreaming?.(chunk)
          })
          return finalResponse
        }),
      }

      const { result } = renderHook(
        () => useMutation(mockApiCall, { onStreaming: mockOnStreaming }),
        { wrapper },
      )

      act(() => {
        result.current.mutate({ test: true })
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      expect(mockOnStreaming).toHaveBeenCalledTimes(
        streamingChunksWithDifferentDataTypes.length,
      )
      streamingChunksWithDifferentDataTypes.forEach((chunk, index) => {
        expect(mockOnStreaming).toHaveBeenNthCalledWith(index + 1, chunk)
      })
    })

    it('should handle streaming with concurrent mutations', async () => {
      const mockOnStreaming1 = jest.fn()
      const mockOnStreaming2 = jest.fn()

      const createMockApiCall = (chunks: string[]) => ({
        apiName: 'test',
        queryFn: jest.fn().mockImplementation(async (params, onStreaming) => {
          chunks.forEach((chunk) => {
            onStreaming?.(chunk)
          })
          return { status: 'completed', chunks }
        }),
      })

      const mockApiCall1 = createMockApiCall(['A1', 'A2', 'A3'])
      const mockApiCall2 = createMockApiCall(['B1', 'B2', 'B3'])

      const { result: result1 } = renderHook(
        () => useMutation(mockApiCall1, { onStreaming: mockOnStreaming1 }),
        { wrapper },
      )

      const { result: result2 } = renderHook(
        () => useMutation(mockApiCall2, { onStreaming: mockOnStreaming2 }),
        { wrapper },
      )

      // Start both mutations concurrently
      act(() => {
        result1.current.mutate({ id: 1 })
        result2.current.mutate({ id: 2 })
      })

      await waitFor(() => {
        expect(result1.current.isPending).toBe(false)
        expect(result2.current.isPending).toBe(false)
      })

      // Verify streams didn't interfere with each other
      expect(mockOnStreaming1).toHaveBeenCalledTimes(3)
      expect(mockOnStreaming2).toHaveBeenCalledTimes(3)
      expect(mockOnStreaming1.mock.calls).toEqual([['A1'], ['A2'], ['A3']])
      expect(mockOnStreaming2.mock.calls).toEqual([['B1'], ['B2'], ['B3']])
    })

    it('should handle streaming with rate limiting', async () => {
      const chunks = Array.from({ length: 10 }, (_, i) => `Chunk ${i + 1}`)
      const mockOnStreaming = jest.fn()
      let lastChunkTime = 0
      const minDelay = 50 // ms between chunks

      const mockApiCall = {
        apiName: 'test',
        queryFn: jest.fn().mockImplementation(async (params, onStreaming) => {
          for (const chunk of chunks) {
            const now = Date.now()
            if (lastChunkTime && now - lastChunkTime < minDelay) {
              await new Promise((resolve) =>
                setTimeout(resolve, minDelay - (now - lastChunkTime)),
              )
            }
            onStreaming?.(chunk)
            lastChunkTime = Date.now()
          }
          return { status: 'completed' }
        }),
      }

      const { result } = renderHook(
        () => useMutation(mockApiCall, { onStreaming: mockOnStreaming }),
        { wrapper },
      )

      act(() => {
        result.current.mutate({ test: true })
      })

      await waitFor(() => {
        expect(mockOnStreaming).toHaveBeenCalledTimes(chunks.length)
      })

      // Verify all chunks were received in order
      expect(mockOnStreaming.mock.calls.map((call) => call[0])).toEqual(chunks)
    })
  })
})
