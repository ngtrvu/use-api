# @ngtrvu/use-api

A powerful React hooks library for handling API calls with streaming support, built on top of React Query and Fetch API.

## Features

- 🚀 Built on React Query and Fetch API
- 📡 Streaming support for real-time data
- 🎯 Type-safe API calls
- 🔄 Automatic retries and caching
- 🎨 Clean and simple API
- 📦 Reusable API definitions
- 🌐 Native browser APIs

## Installation

```bash
npm install @ngtrvu/use-api
# or
yarn add @ngtrvu/use-api
# or
pnpm add @ngtrvu/use-api
```

## API Organization

The recommended way to organize your API calls is to create separate modules for different features:

```typescript
// api/endpoints.ts - Central place for all API endpoints
export const ENDPOINTS = {
  POSTS: {
    LIST: '/api/posts',
    DETAIL: (id: string) => `/api/posts/${id}`,
    CREATE: '/api/posts/create',
    UPDATE: (id: string) => `/api/posts/${id}`,
    DELETE: (id: string) => `/api/posts/${id}`,
  },
  COMMENTS: {
    LIST: (postId: string) => `/api/posts/${postId}/comments`,
    CREATE: (postId: string) => `/api/posts/${postId}/comments`,
  }
} as const

// api/types.ts - Type definitions
export interface Post {
  id: string
  title: string
  content: string
  author: string
}

export interface CreatePostParams {
  title: string
  content: string
}

export interface UpdatePostParams {
  id: string
  title?: string
  content?: string
}

// api/posts.ts - Post-related API calls
import { apiCall } from '@ngtrvu/use-api'
import { ENDPOINTS } from './endpoints'
import type { Post, CreatePostParams, UpdatePostParams } from './types'

export const postsApi = {
  list: apiCall<void, Post[]>('posts.list', () => ({
    endpoint: ENDPOINTS.POSTS.LIST,
    method: 'GET'
  })),

  detail: apiCall<{ id: string }, Post>('posts.detail', (params) => ({
    endpoint: ENDPOINTS.POSTS.DETAIL(params.id),
    method: 'GET'
  })),

  create: apiCall<CreatePostParams, Post>('posts.create', (params) => ({
    endpoint: ENDPOINTS.POSTS.CREATE,
    method: 'POST',
    body: params
  })),

  update: apiCall<UpdatePostParams, Post>('posts.update', (params) => ({
    endpoint: ENDPOINTS.POSTS.UPDATE(params.id),
    method: 'PATCH',
    body: params
  })),

  delete: apiCall<{ id: string }, void>('posts.delete', (params) => ({
    endpoint: ENDPOINTS.POSTS.DELETE(params.id),
    method: 'DELETE'
  }))
}

// Usage in components
import { postsApi } from '../api/posts'

const PostList = () => {
  const listMutation = useMutation(postsApi.list)
  const deleteMutation = useMutation(postsApi.delete)

  return (
    <div>
      {/* Component implementation */}
    </div>
  )
}
```

## Streaming Examples

### 1. Chat API Organization

```typescript
// api/chat/endpoints.ts
export const CHAT_ENDPOINTS = {
  SEND: '/api/chat/send',
  STREAM: '/api/chat/stream',
  HISTORY: (userId: string) => `/api/chat/${userId}/history`
} as const

// api/chat/types.ts
export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface ChatParams {
  messages: Message[]
  model?: string
  temperature?: number
}

export interface ChatResponse {
  id: string
  message: Message
  usage: {
    promptTokens: number
    completionTokens: number
  }
}

// api/chat/index.ts
import { apiCall } from '@ngtrvu/use-api'
import { CHAT_ENDPOINTS } from './endpoints'
import type { ChatParams, ChatResponse, Message } from './types'

export const chatApi = {
  stream: apiCall<ChatParams, ChatResponse>('chat.stream', (params) => ({
    endpoint: CHAT_ENDPOINTS.STREAM,
    method: 'POST',
    body: params,
    streaming: true
  })),

  send: apiCall<ChatParams, ChatResponse>('chat.send', (params) => ({
    endpoint: CHAT_ENDPOINTS.SEND,
    method: 'POST',
    body: params
  })),

  history: apiCall<{ userId: string }, Message[]>('chat.history', (params) => ({
    endpoint: CHAT_ENDPOINTS.HISTORY(params.userId),
    method: 'GET'
  }))
}

// components/Chat.tsx
import { chatApi } from '../api/chat'
import type { Message } from '../api/chat/types'

const ChatComponent = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [currentResponse, setCurrentResponse] = useState('')

  const chatMutation = useMutation(chatApi.stream, {
    onStreaming: (chunk) => {
      setCurrentResponse(prev => prev + chunk)
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, data.message])
      setCurrentResponse('')
    }
  })

  return (
    <div>{/* Chat UI implementation */}</div>
  )
}
```

### 2. File Upload API Organization

```typescript
// api/upload/endpoints.ts
export const UPLOAD_ENDPOINTS = {
  FILE: '/api/upload/file',
  IMAGE: '/api/upload/image',
  BULK: '/api/upload/bulk'
} as const

// api/upload/types.ts
export interface UploadProgress {
  loaded: number
  total: number
  progress: number
}

export interface UploadResponse {
  url: string
  filename: string
  size: number
}

// api/upload/index.ts
import { apiCall } from '@ngtrvu/use-api'
import { UPLOAD_ENDPOINTS } from './endpoints'
import type { UploadResponse } from './types'

export const uploadApi = {
  file: apiCall<{ file: File }, UploadResponse>('upload.file', (params) => {
    const formData = new FormData()
    formData.append('file', params.file)
    
    return {
      endpoint: UPLOAD_ENDPOINTS.FILE,
      method: 'POST',
      body: formData,
      streaming: true
    }
  }),

  image: apiCall<{ image: File }, UploadResponse>('upload.image', (params) => {
    const formData = new FormData()
    formData.append('image', params.image)
    
    return {
      endpoint: UPLOAD_ENDPOINTS.IMAGE,
      method: 'POST',
      body: formData,
      streaming: true
    }
  })
}

// components/FileUpload.tsx
import { uploadApi } from '../api/upload'
import type { UploadProgress } from '../api/upload/types'

const FileUploadComponent = () => {
  const [progress, setProgress] = useState<UploadProgress>()

  const uploadMutation = useMutation(uploadApi.file, {
    onStreaming: (chunk: UploadProgress) => {
      setProgress(chunk)
    },
    onSuccess: (data) => {
      console.log('Upload complete:', data.url)
    }
  })

  return (
    <div>
      <input 
        type="file" 
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) uploadMutation.mutate({ file })
        }}
      />
      {progress && (
        <progress value={progress.progress} max="100" />
      )}
    </div>
  )
}
```

## API Call Definitions

### Basic API Call Structure

```typescript
// api/account/constants.ts
export const ACCOUNT_ACTIONS = {
  FETCH_DETAIL: 'FETCH_ACCOUNT_DETAIL',
  UPDATE: 'UPDATE_ACCOUNT',
  DELETE: 'DELETE_ACCOUNT'
} as const

// api/account/types.ts
export interface Account {
  id: string
  email: string
  name: string
  role: string
  status: 'active' | 'inactive'
}

export interface UpdateAccountPayload {
  name?: string
  email?: string
  status?: 'active' | 'inactive'
}

// api/account/index.ts
import { apiCall } from '@ngtrvu/use-api'
import { ACCOUNT_ACTIONS } from './constants'
import type { Account, UpdateAccountPayload } from './types'

export const accountApi = {
  getDetail: apiCall<void, Account>(
    ACCOUNT_ACTIONS.FETCH_DETAIL,
    () => ({
      endpoint: `/api/account`,
      method: 'GET',
    })
  ),

  update: apiCall<UpdateAccountPayload, Account>(
    ACCOUNT_ACTIONS.UPDATE,
    (payload) => ({
      endpoint: `/api/account`,
      method: 'PATCH',
      body: payload,
    })
  )
}

// Usage in components
import { accountApi } from '@/api/account'

const AccountSettings = () => {
  const detailMutation = useMutation(accountApi.getDetail)
  const updateMutation = useMutation(accountApi.update)

  const handleUpdate = (data: UpdateAccountPayload) => {
    updateMutation.mutate(data)
  }
}
```

### Custom Fetch Configuration

```typescript
// utils/fetch-config.ts
const defaultHeaders = {
  'Content-Type': 'application/json'
}

export const createFetchConfig = (token?: string) => {
  const headers = { ...defaultHeaders }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return { headers }
}

// api/base.ts
import { createFetchConfig } from '@/utils/fetch-config'
import { apiCall } from '@ngtrvu/use-api'

export const createApiCall = <P = void, R = unknown>(
  action: string,
  configFn: (params: P) => {
    endpoint: string
    method: string
    body?: any
    streaming?: boolean
  }
) => {
  return apiCall<P, R>(action, configFn)
}

// api/account/index.ts - Using createApiCall
import { createApiCall } from '../base'
import { ACCOUNT_ACTIONS } from './constants'
import type { Account, UpdateAccountPayload } from './types'

export const accountApi = {
  getDetail: createApiCall<void, Account>(
    ACCOUNT_ACTIONS.FETCH_DETAIL,
    () => ({
      endpoint: `/api/account`,
      method: 'GET',
    })
  ),

  update: createApiCall<UpdateAccountPayload, Account>(
    ACCOUNT_ACTIONS.UPDATE,
    (payload) => ({
      endpoint: `/api/account`,
      method: 'PATCH',
      body: payload,
    })
  )
}
```

### Feature-based Organization

```typescript
/api
  /base.ts              // Base API configuration and utilities
  /constants.ts         // Shared constants
  /account
    /constants.ts       // Account-specific constants
    /types.ts          // Account-related types
    /index.ts          // Account API definitions
  /auth
    /constants.ts       // Auth-specific constants
    /types.ts          // Auth-related types
    /index.ts          // Auth API definitions
  /posts
    /constants.ts       // Post-specific constants
    /types.ts          // Post-related types
    /index.ts          // Post API definitions
```

### Best Practices for API Definitions

1. **Use Action Constants**
   ```typescript
   // constants.ts
   export const ACTIONS = {
     ACCOUNT: {
       FETCH: 'FETCH_ACCOUNT',
       UPDATE: 'UPDATE_ACCOUNT',
     },
     AUTH: {
       LOGIN: 'LOGIN',
       LOGOUT: 'LOGOUT',
     }
   } as const
   ```

2. **Type Everything**
   ```typescript
   // types.ts
   export interface ApiResponse<T> {
     data: T
     message?: string
     status: number
   }

   export interface ApiError {
     code: string
     message: string
     status: number
   }

   // Usage
   const api = createApiCall<UpdateAccountPayload, ApiResponse<Account>>(
     ACTIONS.ACCOUNT.UPDATE,
     (payload) => ({
       endpoint: '/api/account',
       method: 'PATCH',
       body: payload
     })
   )
   ```

3. **Group Related APIs**
   ```typescript
   // api/account/index.ts
   export const accountApi = {
     // Account-related APIs
     detail: createApiCall(...),
     update: createApiCall(...),
     delete: createApiCall(...),
     
     // Account settings
     settings: {
       get: createApiCall(...),
       update: createApiCall(...)
     },
     
     // Account preferences
     preferences: {
       get: createApiCall(...),
       update: createApiCall(...)
     }
   }
   ```

4. **Use Environment Configuration**
   ```typescript
   // config.ts
   export const API_CONFIG = {
     BASE_URL: process.env.NEXT_PUBLIC_API_URL,
     TIMEOUT: 30000,
     VERSION: 'v1',
     getEndpoint: (path: string) => `${API_CONFIG.BASE_URL}/${API_CONFIG.VERSION}${path}`
   }

   // Usage
   const api = createApiCall(
     'ACTION',
     () => ({
       endpoint: API_CONFIG.getEndpoint('/account'),
       method: 'GET'
     })
   )
   ```

## API Reference

### useMutation Options

```typescript
interface Options {
  resourceName?: string;      // Path to extract from response
  onStreaming?: (chunk: unknown) => void;  // Stream handler
  onSuccess?: (data: unknown) => void;     // Success callback
  onError?: (error: Error) => void;        // Error callback
}

const mutation = useMutation(apiCall, options)
```

### apiCall Options

```typescript
interface ApiOptions {
  endpoint: string;     // API endpoint
  method: string;       // HTTP method
  body?: any;          // Request body
  streaming?: boolean;  // Enable streaming
}

const myApi = apiCall('name', (params) => ({
  endpoint: '/api/endpoint',
  method: 'POST',
  body: params,
  streaming: true
}))
```

## License

MIT