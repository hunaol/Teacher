import { ref } from 'vue'
import { seniorApp } from '@/mock/platformData'

const STORAGE_KEY = 'senior_lesson_drafts_v1'

function buildDraftContent(requirement) {
  return `结构化教案草稿\n\n需求转写\n${requirement || '请围绕乡村课堂生成结构化教案'}\n\n教学目标\n1. 明确课堂核心任务。\n2. 引入本地案例支持理解。\n3. 形成可展示的课堂活动。\n\n本地案例\n- 家乡茶园\n- 节气农事\n- 村落观察记录\n\n活动设计\n- 情境导入\n- 案例分析\n- 分组汇报\n- 课堂评价\n\n课后延伸\n- 让学生记录一次家乡劳动观察并带回课堂交流。`
}

function seedDrafts() {
  return seniorApp.lesson.drafts.map((item) => ({
    ...item,
    content: buildDraftContent(`请根据${item.title}补充教学目标、本地案例和活动设计。`),
    annotations: {
      goal: [],
      localCase: [],
      activity: [],
    },
  }))
}

function readDrafts() {
  if (typeof window === 'undefined') return seedDrafts()
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return seedDrafts()
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || !parsed.length) return seedDrafts()
    return parsed.map((item) => ({
      ...item,
      annotations: {
        goal: item.annotations?.goal || [],
        localCase: item.annotations?.localCase || [],
        activity: item.annotations?.activity || [],
      },
    }))
  } catch {
    return seedDrafts()
  }
}

const drafts = ref(readDrafts())

function persistDrafts() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts.value))
}

export function useSeniorLessonStore() {
  function addDraft(item) {
    drafts.value.unshift({
      ...item,
      annotations: item.annotations || { goal: [], localCase: [], activity: [] },
    })
    persistDrafts()
  }

  function updateDraft(id, patch) {
    const target = drafts.value.find((item) => item.id === id)
    if (!target) return
    Object.assign(target, patch)
    persistDrafts()
  }

  function addAnnotation(draftId, section, payload) {
    const target = drafts.value.find((item) => item.id === draftId)
    if (!target) return
    if (!target.annotations) target.annotations = { goal: [], localCase: [], activity: [] }
    if (!target.annotations[section]) target.annotations[section] = []
    target.annotations[section].unshift(payload)
    persistDrafts()
  }

  function replaceAll(nextDrafts) {
    drafts.value = nextDrafts
    persistDrafts()
  }

  return {
    drafts,
    buildDraftContent,
    addDraft,
    updateDraft,
    addAnnotation,
    replaceAll,
  }
}
