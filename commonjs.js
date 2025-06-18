// Test CommonJS compatibility
const { apiCall } = require('./dist/index.js')

describe('CommonJS Compatibility', () => {
  it('should import apiCall successfully', () => {
    expect(typeof apiCall).toBe('function')
  })

  it('should create API call with correct structure', () => {
    const testApi = apiCall('test', () => ({
      endpoint: '/api/test',
      method: 'GET',
    }))

    expect(typeof testApi.queryFn).toBe('function')
    expect(Object.keys(testApi)).toContain('queryFn')
  })

  it('should return configuration from queryFn', () => {
    const testApi = apiCall('test', () => ({
      endpoint: '/api/test',
      method: 'GET',
    }))

    const config = testApi.queryFn({})
    expect(config).toEqual({
      endpoint: '/api/test',
      method: 'GET',
    })
  })
})
