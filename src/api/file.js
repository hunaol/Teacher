import client, { UPLOAD_TIMEOUT } from './client'
/**
 * 上传文件
 * @param {File} file - 要上传的文件
 * @param {string} [bizType] - 业务类型（如 'lesson'、'reflection'）
 * @param {string|number} [bizId] - 业务对象 ID
 */
export function uploadFile(file, bizType, bizId) {
  // 构造 multipart/form-data
  const fd = new FormData()
  fd.append('file', file)
  if (bizType) fd.append('bizType', bizType)
  if (bizId) fd.append('bizId', bizId)
  return client.post('/files', fd, { timeout: UPLOAD_TIMEOUT, ...config })
}

/**
 * 查询某业务下关联的文件列表
 * @param {string} [bizType]
 * @param {string|number} [bizId]
 */
export function listFiles(bizType, bizId) {
  return client.get('/files', { params: { bizType, bizId } })
}
