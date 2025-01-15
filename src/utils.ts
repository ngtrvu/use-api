export const generateEndpoint = ({
  host,
  params,
}: {
  host: string
  params: Record<string, string>
}) => {
  const queryString = params
    ? Object.entries(params)
        .map(([key, value]) => {
          if (Array.isArray(value)) {
            return value
              .map((v) => `${key}[]=${encodeURIComponent(v)}`)
              .join('&')
          }
          return `${key}=${encodeURIComponent(value)}`
        })
        .join('&')
    : ''

  return queryString ? `${host}?${queryString}` : host
}
