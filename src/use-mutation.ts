import {
  useMutation as useMutationBase,
  UseMutationOptions,
} from '@tanstack/react-query'
import { get } from 'lodash'

interface Options
  extends UseMutationOptions<unknown, unknown, unknown, unknown> {
  resourceName?: string
  onStreaming?: (chunk: unknown) => void
}

interface ApiCall {
  queryFn: (
    params: unknown,
    onStreaming?: (chunk: unknown) => void,
  ) => Promise<unknown>
}

const useMutation = (apiCall: ApiCall, options: Options = {}) => {
  const { resourceName, onStreaming, ...others } = options

  const {
    mutate,
    mutateAsync,
    isPending,
    data: rawData,
    error,
    ...props
  } = useMutationBase({
    mutationFn: (params: unknown) => apiCall.queryFn(params, onStreaming),
    ...others,
  })

  const data = resourceName ? get(rawData, resourceName) : rawData

  return {
    rawData,
    data,
    mutate,
    mutateAsync,
    isPending,
    error,
    ...props,
  }
}

export { useMutation }
