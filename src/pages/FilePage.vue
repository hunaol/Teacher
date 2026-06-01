<script setup>
import { ref, onMounted } from 'vue'
import { FileText, Upload, Download, Image, Video } from 'lucide-vue-next'
import { listFiles, uploadFile } from '../api/file'

const files = ref([])

async function load() { try { files.value = await listFiles() } catch { /* */ } }
async function upload(e) {
  const file = e.target.files?.[0]; if (!file) return
  try { await uploadFile(file); await load() } catch { /* */ }
}

function iconFor(mime) {
  if (!mime) return FileText
  if (mime.startsWith('image/')) return Image
  if (mime.startsWith('video/')) return Video
  return FileText
}

function sizeLabel(bytes) {
  if (!bytes) return '0 B'
  if (bytes > 1048576) return (bytes / 1048576).toFixed(1) + ' MB'
  return (bytes / 1024).toFixed(1) + ' KB'
}

onMounted(load)
</script>

<template>
  <div style="max-width:960px;margin:0 auto;padding:32px 24px">
    <div class="page-hero">
      <div><h1>文件管理</h1><p>上传和管理教学相关文件</p></div>
      <label style="display:inline-flex;align-items:center;gap:8px;padding:10px 22px;border-radius:10px;background:#4f46e5;color:#fff;font-size:.88rem;font-weight:600;cursor:pointer;position:relative"><Upload :size="16" />上传文件<input type="file" class="hidden-file" @change="upload" /></label>
    </div>

    <div v-if="files.length" style="display:grid;gap:10px">
      <article v-for="f in files" :key="f.id" style="display:flex;align-items:center;gap:14px;background:#fff;border-radius:12px;padding:16px 20px;box-shadow:0 1px 3px rgba(0,0,0,.06)">
        <div style="width:44px;height:44px;border-radius:10px;background:#f1f5f9;color:#64748b;display:flex;align-items:center;justify-content:center;flex-shrink:0"><component :is="iconFor(f.contentType)" :size="20" /></div>
        <div style="flex:1;min-width:0">
          <strong style="font-size:.9rem;color:#1e293b;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ f.originalName }}</strong>
          <small style="color:#94a3b8;font-size:.8rem">{{ sizeLabel(f.size) }} · {{ f.contentType || '未知类型' }}</small>
        </div>
        <a :href="f.publicUrl" target="_blank" style="display:flex;align-items:center;gap:6px;padding:8px 16px;border:1px solid #e2e8f0;border-radius:8px;color:#4f46e5;text-decoration:none;font-size:.84rem;font-weight:500;flex-shrink:0"><Download :size="14" />下载</a>
      </article>
    </div>
    <p v-else style="text-align:center;color:#94a3b8;padding:64px 0">
      <Upload :size="32" style="display:block;margin:0 auto 12px;opacity:.3" />
      暂无文件，点击上方按钮上传
    </p>
  </div>
</template>
