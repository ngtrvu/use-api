import {
  useMutation as useMutationBase,
  UseMutationOptions,
} from '@tanstack/react-query'
import { get } from 'lodash'

interface Options
  extends UseMutationOptions<unknown, unknown, unknown, unknown> {
  resourceName?: string
}

interface ApiCall {
  queryFn: (params: unknown) => Promise<unknown>
}

const useMutation = (apiCall: ApiCall, options: Options = {}) => {
  const { resourceName, ...others } = options

  const {
    mutate,
    mutateAsync,
    isPending,
    data: rawData,
    error,
    ...props
  } = useMutationBase({
    mutationFn: apiCall.queryFn,
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
