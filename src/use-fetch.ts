import { useQuery } from '@tanstack/react-query'
import lodash from 'lodash'
import { useEffect, useState } from 'react'
import { ApiCall, Options } from './types'

const { get, isEmpty } = lodash

export const useFetch = (apiCall: ApiCall, options: Options) => {
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
    queryKey: [apiCall.apiName, params],
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
    setParams,
    setDelay,
    ...props,
  }
}
