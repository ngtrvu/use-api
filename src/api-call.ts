import { AxiosInstance } from 'axios'
import { setupAxios } from './enhanced-axios'

export const apiCall = (
  apiName: string,
  fn: Function,
  axios?: AxiosInstance,
) => {
  const call = async (params: any) => {
    const options = fn(params)
    const axiosOptions = {
      url: options.endpoint,
      method: options.method,
      data: options.body,
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
