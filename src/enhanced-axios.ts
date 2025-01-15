import axios from 'axios'

function setupAxios(options: any = {}) {
  axios.interceptors.request.use(async (config) => {
    config.headers.set('Accept', 'application/json')
    config.headers.set('Content-Type', 'application/json')
    return config
  })

  return axios.create(options)
}

export { setupAxios }
