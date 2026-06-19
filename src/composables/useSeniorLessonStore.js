/**
 * useSeniorLessonStore.js — 资深教师教案数据 Store
 * ====================================================
 * 负责资深教师端的教案（Lesson）和教学反思（Reflection）数据管理：
 *   1. 加载教案列表，并按 lessonId 归类反思批注
 *   2. AI 生成教案、保存草稿、更新教案
 *   3. 增删改查教学反思（批注）
 *
 * 该 composable 使用模块级 ref 实现单例，
 * 在 useSeniorLessonStore() 中暴露给组件使用。
 */

import { ref } from 'vue'
import {
  // 引入后端 API（重命名避免与本地方法同名）
  generateLesson as generateLessonApi,
  listLessons,
  createLesson,
  updateLesson as updateLessonApi,
  deleteLesson as deleteLessonApi,
  createReflection,
  listReflections,
} from '../api/lesson'

// ==================== 工具函数 ====================

/**
 * 将 ISO 时间格式化为简短中文格式
 * 当天显示 "今天 HH:MM"，非当天显示 "MM-DD HH:MM"
 * @param {string} iso - ISO 时间字符串
 * @returns {string} 格式化后的时间
 */
function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return isToday ? `今天 ${hh}:${mm}` : `${d.getMonth() + 1}-${String(d.getDate()).padStart(2, '0')} ${hh}:${mm}`
}

/**
 * 将后端返回的 lesson 原始数据转换为前端展示用的 draft 对象
 * 初始化 annotations 三段（goal/localCase/activity）为空
 * @param {Object} lesson - 后端 lesson 实体
 * @returns {Object} 前端 draft 对象
 */
function toDraftItem(lesson) {
  return {
    id: lesson.id,
    title: lesson.title,
    summary: lesson.summary || '',
    requirement: lesson.requirement || '',
    content: lesson.content || '',
    contentJson: lesson.contentJson || '',
    updatedAt: formatTime(lesson.updatedAt),
    createdAt: lesson.createdAt,
    annotations: { goal: [], localCase: [], activity: [] },
  }
}

// ==================== 模块级状态（单例） ====================

/** 教案草稿列表 */
const drafts = ref([])
/** 加载状态 */
const loading = ref(false)
/** 错误信息 */
const error = ref('')

// ==================== 业务方法 ====================

/**
 * 加载所有教案，并为每个教案归类其教学反思批注
 * 反思的 text 字段以 "[goal|localCase|activity]" 前缀标记所属段落
 */
async function loadDrafts() {
  loading.value = true
  error.value = ''
  try {
    const list = await listLessons()
    drafts.value = list.map(toDraftItem)
    // 加载全部反思并按 lessonId 分配到对应教案
    try {
      const allReflections = await listReflections(null)
      drafts.value.forEach((draft) => {
        // 重置批注容器
        draft.annotations = { goal: [], localCase: [], activity: [] }
        allReflections
          .filter((r) => r.lessonId === draft.id)
          .forEach((r) => {
            // 解析 [section] 前缀，确定批注归属段落
            const match = r.text?.match(/^\[(goal|localCase|activity)\]\s*/)
            const section = match ? match[1] : 'goal'
            const text = match ? r.text.slice(match[0].length) : r.text
            draft.annotations[section].push({
              id: r.id,
              time: formatTime(r.createdAt),
              text,
              createdAt: r.createdAt,
            })
          })
      })
    } catch { /* 反思为可选数据，失败不阻塞 */ }
  } catch (e) {
    error.value = e.message || '加载失败'
  } finally {
    loading.value = false
  }
}

/**
 * 调用 AI 生成教案
 * 1. 调用后端 /lessons/generate 接口
 * 2. 若后端返回 savedLesson，则插入到草稿列表头部
 * @param {string} requirement - 备课需求描述
 */
async function generateLesson(requirement) {
  loading.value = true
  error.value = ''
  try {
    const result = await generateLessonApi(requirement)
    if (result.savedLesson) {
      drafts.value.unshift(toDraftItem(result.savedLesson))
    }
    return result
  } catch (e) {
    error.value = e.message || '生成失败'
    throw e
  } finally {
    loading.value = false
  }
}

/**
 * 基于需求生成一份默认教案内容（Markdown 格式）
 * 用于本地兜底/草稿模板
 * @param {string} requirement - 备课需求
 * @returns {string} Markdown 教案文本
 */
function buildDraftContent(requirement) {
  const topic = requirement?.slice(0, 24) || '乡村课堂主题'
  return [
    `# ${topic}`,
    '',
    '## 教学目标',
    '1. 结合乡土情境理解核心知识点。',
    '2. 从本地案例中提炼观察维度。',
    '3. 完成小组合作与汇报展示。',
    '',
    '## 本地案例资源',
    '- 待补充',
    '',
    '## 活动设计（40分钟）',
    '### 情境导入（8分钟）',
    '### 小组任务（20分钟）',
    '### 汇报评价（10分钟）',
    '### 课末沉淀（2分钟）',
    '',
    `> 需求：${requirement || '请补充'}`,
  ].join('\n')
}

/**
 * 新增一个教案草稿
 * @param {Object} item - 草稿数据
 * @returns {Promise<Object>} 后端返回的创建结果
 */
async function addDraft(item) {
  loading.value = true
  error.value = ''
  try {
    const created = await createLesson({
      title: item.title || '教案草稿',
      summary: item.summary || '',
      requirement: item.requirement || '',
      content: item.content || '',
      contentJson: item.contentJson || '',
    })
    const draft = toDraftItem(created)
    // 保留传入的批注（如果有）
    draft.annotations = item.annotations || { goal: [], localCase: [], activity: [] }
    drafts.value.unshift(draft)
    return created
  } catch (e) {
    error.value = e.message || '保存失败'
    throw e
  } finally {
    loading.value = false
  }
}

/**
 * 更新指定教案
 * @param {string|number} id - 教案 ID
 * @param {Object} patch - 待更新的字段
 */
async function updateDraft(id, patch) {
  loading.value = true
  error.value = ''
  try {
    const updated = await updateLessonApi(id, {
      title: patch.title || '未命名教案',
      summary: patch.summary || '',
      requirement: patch.requirement || '',
      content: patch.content || '',
      contentJson: patch.contentJson || '',
    })
    // 本地同步更新
    const target = drafts.value.find((item) => item.id === id)
    if (target) {
      Object.assign(target, {
        title: updated.title,
        summary: updated.summary,
        requirement: updated.requirement,
        content: updated.content,
        contentJson: updated.contentJson,
        updatedAt: formatTime(updated.updatedAt),
      })
    }
    return updated
  } catch (e) {
    error.value = e.message || '更新失败'
    throw e
  } finally {
    loading.value = false
  }
}

/**
 * 为指定教案添加一个批注（reflection）
 * @param {string|number} draftId - 教案 ID
 * @param {string} section - 批注段落：goal / localCase / activity
 * @param {Object} payload - { text: string }
 */
async function addAnnotation(draftId, section, payload) {
  try {
    // 在文本前加 [section] 前缀，便于后续归类解析
    const reflection = await createReflection({
      lessonId: draftId,
      text: `[${section}] ${payload.text}`,
    })
    const target = drafts.value.find((item) => item.id === draftId)
    if (target?.annotations?.[section]) {
      target.annotations[section].unshift({
        id: reflection.id,
        time: formatTime(reflection.createdAt),
        text: payload.text,
        createdAt: reflection.createdAt,
      })
    }
    return reflection
  } catch (e) {
    error.value = e.message || '添加批注失败'
    throw e
  }
}

/**
 * 加载并归类指定教案的所有批注
 * @param {string|number} lessonId
 * @returns {Promise<Array>} 原始 reflection 列表
 */
async function loadAnnotations(lessonId) {
  try {
    const reflections = await listReflections(lessonId)
    const target = drafts.value.find((item) => item.id === lessonId)
    if (target) {
      target.annotations = { goal: [], localCase: [], activity: [] }
      reflections.forEach((r) => {
        const match = r.text?.match(/^\[(goal|localCase|activity)\]\s*/)
        const section = match ? match[1] : 'goal'
        const text = match ? r.text.slice(match[0].length) : r.text
        target.annotations[section].push({
          id: r.id,
          time: formatTime(r.createdAt),
          text,
          createdAt: r.createdAt,
        })
      })
    }
    return reflections
  } catch (e) {
    error.value = e.message || '加载批注失败'
    return []
  }
}

/**
 * 删除指定教案
 * 后端可能不支持 DELETE，因此先尝试调用，失败时静默兜底
 * @param {string|number} id
 */
async function removeDraft(id) {
  try { await deleteLessonApi(id) } catch { /* 后端可能不支持 DELETE */ }
  drafts.value = drafts.value.filter((d) => d.id !== id)
}

// ==================== 公共 API ====================

/**
 * 暴露给组件使用的教案 Store 工厂方法
 * 首次调用时自动加载教案列表
 */
export function useSeniorLessonStore() {
  loadDrafts()
  return {
    drafts,
    loading,
    error,
    loadDrafts,
    generateLesson,
    buildDraftContent,
    addDraft,
    updateDraft,
    removeDraft,
    addAnnotation,
    loadAnnotations,
  }
}
