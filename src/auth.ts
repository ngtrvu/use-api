export async function setToken(token: string) {
  localStorage.setItem('session.token', token)
}

export async function deleteToken() {
  localStorage.removeItem('session.token')
}

export function getToken() {
  return localStorage.getItem('session.token')
}
