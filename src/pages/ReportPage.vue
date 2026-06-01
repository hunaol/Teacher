<script setup>
import { ref } from 'vue'
import { FileText, Download, Loader, CheckCircle } from 'lucide-vue-next'
import { generateExperienceBook, generateAssessmentPackage, generateGrowthReport } from '../api/report'

const result = ref(null)
const generating = ref('')

async function gen(type) {
  generating.value = type
  result.value = null
  try {
    const fn = type === 'experience' ? generateExperienceBook : type === 'assessment' ? generateAssessmentPackage : generateGrowthReport
    result.value = await fn()
  } catch { /* */ }
  finally { generating.value = '' }
}

const reports = [
  { type: 'experience', title: '教学经验册', desc: '汇总教案、反思和经验记录，生成结构化 PDF', audience: '资深教师 / 骨干教师', color: '#4f46e5', bg: '#eef2ff' },
  { type: 'assessment', title: '考核材料包', desc: '整理课堂诊断、课题研究和成长记录，生成 Word 文档', audience: '骨干教师', color: '#d97706', bg: '#fef3c7' },
  { type: 'growth', title: '成长报告', desc: '基于成长档案袋数据，生成新任教师发展报告 PDF', audience: '新任教师', color: '#059669', bg: '#d1fae5' },
]
</script>

<template>
  <div style="max-width:960px;margin:0 auto;padding:32px 24px">
    <div class="page-hero"><div><h1>报告中心</h1><p>一键生成教学档案与考核材料</p></div></div>

    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;margin-bottom:24px">
      <div v-for="r in reports" :key="r.type" style="background:#fff;border-radius:14px;padding:28px;box-shadow:0 1px 3px rgba(0,0,0,.06);transition:box-shadow .2s" @mouseenter="e => e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,.1)'" @mouseleave="e => e.currentTarget.style.boxShadow='0 1px 3px rgba(0,0,0,.06)'">
        <div :style="{width:'48px',height:'48px',borderRadius:'12px',background:r.bg,color:r.color,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'16px'}"><FileText :size="22" /></div>
        <strong style="font-size:1.05rem;color:#1e293b;display:block;margin-bottom:6px">{{ r.title }}</strong>
        <p style="font-size:.84rem;color:#64748b;line-height:1.6;margin:0 0 8px">{{ r.desc }}</p>
        <small style="font-size:.78rem;color:#94a3b8;display:block;margin-bottom:16px">适用：{{ r.audience }}</small>
        <button @click="gen(r.type)" :disabled="!!generating" :style="{width:'100%',padding:'10px',border:'none',borderRadius:'10px',background:r.color,color:'#fff',fontSize:'.88rem',fontWeight:600,cursor:generating?'not-allowed':'pointer',opacity:generating?'.7':'1'}">
          <Loader v-if="generating === r.type" :size="16" style="animation:spin 1s linear infinite" /> {{ generating === r.type ? '生成中…' : '生成报告' }}
        </button>
      </div>
    </div>

    <div v-if="result" style="background:#fff;border-radius:14px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,.06);display:flex;align-items:center;gap:16px">
      <div style="width:44px;height:44px;border-radius:12px;background:#d1fae5;color:#059669;display:flex;align-items:center;justify-content:center"><CheckCircle :size="22" /></div>
      <div style="flex:1"><strong style="color:#1e293b;font-size:.92rem">报告已生成</strong><p style="color:#64748b;font-size:.84rem;margin:2px 0 0">类型：{{ result.reportType }}</p></div>
      <a v-if="result.file?.publicUrl" :href="result.file.publicUrl" target="_blank" style="display:flex;align-items:center;gap:8px;padding:10px 20px;border-radius:10px;background:#4f46e5;color:#fff;text-decoration:none;font-size:.88rem;font-weight:600"><Download :size="16" />下载</a>
    </div>
  </div>
</template>

<style scoped>
@keyframes spin { to { transform: rotate(360deg); } }
</style>
