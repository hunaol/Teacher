<script setup>
import { ref, onMounted } from 'vue'
import { BookOpen, Clock, CheckCircle, Play } from 'lucide-vue-next'
import { listCourses, enrollCourse, updateCourseProgress } from '../api/course'

const courses = ref([])
const audience = ref('')

async function load() { try { courses.value = await listCourses(audience.value || undefined) } catch { /* */ } }
async function enroll(id) { try { await enrollCourse(id); await load() } catch { /* */ } }
async function updateProgress(id, progress) { try { await updateCourseProgress(id, { progress }); await load() } catch { /* */ } }

onMounted(load)
</script>

<template>
  <div style="max-width:960px;margin:0 auto;padding:32px 24px">
    <div class="page-hero"><div><h1>培训课程中心</h1><p>按教师发展阶段匹配的配套培训课程</p></div></div>

    <div style="display:flex;gap:8px;margin-bottom:24px">
      <button v-for="a in [{v:'',l:'全部'},{v:'senior',l:'资深教师'},{v:'mid',l:'骨干教师'},{v:'novice',l:'新任教师'}]" :key="a.v" @click="audience=a.v;load()" :style="{padding:'8px 18px',borderRadius:'20px',border:'1px solid '+(audience===a.v?'#4f46e5':'#e2e8f0'),background:audience===a.v?'#eef2ff':'#fff',color:audience===a.v?'#4f46e5':'#64748b',fontSize:'.85rem',cursor:'pointer',fontWeight:audience===a.v?600:400}">{{ a.l }}</button>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px">
      <article v-for="c in courses" :key="c.id" style="background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.06);transition:box-shadow .2s" @mouseenter="e => e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,.1)'" @mouseleave="e => e.currentTarget.style.boxShadow='0 1px 3px rgba(0,0,0,.06)'">
        <div style="height:6px" :style="{background:c.enrollmentStatus?'#4f46e5':'#e2e8f0'}"></div>
        <div style="padding:24px">
          <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:14px">
            <div style="width:42px;height:42px;border-radius:10px;background:#eef2ff;color:#4f46e5;display:flex;align-items:center;justify-content:center;flex-shrink:0"><BookOpen :size="18" /></div>
            <div><strong style="font-size:.95rem;color:#1e293b;line-height:1.4">{{ c.title }}</strong><div style="display:flex;gap:6px;margin-top:6px"><span style="font-size:.76rem;padding:2px 8px;border-radius:8px;background:#f1f5f9;color:#64748b">{{ c.audience === 'senior' ? '资深' : c.audience === 'mid' ? '骨干' : '新任' }}</span><span v-if="c.category" style="font-size:.76rem;padding:2px 8px;border-radius:8px;background:#f1f5f9;color:#64748b">{{ c.category }}</span><span style="font-size:.76rem;padding:2px 8px;border-radius:8px;background:#fef3c7;color:#92400e"><Clock :size="11" style="vertical-align:-1px" /> {{ c.hours }}课时</span></div></div>
          </div>
          <p style="font-size:.85rem;color:#64748b;line-height:1.6;margin:0 0 16px">{{ c.summary || '暂无简介' }}</p>

          <div v-if="c.enrollmentStatus" style="background:#f8fafc;border-radius:10px;padding:14px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <span style="font-size:.8rem;color:#64748b">学习进度</span>
              <span style="font-size:.85rem;font-weight:700;color:#4f46e5">{{ c.progress || 0 }}%</span>
            </div>
            <div style="height:6px;background:#e2e8f0;border-radius:3px;overflow:hidden"><div :style="{width:(c.progress||0)+'%',height:'100%',background:'#4f46e5',borderRadius:'3px',transition:'width .3s'}"></div></div>
            <button @click="updateProgress(c.id, (c.progress||0)+20)" style="margin-top:10px;padding:6px 16px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;color:#4f46e5;font-size:.82rem;cursor:pointer">+20% 进度</button>
          </div>
          <button v-else @click="enroll(c.id)" style="width:100%;padding:10px;border:none;borderRadius:10px;background:#4f46e5;color:#fff;font-size:.88rem;fontWeight:600;cursor:pointer">立即报名</button>
        </div>
      </article>
    </div>
    <p v-if="!courses.length" style="text-align:center;color:#94a3b8;padding:48px 0">暂无课程</p>
  </div>
</template>
