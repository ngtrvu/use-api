import React from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

export function withQueryClientProvider<T>(
  Component: React.ComponentType<T>,
): React.FC<React.PropsWithChildren<T>> {
  return function WrappedComponent(props: React.PropsWithChildren<T>) {
    return (
      <QueryClientProvider client={queryClient}>
        <Component {...props} />
      </QueryClientProvider>
    )
  }
}
