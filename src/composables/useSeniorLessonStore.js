import { ref } from 'vue'
import { seniorApp } from '@/mock/platformData'

const STORAGE_KEY = 'senior_lesson_drafts_v1'

function createMarkdownLesson(requirement) {
  const topic = requirement?.slice(0, 18) || '乡村课堂主题'
  return `# ${topic} · 结构化教案\n\n## 一、基本信息\n- 学段：小学高段\n- 学科：综合实践\n- 课时：1 课时\n- 场景：乡村本地情境课堂\n\n## 二、教学目标\n1. 结合乡土情境理解核心知识点，并能完成口头表达。\n2. 能从本地案例中提炼观察维度，形成小组讨论结论。\n3. 完成“观察-分析-展示”闭环，提升合作与反思能力。\n\n## 三、本地案例资源\n- 案例 A：村口河道季节变化观察记录（近三月照片+访谈摘录）。\n- 案例 B：本地农事日历（春耕、夏管、秋收、冬藏）与节气对应表。\n- 案例 C：乡村公共空间改造前后对比（学生可实地走访）。\n\n## 四、活动设计（40 分钟）\n### 1) 情境导入（8 分钟）\n- 展示本地图片与问题：\"这组变化背后反映了什么？\"\n- 学生用 1 句话描述观察到的现象。\n\n### 2) 小组任务（20 分钟）\n- 每组选择 1 个本地案例，按“现象-原因-证据”完成分析卡。\n- 教师巡回追问：\"你的证据来自哪里？是否还有反例？\"\n\n### 3) 汇报与评价（10 分钟）\n- 每组 1 分钟展示，其他组用“准确性/完整性/本地性”三维评价。\n- 教师即时反馈并补充学科规范表达。\n\n### 4) 课末沉淀（2 分钟）\n- 留下 1 条“今天最有价值的发现”，作为反思输入。\n\n## 五、评价设计\n- 过程性：小组讨论参与度、证据引用有效性。\n- 结果性：汇报结构完整度、表达准确度。\n- 迁移性：能否把课堂方法迁移到另一个本地问题。\n\n## 六、课后延伸\n- 用手机拍摄 3 张本地观察照片，写 100 字说明并上传。\n- 下一课用作开场素材，形成连续性案例库。\n\n## 七、教师备忘\n- 语音输入需求：${requirement || '请补充本节课具体需求'}\n- 下次优化点：增加学生提问时间，减少教师讲述比例。\n`
}

function buildDraftContent(requirement) {
  return createMarkdownLesson(requirement)
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
