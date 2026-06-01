import client from './client'

export function uploadFile(file, bizType, bizId) {
  const fd = new FormData()
  fd.append('file', file)
  if (bizType) fd.append('bizType', bizType)
  if (bizId) fd.append('bizId', bizId)
  return client.post('/files', fd)
}

export function listFiles(bizType, bizId) {
  return client.get('/files', { params: { bizType, bizId } })
}
