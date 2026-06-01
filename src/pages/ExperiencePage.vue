<script setup>
import { ref, onMounted } from 'vue'
import { BookOpen, FileText, Share2, Download, MessageCircle } from 'lucide-vue-next'
import { getExperienceBook, shareExperience, exportExperience } from '../api/experience'

const book = ref(null)

async function load() { try { book.value = await getExperienceBook() } catch { /* */ } }
async function share(lessonId) { try { await shareExperience({ lessonId, title: '分享经验' }); await load() } catch { /* */ } }
async function exportPdf() { try { const r = await exportExperience(); window.open(r.file?.publicUrl, '_blank') } catch { /* */ } }

onMounted(load)
</script>

<template>
  <div style="max-width:960px;margin:0 auto;padding:32px 24px">
    <div class="page-hero">
      <div><h1>我的经验册</h1><p>教案与反思的沉淀与分享</p></div>
      <button class="profile-save-btn" @click="exportPdf"><Download :size="16" /> 导出 PDF</button>
    </div>

    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:24px">
      <div style="background:#fff;border-radius:14px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,.06);text-align:center">
        <div style="width:48px;height:48px;border-radius:12px;background:#eef2ff;color:#4f46e5;display:flex;align-items:center;justify-content:center;margin:0 auto 12px"><BookOpen :size="22" /></div>
        <strong style="font-size:2rem;color:#1e293b;display:block">{{ book?.lessonCount || 0 }}</strong>
        <small style="color:#94a3b8">篇教案</small>
      </div>
      <div style="background:#fff;border-radius:14px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,.06);text-align:center">
        <div style="width:48px;height:48px;border-radius:12px;background:#fef3c7;color:#d97706;display:flex;align-items:center;justify-content:center;margin:0 auto 12px"><MessageCircle :size="22" /></div>
        <strong style="font-size:2rem;color:#1e293b;display:block">{{ book?.reflectionCount || 0 }}</strong>
        <small style="color:#94a3b8">条反思</small>
      </div>
    </div>

    <div style="display:grid;gap:16px">
      <article v-for="item in (book?.items || [])" :key="item.lesson?.id" style="background:#fff;border-radius:14px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,.06);transition:box-shadow .2s" @mouseenter="e => e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,.1)'" @mouseleave="e => e.currentTarget.style.boxShadow='0 1px 3px rgba(0,0,0,.06)'">
        <div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:14px">
          <div style="width:42px;height:42px;border-radius:10px;background:#e0e7ff;color:#4338ca;display:flex;align-items:center;justify-content:center;flex-shrink:0"><FileText :size="18" /></div>
          <div style="flex:1">
            <strong style="font-size:.95rem;color:#1e293b">{{ item.lesson?.title || '未命名教案' }}</strong>
            <p style="font-size:.82rem;color:#94a3b8;margin:4px 0 0">{{ item.lesson?.summary || '' }}</p>
          </div>
          <button @click="share(item.lesson?.id)" style="display:flex;align-items:center;gap:6px;padding:7px 14px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;color:#64748b;font-size:.82rem;cursor:pointer"><Share2 :size="14" />分享</button>
        </div>
        <div v-if="item.reflections?.length" style="border-top:1px solid #f1f5f9;padding-top:14px;display:grid;gap:8px">
          <div v-for="r in item.reflections" :key="r.id" style="display:flex;gap:10px;padding:10px 14px;background:#f8fafc;border-radius:10px;font-size:.84rem;color:#475569">
            <MessageCircle :size="14" style="flex-shrink:0;margin-top:2px;color:#94a3b8" />
            <span>{{ r.text?.slice(0, 120) }}{{ r.text?.length > 120 ? '…' : '' }}</span>
          </div>
        </div>
      </article>
    </div>
    <p v-if="!book?.items?.length" style="text-align:center;color:#94a3b8;padding:48px 0">暂无教案和反思记录</p>
  </div>
</template>
