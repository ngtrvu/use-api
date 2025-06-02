export type Options = {
  resourceName?: string
  autoLoad?: boolean
  initialParams?: Record<string, any>
  queryKey?: string[]
}

export type ApiCall = {
  apiName: string
  queryFn: (
    params: Record<string, any>,
    onStreaming?: (chunk: any) => void,
  ) => Promise<any>
}
