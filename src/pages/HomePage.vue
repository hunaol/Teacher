<script setup>
import { RouterLink } from 'vue-router'
import { ArrowRight, Bot, GraduationCap, Mic, School, Sparkles, Users, FileText, TrendingUp } from 'lucide-vue-next'
import { roleCards } from '../mock/platformData'
import { ref, onMounted } from 'vue'

const heroVisible = ref(false)
onMounted(() => { setTimeout(() => heroVisible.value = true, 100) })

const roleMeta = {
  senior: { title: '资深教师端', icon: Mic, scene: '沉淀经验，持续迭代教案与反思', features: ['AI语音备课', '教案版本管理', '教学反思追踪'], stat: '累计生成 12,800+ 份教案', color: '#D98C52' },
  mid: { title: '骨干教师端', icon: Bot, scene: '课堂诊断、互动优化、课题研究一体推进', features: ['错题智能诊断', 'AI数字人助教', '课题研究导航'], stat: '累计诊断 5,600+ 份错题', color: '#3B82F6' },
  novice: { title: '新任教师端', icon: GraduationCap, scene: '先学经验，再提问，最后形成成长档案', features: ['名师经验库', '在线答疑社区', '成长档案追踪'], stat: '累计收录 3,200+ 条经验', color: '#10B981' },
}
</script>

<template>
  <div class="ysd-ref-home">
    <header class="ysd-ref-nav">
      <RouterLink to="/" class="ysd-ref-brand">
        <span class="ysd-ref-brand-icon"><School :size="20" /></span>
        <strong>云师道</strong>
      </RouterLink>
    </header>

    <section class="ysd-ref-hero" :class="{ 'hero-visible': heroVisible }">
      <div class="ysd-ref-hero-copy">
        <p class="ysd-ref-kicker"><Sparkles :size="14" /> 乡村数学教师课堂教学多智能体赋能平台</p>
        <h1>云师道<span>·</span>MathAgent<br><span>数智化助力</span>乡村数学教育</h1>
        <p class="ysd-ref-hero-desc">基于 AI 大模型的教学辅助平台，为乡村数学教师提供从备课、诊断到成长的完整工作流。</p>
        <div class="ysd-ref-actions">
          <a href="#choose" class="ysd-ref-btn ysd-ref-btn-primary">选择教师端口 <ArrowRight :size="18" /></a>
        </div>
      </div>

      <div class="ysd-ref-hero-visual">
        <div class="hero-visual-bg">
          <div class="hero-float-card card-1"><FileText :size="20" /><span>AI 智能备课</span></div>
          <div class="hero-float-card card-2"><TrendingUp :size="20" /><span>学情分析完成</span></div>
          <div class="hero-float-card card-3"><Users :size="20" /><span>3,200+ 教师在线</span></div>
          <div class="hero-float-card card-4"><Sparkles :size="20" /><span>错题智能诊断</span></div>
          <div class="hero-float-card card-5"><FileText :size="20" /><span>课题研究导航</span></div>
          <div class="hero-visual-core"><School :size="56" /></div>
        </div>
      </div>
    </section>

    <section id="choose" class="ysd-ref-choose">
      <div class="ysd-ref-choose-head">
        <h2>选择您的教师端口</h2>
        <p>系统根据您的教学阶段提供最匹配的功能</p>
      </div>
      <div class="ysd-ref-role-grid anim-stagger-children">
        <RouterLink v-for="item in roleCards" :key="item.key" :to="item.entry" class="ysd-ref-role-card" :style="{ '--role-color': roleMeta[item.key].color }">
          <div class="ysd-ref-role-bar"></div>
          <div class="ysd-ref-role-body">
            <div class="ysd-ref-role-top">
              <span class="ysd-ref-role-icon"><component :is="roleMeta[item.key].icon" :size="20" /></span>
              <strong>{{ roleMeta[item.key].title }}</strong>
            </div>
            <p>{{ roleMeta[item.key].scene }}</p>
            <div class="ysd-ref-role-features">
              <span v-for="feat in roleMeta[item.key].features" :key="feat" class="ysd-ref-role-feat">{{ feat }}</span>
            </div>
            <small class="ysd-ref-role-stat"><Users :size="13" /> {{ roleMeta[item.key].stat }}</small>
            <span class="ysd-ref-enter">进入该端口 <ArrowRight :size="16" /></span>
          </div>
        </RouterLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.ysd-ref-hero-visual { position: relative; display: flex; align-items: center; justify-content: center; min-height: 360px; }
.hero-visual-bg { position: relative; width: 400px; height: 360px; }
.hero-visual-core { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 90px; height: 90px; border-radius: var(--radius-xl); background: linear-gradient(135deg, var(--primary), var(--primary-strong)); display: flex; align-items: center; justify-content: center; color: #fff; box-shadow: 0 8px 40px rgba(217,140,82,.35); animation: coreFloat 3s ease-in-out infinite; z-index: 2; }
@keyframes coreFloat { 0%, 100% { transform: translate(-50%, -50%) translateY(0); } 50% { transform: translate(-50%, -50%) translateY(-8px); } }
.hero-float-card { position: absolute; background: var(--surface); border-radius: var(--radius-lg); padding: 10px 16px; display: flex; align-items: center; gap: 8px; box-shadow: var(--shadow); border: 1px solid var(--border-light); font-size: .82rem; color: var(--text); font-weight: 500; opacity: 0; animation: floatCardIn .6s ease-out forwards; white-space: nowrap; z-index: 1; }
.hero-float-card.card-1 { top: 10px; left: 50%; transform: translateX(-50%); animation-delay: .1s; color: var(--primary-strong); }
.hero-float-card.card-2 { top: 90px; right: 10px; animation-delay: .25s; color: #3B82F6; }
.hero-float-card.card-3 { bottom: 50px; right: 20px; animation-delay: .55s; color: #10B981; }
.hero-float-card.card-4 { bottom: 10px; left: 50%; transform: translateX(-50%); animation-delay: .7s; color: #8B5CF6; }
.hero-float-card.card-5 { top: 90px; left: 10px; animation-delay: .4s; color: #EC4899; }
@keyframes floatCardIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
.card-4 { animation-name: floatCardIn2; }
@keyframes floatCardIn2 { from { opacity: 0; transform: translate(-50%, 12px); } to { opacity: 1; transform: translate(-50%, 0); } }

.ysd-ref-hero-copy { opacity: 0; transform: translateY(24px); transition: all .6s ease-out; }
.hero-visible .ysd-ref-hero-copy { opacity: 1; transform: translateY(0); }
.ysd-ref-hero-desc { font-size: 1.05rem; max-width: 480px; }

.ysd-ref-role-bar { height: 4px; background: var(--role-color); border-radius: var(--radius-xl) var(--radius-xl) 0 0; }
.ysd-ref-role-features { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
.ysd-ref-role-feat { padding: 4px 10px; border-radius: var(--radius-full); background: var(--bg-soft); font-size: .76rem; color: var(--text-soft); }
.ysd-ref-role-stat { display: flex; align-items: center; gap: 4px; color: var(--text-faint); }

@media (max-width: 900px) {
  .ysd-ref-hero-visual { min-height: 280px; }
  .hero-visual-bg { width: 320px; height: 280px; }
  .hero-visual-core { width: 70px; height: 70px; }
  .hero-float-card { padding: 8px 12px; font-size: .72rem; gap: 4px; }
}
@media (max-width: 640px) {
  .ysd-ref-hero-visual { min-height: 240px; }
  .hero-visual-bg { width: 280px; height: 240px; }
  .hero-visual-core { width: 52px; height: 52px; }
  .hero-float-card { padding: 4px 8px; font-size: .6rem; gap: 3px; }
  .hero-float-card svg { width: 12px; height: 12px; }
  .hero-float-card.card-2 { top: 55px; right: 5px; }
  .hero-float-card.card-3 { bottom: 35px; right: 5px; }
  .hero-float-card.card-4 { bottom: 8px; animation-name: floatCardIn2; }
  .hero-float-card.card-5 { top: 55px; left: 5px; }
}
</style>
