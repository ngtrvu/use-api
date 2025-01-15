import { useQuery } from '@tanstack/react-query'
import { get, isEmpty } from 'lodash'
import { useEffect, useState } from 'react'

type Options = {
  resourceName?: string
  autoLoad?: boolean
  initialParams?: Record<string, any>
}

export const useFetch = (apiCall: any, options: Options) => {
  const {
    resourceName,
    autoLoad = true,
    initialParams = {},
    ...others
  } = options

  const [delay, setDelay] = useState(true)
  const [params, setParams] = useState(initialParams)

  const {
    data: rawData,
    error,
    isLoading,
    refetch,
    isRefetching,
    ...props
  } = useQuery({
    queryKey: [apiCall.queryKey, params],
    queryFn: () => apiCall.queryFn(params),
    enabled: autoLoad, // autoload by default
    ...others,
  })

  const data = resourceName ? get(rawData, resourceName) : rawData
  const fetch = (newParams: any) => {
    setParams(newParams)
    setDelay(false)
  }

  useEffect(() => {
    if (!delay && !isEmpty(params)) {
      refetch()
    }
  }, [delay])

  return {
    fetch,
    data,
    rawData,
    isLoading,
    refresh: refetch,
    refreshing: isRefetching,
    error,
    ...props,
  }
}
