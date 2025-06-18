import {
  useMutation as useMutationBase,
  UseMutationOptions,
} from '@tanstack/react-query'
import lodash from 'lodash'
import { ApiCall } from './types'

const { get } = lodash
interface Options
  extends UseMutationOptions<unknown, unknown, unknown, unknown> {
  resourceName?: string
  onStreaming?: (chunk: unknown) => void
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
    mutationFn: (params: Record<string, any>) =>
      apiCall.queryFn(params, onStreaming),
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
