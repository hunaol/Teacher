import client from './client'

export function transcribeSpeech(file, language, bizType, bizId) {
  const fd = new FormData()
  fd.append('file', file)
  if (language) fd.append('language', language)
  if (bizType) fd.append('bizType', bizType)
  if (bizId) fd.append('bizId', bizId)
  return client.post('/speech/transcribe', fd)
}
