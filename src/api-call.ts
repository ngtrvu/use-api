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
        if (response.response && onStreaming) {
          // Handle streaming data
          const chunks = response.response.split('\n').filter(Boolean)
          chunks.forEach((chunk: any) => {
            try {
              const parsedChunk = JSON.parse(chunk)
              onStreaming(parsedChunk)
            } catch (e) {
              onStreaming(chunk)
            }
          })
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
