<script setup>
import { ref, reactive, onMounted } from 'vue'
import { User, School, Notebook, FileText, Search, Trophy, Folder, Clock } from 'lucide-vue-next'
import { getProfile, updateProfile, getDashboard } from '../api/profile'
import { getPortfolio } from '../api/growth'

const profile = ref(null)
const dashboard = ref(null)
const portfolioStats = ref({ events: 0, feedbacks: 0 })
const saving = ref(false)

const form = reactive({
  nickname: '',
  school: '',
  county: '',
  subject: '',
  grade: '',
  title: '',
  teachingYears: null,
  bio: '',
  phone: '',
})

async function load() {
  try { profile.value = await getProfile() } catch { /* */ }
  try { dashboard.value = await getDashboard() } catch { /* */ }
  try { const p = await getPortfolio(); portfolioStats.value = { events: p.events?.length || 0, feedbacks: p.feedbacks?.length || 0 } } catch { /* */ }
  if (profile.value) {
    form.nickname = profile.value.nickname || ''
    form.school = profile.value.school || ''
    form.county = profile.value.county || ''
    form.subject = profile.value.subject || ''
    form.grade = profile.value.grade || ''
    form.title = profile.value.title || ''
    form.teachingYears = profile.value.teachingYears
    form.bio = profile.value.bio || ''
    form.phone = profile.value.phone || ''
  }
}

async function save() {
  saving.value = true
  try { await updateProfile({ ...form }); await load() } catch { /* */ }
  finally { saving.value = false }
}

onMounted(load)
</script>

<template>
  <div style="max-width:960px;margin:0 auto;padding:32px 24px">
    <div class="profile-hero-card">
      <div class="profile-avatar-fallback"><User :size="32" /></div>
      <div class="profile-hero-info">
        <h2>{{ profile?.nickname || profile?.username || '教师' }}</h2>
        <div class="profile-hero-tags">
          <span v-if="profile?.school" class="profile-tag"><School :size="14" />{{ profile.school }}</span>
          <span v-if="profile?.county" class="profile-tag">{{ profile.county }}</span>
          <span v-if="profile?.subject" class="profile-tag">{{ profile.subject }}</span>
          <span v-if="profile?.grade" class="profile-tag">{{ profile.grade }}</span>
          <span v-if="profile?.teacherType" class="profile-tag profile-tag-role">{{ profile.teacherType === 'senior' ? '资深教师' : profile.teacherType === 'mid' ? '骨干教师' : '新任教师' }}</span>
        </div>
      </div>
    </div>

    <div class="profile-stats-grid">
      <div class="profile-stat-card">
        <div class="profile-stat-icon" style="background:#eef2ff;color:#4f46e5"><Notebook :size="20" /></div>
        <div class="profile-stat-body"><strong>{{ dashboard?.counters?.lesson_saved || 0 }}</strong><small>教案</small></div>
      </div>
      <div class="profile-stat-card">
        <div class="profile-stat-icon" style="background:#fef3c7;color:#d97706"><FileText :size="20" /></div>
        <div class="profile-stat-body"><strong>{{ dashboard?.counters?.reflection_created || 0 }}</strong><small>反思</small></div>
      </div>
      <div class="profile-stat-card">
        <div class="profile-stat-icon" style="background:#fce7f3;color:#db2777"><Search :size="20" /></div>
        <div class="profile-stat-body"><strong>{{ dashboard?.counters?.diagnosis_archived || 0 }}</strong><small>诊断</small></div>
      </div>
      <div class="profile-stat-card">
        <div class="profile-stat-icon" style="background:#d1fae5;color:#059669"><Trophy :size="20" /></div>
        <div class="profile-stat-body"><strong>{{ dashboard?.counters?.research_topic || 0 }}</strong><small>课题</small></div>
      </div>
      <div class="profile-stat-card">
        <div class="profile-stat-icon" style="background:#e0e7ff;color:#4338ca"><Clock :size="20" /></div>
        <div class="profile-stat-body"><strong>{{ portfolioStats.events }}</strong><small>成长记录</small></div>
      </div>
      <div class="profile-stat-card">
        <div class="profile-stat-icon" style="background:#f3e8ff;color:#7c3aed"><Folder :size="20" /></div>
        <div class="profile-stat-body"><strong>{{ portfolioStats.feedbacks }}</strong><small>名师点评</small></div>
      </div>
    </div>

    <div class="profile-form-card">
      <h3>编辑资料</h3>
      <div class="profile-form-grid">
        <div class="profile-form-field"><label>昵称</label><input v-model="form.nickname" placeholder="请输入昵称" /></div>
        <div class="profile-form-field"><label>学校</label><input v-model="form.school" placeholder="请输入学校" /></div>
        <div class="profile-form-field"><label>县域</label><input v-model="form.county" placeholder="请输入县域" /></div>
        <div class="profile-form-field"><label>学科</label><input v-model="form.subject" placeholder="请输入学科" /></div>
        <div class="profile-form-field"><label>年级</label><input v-model="form.grade" placeholder="请输入年级" /></div>
        <div class="profile-form-field"><label>职称</label><input v-model="form.title" placeholder="请输入职称" /></div>
        <div class="profile-form-field"><label>教龄</label><input v-model.number="form.teachingYears" type="number" placeholder="教龄" /></div>
        <div class="profile-form-field"><label>手机号</label><input v-model="form.phone" placeholder="请输入手机号" /></div>
      </div>
      <div class="profile-form-field" style="grid-column:1/-1;margin-top:4px"><label>个人简介</label><textarea v-model="form.bio" rows="4" placeholder="介绍一下自己…"></textarea></div>
      <button class="profile-save-btn" :disabled="saving" @click="save">{{ saving ? '保存中…' : '保存修改' }}</button>
    </div>
  </div>
</template>

<style scoped>
.profile-hero-card {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.04);
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
}
.profile-avatar-fallback {
  width: 80px; height: 80px; border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.profile-hero-info h2 { margin: 0 0 10px; font-size: 1.5rem; color: #1e293b; }
.profile-hero-tags { display: flex; flex-wrap: wrap; gap: 8px; }
.profile-tag {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 12px; border-radius: 20px;
  background: #f1f5f9; color: #475569; font-size: .82rem;
}
.profile-tag-role { background: #eef2ff; color: #4f46e5; }

.profile-stats-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}
@media (max-width: 900px) { .profile-stats-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 500px) { .profile-stats-grid { grid-template-columns: repeat(2, 1fr); } }

.profile-stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  text-align: center;
  transition: box-shadow .2s;
}
.profile-stat-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.08); }
.profile-stat-icon {
  width: 44px; height: 44px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
}
.profile-stat-body strong { display: block; font-size: 1.5rem; color: #1e293b; }
.profile-stat-body small { color: #94a3b8; font-size: .8rem; }

.profile-form-card {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.04);
}
.profile-form-card h3 { margin: 0 0 20px; font-size: 1.1rem; color: #1e293b; }
.profile-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 600px) { .profile-form-grid { grid-template-columns: 1fr; } }

.profile-form-field label { display: block; font-size: .85rem; color: #64748b; margin-bottom: 6px; }
.profile-form-field input,
.profile-form-field textarea {
  width: 100%; padding: 10px 14px;
  border: 1px solid #e2e8f0; border-radius: 10px;
  font-size: .92rem; color: #1e293b; background: #f8fafc;
  outline: none; box-sizing: border-box;
  transition: border .2s, box-shadow .2s;
}
.profile-form-field input:focus,
.profile-form-field textarea:focus {
  border-color: #818cf8; box-shadow: 0 0 0 3px rgba(129,140,248,.15); background: #fff;
}
.profile-form-field textarea { resize: vertical; font-family: inherit; }

.profile-save-btn {
  margin-top: 20px; padding: 10px 28px;
  border: none; border-radius: 10px;
  background: #4f46e5; color: #fff;
  font-size: .92rem; font-weight: 600; cursor: pointer;
  transition: background .2s, transform .1s;
}
.profile-save-btn:hover { background: #4338ca; }
.profile-save-btn:active { transform: scale(.97); }
.profile-save-btn:disabled { opacity: .6; cursor: not-allowed; }
</style>
