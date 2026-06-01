<script setup>
import { computed, ref, onMounted } from 'vue'
import { BookOpen, MapPin, Plus, Search, Sparkles } from 'lucide-vue-next'
import { listLocalCases, createLocalCase, seedLocalCases } from '../api/local-case'

const cases = ref([])
const keyword = ref('')
const subject = ref('')
const form = ref({ title: '', subject: '数学', grade: '', content: '', localScenario: '' })
const showForm = ref(false)

const filtered = computed(() => {
  let list = cases.value
  if (keyword.value) list = list.filter((c) => c.title.includes(keyword.value) || (c.knowledgePoint || '').includes(keyword.value))
  if (subject.value) list = list.filter((c) => c.subject === subject.value)
  return list
})

const subjects = ['数学', '语文', '科学', '综合实践', '英语']

async function load() { try { cases.value = await listLocalCases() } catch { /* */ } }
async function seed() { try { await seedLocalCases(); await load() } catch { /* */ } }
async function submit() { try { await createLocalCase(form.value); showForm.value = false; form.value = { title: '', subject: '数学', grade: '', content: '', localScenario: '' }; await load() } catch { /* */ } }

onMounted(load)
</script>

<template>
  <div style="max-width:960px;margin:0 auto;padding:32px 24px">
    <div class="page-hero">
      <div><h1>乡土教学案例库</h1><p>汇集本地乡土情境的教学案例资源</p></div>
      <div style="display:flex;gap:10px">
        <button class="profile-save-btn" style="background:#fff;color:#4f46e5;border:1px solid #e2e8f0" @click="seed"><Sparkles :size="16" /> 初始化</button>
        <button class="profile-save-btn" @click="showForm = !showForm"><Plus :size="16" /> 新增案例</button>
      </div>
    </div>

    <div style="display:flex;gap:12px;margin-bottom:24px">
      <div style="flex:1;position:relative"><Search :size="16" style="position:absolute;left:14px;top:12px;color:#94a3b8" /><input v-model="keyword" placeholder="搜索标题或知识点…" style="width:100%;padding:10px 14px 10px 38px;border:1px solid #e2e8f0;border-radius:10px;font-size:.92rem;outline:none;box-sizing:border-box" /></div>
      <select v-model="subject" style="padding:10px 14px;border:1px solid #e2e8f0;border-radius:10px;font-size:.92rem;outline:none;background:#fff;min-width:120px"><option value="">全部学科</option><option v-for="s in subjects" :key="s" :value="s">{{ s }}</option></select>
    </div>

    <div v-if="showForm" style="background:#fff;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,.06);margin-bottom:24px;display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div class="profile-form-field" style="grid-column:1/-1"><label>标题</label><input v-model="form.title" placeholder="案例标题" /></div>
      <div class="profile-form-field"><label>学科</label><input v-model="form.subject" placeholder="学科" /></div>
      <div class="profile-form-field"><label>年级</label><input v-model="form.grade" placeholder="年级" /></div>
      <div class="profile-form-field" style="grid-column:1/-1"><label>乡土场景</label><input v-model="form.localScenario" placeholder="如：村口河道季节变化观察" /></div>
      <div class="profile-form-field" style="grid-column:1/-1"><label>案例内容</label><textarea v-model="form.content" rows="4" placeholder="案例正文…"></textarea></div>
      <button class="profile-save-btn" @click="submit">保存案例</button>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px">
      <article v-for="c in filtered" :key="c.id" style="background:#fff;border-radius:12px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,.06);transition:box-shadow .2s" @mouseenter="e => e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,.1)'" @mouseleave="e => e.currentTarget.style.boxShadow='0 1px 3px rgba(0,0,0,.06)'">
        <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px">
          <div style="width:40px;height:40px;border-radius:10px;background:#eef2ff;color:#4f46e5;display:flex;align-items:center;justify-content:center;flex-shrink:0"><BookOpen :size="18" /></div>
          <div><strong style="font-size:.95rem;color:#1e293b">{{ c.title }}</strong><div style="display:flex;gap:6px;margin-top:4px;flex-wrap:wrap"><span style="font-size:.78rem;padding:2px 8px;border-radius:10px;background:#f1f5f9;color:#64748b">{{ c.subject }}</span><span v-if="c.grade" style="font-size:.78rem;padding:2px 8px;border-radius:10px;background:#f1f5f9;color:#64748b">{{ c.grade }}</span><span v-if="c.knowledgePoint" style="font-size:.78rem;padding:2px 8px;border-radius:10px;background:#fef3c7;color:#92400e">{{ c.knowledgePoint }}</span></div></div>
        </div>
        <p style="font-size:.85rem;color:#64748b;line-height:1.6;margin:0 0 12px">{{ c.content?.slice(0, 150) || '暂无内容' }}{{ c.content?.length > 150 ? '…' : '' }}</p>
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:.78rem;color:#94a3b8">
          <span v-if="c.county || c.school"><MapPin :size="12" style="vertical-align:-1px" /> {{ c.county || '' }} {{ c.school || '' }}</span>
          <span>使用 {{ c.usageCount || 0 }} 次</span>
        </div>
      </article>
    </div>
    <p v-if="!filtered.length" style="text-align:center;color:#94a3b8;padding:48px 0">暂无案例，点击"初始化"填充示例数据</p>
  </div>
</template>
