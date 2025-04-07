import { AxiosInstance, AxiosRequestConfig } from 'axios'
import { setupAxios } from './enhanced-axios'

interface ApiOptions {
  endpoint: string
  method: string
  body?: any
  streaming?: boolean
}

export const apiCall = (
  apiName: string,
  fn: Function,
  axios?: AxiosInstance,
) => {
  const call = async (params: any, onStreaming?: (chunk: any) => void) => {
    const options: ApiOptions = fn(params)
    const axiosOptions: AxiosRequestConfig = {
      url: options.endpoint,
      method: options.method,
      data: options.body,
    }

    if (options.streaming) {
      axiosOptions.responseType = 'stream'
      axiosOptions.onDownloadProgress = (progressEvent) => {
        const response = progressEvent.event.target as XMLHttpRequest
        if (response && onStreaming) {
          // Handle streaming data, keep the original data type
          onStreaming(response)
        }
      }
    }

    if (axios) {
      return axios(axiosOptions)
    }

    axios = setupAxios()
    return axios(axiosOptions)
  }

  return {
    queryKey: apiName,
    queryFn: call,
  }
}
