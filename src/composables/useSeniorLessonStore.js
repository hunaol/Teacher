import { ref } from 'vue'
import {
  generateLesson as generateLessonApi,
  listLessons,
  createLesson,
  updateLesson as updateLessonApi,
  createReflection,
  listReflections,
} from '../api/lesson'

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return isToday ? `今天 ${hh}:${mm}` : `${d.getMonth() + 1}-${String(d.getDate()).padStart(2, '0')} ${hh}:${mm}`
}

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

const drafts = ref([])
const loading = ref(false)
const error = ref('')
async function loadDrafts() {
  loading.value = true
  error.value = ''
  try {
    const list = await listLessons()
    drafts.value = list.map(toDraftItem)
    // 加载全部反思并分配到对应教案
    try {
      const allReflections = await listReflections(null)
      drafts.value.forEach((draft) => {
        draft.annotations = { goal: [], localCase: [], activity: [] }
        allReflections
          .filter((r) => r.lessonId === draft.id)
          .forEach((r) => {
            const match = r.text?.match(/^\[(goal|localCase|activity)\]\s*/)
            const section = match ? match[1] : 'goal'
            const text = match ? r.text.slice(match[0].length) : r.text
            draft.annotations[section].push({ id: r.id, time: formatTime(r.createdAt), text, createdAt: r.createdAt })
          })
      })
    } catch { /* reflections optional */ }
  } catch (e) {
    error.value = e.message || '加载失败'
  } finally {
    loading.value = false
  }
}

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

async function addAnnotation(draftId, section, payload) {
  try {
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
    addAnnotation,
    loadAnnotations,
  }
}
