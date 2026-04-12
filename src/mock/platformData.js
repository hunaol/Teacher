export const homeIntro = {
  title: '乡村教师智能支持平台',
  subtitle: '面向不同发展阶段教师，提供贴近真实教学场景的移动化工作应用。',
}

export const roleCards = [
  {
    key: 'senior',
    name: '资深教师端',
    entry: '/senior/login',
    badge: '经验沉淀',
    description: '聚焦教案生成、课堂复盘与案例沉淀。',
  },
  {
    key: 'mid',
    name: '骨干教师端',
    entry: '/mid/login',
    badge: '教学进阶',
    description: '聚焦错题诊断、课堂互动与研究导航。',
  },
  {
    key: 'novice',
    name: '新任教师端',
    entry: '/novice/login',
    badge: '成长加速',
    description: '聚焦经验获取、在线答疑与成长记录。',
  },
]

export const seniorApp = {
  appName: '资深教师端',
  theme: 'senior',
  login: {
    title: '欢迎进入资深教师端',
    subtitle: '围绕备课、复盘与案例沉淀，形成可持续增长的个人教学资产。',
    account: 'senior_teacher@demo.cn',
    highlights: ['智能语音备课', '随堂反思', '案例沉淀库', '多版本草稿'],
    enterPath: '/senior/lesson',
  },
  navItems: [
    { name: '备课', path: '/senior/lesson', icon: '备' },
    { name: '反思', path: '/senior/reflection', icon: '思' },
  ],
  lesson: {
    title: '智能语音备课',
    subtitle: '围绕本地情境快速生成结构化教案，并持续维护多个版本。',
    stats: [
      { label: '本周教案', value: '12' },
      { label: '已保存版本', value: '38' },
      { label: '本地案例引用', value: '9' },
    ],
    input: '请生成一份结合本地茶园劳动场景的小学综合实践课教案。',
    output: '课程名称：家乡茶山与四时观察\n\n教学目标\n1. 理解节气与农事关系。\n2. 能结合本地案例进行表达。\n3. 完成观察记录与小组汇报。',
    drafts: [
      { id: 1, title: '茶园劳动实践课', summary: '综合实践 · 五年级', updatedAt: '今天 09:40' },
      { id: 2, title: '家乡水系观察课', summary: '科学 · 四年级', updatedAt: '昨天 18:20' },
      { id: 3, title: '节气与农事表达课', summary: '语文拓展 · 六年级', updatedAt: '周三 16:15' },
    ],
  },
  reflection: {
    title: '随堂反思',
    subtitle: '沉淀课堂问题、改进动作与后续跟踪，形成可追踪复盘记录。',
    stats: [
      { label: '本周反思', value: '6' },
      { label: '已关联教案', value: '14' },
      { label: '待整理问题', value: '2' },
    ],
    draft: '今天学生对本地案例非常投入，但小组任务说明略晚，导致汇报时间偏紧。',
    records: [
      { id: 1, title: '第二节 综合实践', time: '今天 15:20', text: '学生兴趣高，评价标准应在活动前展示。' },
      { id: 2, title: '第一节 语文拓展', time: '昨天 10:05', text: '追问深度不足，下次增加比较与迁移提问。' },
      { id: 3, title: '午间教研试讲', time: '周三 14:16', text: '导入较顺畅，但板书结构还可更简洁。' },
    ],
  },
}

export const midApp = {
  appName: '骨干教师端',
  theme: 'mid',
  login: {
    title: '欢迎进入骨干教师端',
    subtitle: '面向课堂优化、互动支持与课题研究，形成可执行的改进闭环。',
    account: 'mid_teacher@demo.cn',
    highlights: ['错题智能诊断', '课堂数字助教', '研究课题导航', '学生样本跟踪'],
    enterPath: '/mid/diagnosis',
  },
  navItems: [
    { name: '诊断', path: '/mid/diagnosis', icon: '诊' },
    { name: '助教', path: '/mid/avatar', icon: '助' },
    { name: '研究', path: '/mid/research', icon: '研' },
  ],
  diagnosis: {
    title: '错题智能诊断',
    subtitle: '识别学生错因、生成策略并持续维护学情样本。',
    stats: [
      { label: '待处理样本', value: '18' },
      { label: '已生成建议', value: '43' },
      { label: '档案更新', value: '11' },
    ],
    students: [
      {
        id: 1,
        name: '王晨',
        subject: '六年级数学 · 分数应用题',
        reason: '对单位 1 变化识别不足，沿用整数题解法。',
        strategy: '先复述题意，再用线段图标注比较关系。',
        status: '已纳入 4 月学情跟踪',
      },
      {
        id: 2,
        name: '李萌',
        subject: '初一英语 · 阅读理解',
        reason: '对转折词和总结句敏感度偏低。',
        strategy: '加强 but、however 定位训练与主题句判断。',
        status: '已同步至英语专题改进档案',
      },
      {
        id: 3,
        name: '陈果',
        subject: '五年级科学 · 实验记录',
        reason: '观察记录缺少关键变量，结论不够完整。',
        strategy: '补充“现象-原因-结论”三列记录模板。',
        status: '等待教师确认后归档',
      },
    ],
  },
  avatar: {
    title: '智能数字人',
    subtitle: '在课堂中快速切换互动风格与讲解脚本。',
    stats: [
      { label: '本周调用', value: '7' },
      { label: '常用风格', value: '3' },
      { label: '互动课堂', value: '5' },
    ],
    modes: [
      { id: 1, name: '启发式讲授', text: '通过追问和停顿，引导学生逐步说出答案。' },
      { id: 2, name: '激励式互动', text: '强化鼓励反馈和课堂节奏带动。' },
      { id: 3, name: '训练式讲评', text: '围绕错因快速归类与纠偏。' },
    ],
  },
  research: {
    title: '课题研究导航',
    subtitle: '基于教学表现生成结构化课题建议，并维护研究清单。',
    stats: [
      { label: '本周推荐', value: '2' },
      { label: '在研课题', value: '3' },
      { label: '专家建议', value: '8' },
    ],
    list: [
      {
        id: 1,
        title: '乡村课堂中本地资源融入项目化学习的实施路径研究',
        meta: '推荐依据：近 6 周案例中，本地素材使用频次持续提升。',
        extra: '申报模板：区级课题 A-03 · 专家支持：刘教授',
      },
      {
        id: 2,
        title: '数字助教参与课堂互动的提问策略与学习效果研究',
        meta: '推荐依据：互动课堂记录显示，学生表达时长平均提升 21%。',
        extra: '申报模板：校本微课题 B-11 · 专家支持：陈老师',
      },
      {
        id: 3,
        title: '基于错题追踪的分层作业反馈模式研究',
        meta: '推荐依据：近期错题样本复现率下降，但反馈方式尚未统一。',
        extra: '申报模板：校级专项 C-07 · 专家支持：徐老师',
      },
    ],
  },
}

export const noviceApp = {
  appName: '新任教师端',
  theme: 'novice',
  login: {
    title: '欢迎进入新任教师端',
    subtitle: '帮助新教师快速建立稳定、可复制的课堂方法和成长记录。',
    account: 'novice_teacher@demo.cn',
    highlights: ['本地名师经验库', '在线答疑', '成长档案袋', '阶段报告'],
    enterPath: '/novice/library',
  },
  navItems: [
    { name: '经验库', path: '/novice/library', icon: '库' },
    { name: '答疑', path: '/novice/qa', icon: '问' },
    { name: '档案', path: '/novice/portfolio', icon: '档' },
  ],
  library: {
    title: '本地名师经验库',
    subtitle: '围绕乡村课堂常见问题，提供可收藏、可筛选的经验内容。',
    stats: [
      { label: '已收藏经验课', value: '14' },
      { label: '本周更新', value: '5' },
      { label: '待看内容', value: '3' },
    ],
    videos: [
      { id: 1, title: '如何处理课堂突然冷场', teacher: '周海燕', duration: '12:30', tags: ['课堂控场', '提问节奏'], favorite: true },
      { id: 2, title: '把家乡素材自然嵌入语文课', teacher: '罗明', duration: '18:05', tags: ['案例设计', '本地表达'], favorite: false },
      { id: 3, title: '班级差异大时如何组织合作学习', teacher: '何琴', duration: '09:48', tags: ['小组活动', '规则建立'], favorite: true },
      { id: 4, title: '低年级课堂表达启动技巧', teacher: '唐倩', duration: '10:12', tags: ['表达训练', '低年级'], favorite: false },
    ],
  },
  qa: {
    title: '在线答疑',
    subtitle: '围绕真实课堂问题，发起提问、编辑记录并追踪处理状态。',
    stats: [
      { label: '待处理提问', value: '5' },
      { label: '已获得答复', value: '16' },
      { label: '本周互动', value: '9' },
    ],
    draft: '如何让低年级学生更自然地参与课堂表达？',
    records: [
      { id: 1, from: '周海燕', role: '教研顾问', text: '先降低表达门槛，给出可模仿句式。' },
      { id: 2, from: '平台助理', role: '学习建议', text: '尝试“观察—互说—展示”三步法。' },
      { id: 3, from: '王老师', role: '同伴经验', text: '可以先让学生两人互说，再进入全班表达。' },
    ],
  },
  portfolio: {
    title: '成长档案袋',
    subtitle: '自动汇总课堂实践、反馈与指导意见，并支持持续整理。',
    stats: [
      { label: '本周更新', value: '3' },
      { label: '阶段报告', value: '4' },
      { label: '名师点评', value: '5' },
    ],
    items: [
      '教学方法：已形成 8 条适合乡村课堂的可复用策略',
      '学生反馈：根据课堂回访优化 3 次活动流程',
      '名师点评：累计收录 5 条针对性成长建议',
      '阶段结论：课堂节奏掌控显著提升，任务交代更清晰',
      '个人目标：尝试在综合实践课中加入更稳定的小组评价机制',
    ],
  },
}
