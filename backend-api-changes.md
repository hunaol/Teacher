# 后端接口修改文档

> 生成日期：2026-06-16  
> 项目：云师道·MathAgent（training-backend）

---

## 一、新增接口汇总

| 模块 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 诊断 | POST | `/api/diagnoses` | 手动录入诊断（已是原有） |
| 诊断 | **GET** | `/api/diagnoses/trend` | **新增** — 近 7 日诊断趋势 |
| 诊断 | **PUT** | `/api/diagnoses/{id}` | **新增** — 更新诊断报告 |
| 诊断 | **DELETE** | `/api/diagnoses/{id}` | **新增** — 删除诊断报告 |
| 课题 | **PUT** | `/api/research/topics/{id}` | **新增** — 更新课题 |
| 课题 | **DELETE** | `/api/research/topics/{id}` | **新增** — 删除课题 |
| 教法库 | **POST** | `/api/teaching-library/videos` | **新增** — 上传视频 |
| 教法库 | **PUT** | `/api/teaching-library/videos/{id}` | **新增** — 更新视频信息 |
| 教法库 | **DELETE** | `/api/teaching-library/videos/{id}` | **新增** — 删除视频 |

---

## 二、修改文件详情

### 1. 诊断模块 — 新增趋势图接口

**文件：** `src/main/java/com/innovation/training/module/diagnosis/controller/DiagnosisController.java`

```java
// 新增 GET /api/diagnoses/trend
@Operation(summary = "获取近7日诊断趋势数据")
@GetMapping("/trend")
public Result<DiagnosisTrendResponse> trend(Authentication authentication) {
    return Result.success(diagnosisService.trend(currentUserService.requireUserId(authentication)));
}

// 新增 PUT /api/diagnoses/{id}
@Operation(summary = "更新诊断报告")
@PutMapping("/{id}")
public Result<DiagnosisResponse> update(@PathVariable Long id,
        @Valid @RequestBody CreateDiagnosisRequest request,
        Authentication authentication) {
    return Result.success(diagnosisService.update(currentUserService.requireUserId(authentication), id, request));
}

// 新增 DELETE /api/diagnoses/{id}
@Operation(summary = "删除诊断报告")
@DeleteMapping("/{id}")
public Result<Void> delete(@PathVariable Long id, Authentication authentication) {
    diagnosisService.delete(currentUserService.requireUserId(authentication), id);
    return Result.success(null);
}
```

**文件：** `src/main/java/com/innovation/training/module/diagnosis/service/DiagnosisService.java`

```java
// 新增方法签名
DiagnosisTrendResponse trend(Long userId);
DiagnosisResponse update(Long userId, Long id, CreateDiagnosisRequest request);
void delete(Long userId, Long id);
```

**文件：** `src/main/java/com/innovation/training/module/diagnosis/service/impl/DiagnosisServiceImpl.java`

```java
// 近 7 日趋势：按天统计
@Override
public DiagnosisTrendResponse trend(Long userId) {
    LocalDate today = LocalDate.now();
    List<String> days = new ArrayList<>();
    List<Long> counts = new ArrayList<>();
    for (int i = 6; i >= 0; i--) {
        LocalDate date = today.minusDays(i);
        days.add(date.toString().substring(5)); // MM-DD
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.plusDays(1).atStartOfDay();
        Long count = diagnosisReportMapper.selectCount(new LambdaQueryWrapper<DiagnosisReport>()
                .eq(DiagnosisReport::getUserId, userId)
                .ge(DiagnosisReport::getCreatedAt, start)
                .lt(DiagnosisReport::getCreatedAt, end));
        counts.add(count);
    }
    return new DiagnosisTrendResponse(days, counts);
}

// 更新诊断
@Override
@Transactional(rollbackFor = Exception.class)
public DiagnosisResponse update(Long userId, Long id, CreateDiagnosisRequest request) {
    DiagnosisReport report = requireOwned(userId, id);
    if (StringUtils.hasText(request.getStudentName())) report.setStudentName(request.getStudentName().trim());
    if (StringUtils.hasText(request.getClassName())) report.setClassName(request.getClassName().trim());
    if (StringUtils.hasText(request.getTopic())) report.setTopic(request.getTopic().trim());
    if (StringUtils.hasText(request.getQuestionText())) report.setQuestionText(request.getQuestionText().trim());
    diagnosisReportMapper.updateById(report);
    return DiagnosisResponse.from(report);
}

// 删除诊断
@Override
@Transactional(rollbackFor = Exception.class)
public void delete(Long userId, Long id) {
    requireOwned(userId, id);
    diagnosisReportMapper.deleteById(id);
}

// 私有方法：检查归属权限
private DiagnosisReport requireOwned(Long userId, Long id) {
    DiagnosisReport report = diagnosisReportMapper.selectOne(new LambdaQueryWrapper<DiagnosisReport>()
            .eq(DiagnosisReport::getId, id).eq(DiagnosisReport::getUserId, userId).last("LIMIT 1"));
    if (report == null) throw new BusinessException(ErrorCode.BAD_REQUEST, "诊断记录不存在");
    return report;
}
```

**文件：** `src/main/java/com/innovation/training/module/diagnosis/service/impl/DiagnosisServiceImpl.java`  
**修改：** `buildSummary` 方法增加 `latestImageUrl`

```java
// 修改前
private StudentDiagnosisSummaryResponse buildSummary(DiagnosisReport latest, long count) {
    ...
    response.setRiskLevel(riskLevel(count));
    response.setLatestAt(latest.getCreatedAt());
    return response;
}

// 修改后
private StudentDiagnosisSummaryResponse buildSummary(DiagnosisReport latest, long count) {
    ...
    response.setRiskLevel(riskLevel(count));
    response.setLatestImageUrl(latest.getImageUrl());  // 新增
    response.setLatestAt(latest.getCreatedAt());
    return response;
}
```

**新增文件：** `src/main/java/com/innovation/training/module/diagnosis/dto/DiagnosisTrendResponse.java`

```java
package com.innovation.training.module.diagnosis.dto;

import java.util.List;

public class DiagnosisTrendResponse {
    private List<String> days;
    private List<Long> counts;

    public DiagnosisTrendResponse(List<String> days, List<Long> counts) {
        this.days = days; this.counts = counts;
    }
    // getters/setters...
}
```

**新增文件：** `src/main/java/com/innovation/training/module/diagnosis/service/StudentDiagnosisSummaryResponse.java`  
**新增字段：**

```java
private String latestImageUrl;  // 最新诊断图片 URL

public String getLatestImageUrl() { return latestImageUrl; }
public void setLatestImageUrl(String latestImageUrl) { this.latestImageUrl = latestImageUrl; }
```

---

### 2. OCR 识别 — 修复模型兼容性

**文件：** `src/main/java/com/innovation/training/module/ai/QwenOcrClient.java`

**问题：** `qwen-vl-ocr-latest` 模型返回空内容导致 500 错误。  
**修复：** 空内容容错 + 支持数组格式响应。

```java
// extractContent 方法改进
private String extractContent(Map<?, ?> response) {
    if (response == null) throw new BusinessException(...);
    Object choicesObject = response.get("choices");
    if (choicesObject instanceof List<?> choices && !choices.isEmpty()) {
        Object firstChoice = choices.get(0);
        if (firstChoice instanceof Map<?, ?> choice) {
            Object msgObj = choice.get("message");
            if (msgObj instanceof Map<?, ?> message) {
                Object content = message.get("content");
                // 纯文本格式
                if (content instanceof String text) {
                    if (StringUtils.hasText(text)) return text.trim();
                    return "（图片中未识别到文字内容）";  // 容错
                }
                // 多模态数组格式 [{type:"text", text:"..."}]
                if (content instanceof List<?> parts) {
                    StringBuilder sb = new StringBuilder();
                    for (Object part : parts) {
                        if (part instanceof Map<?, ?> p) {
                            Object t = p.get("text");
                            if (t instanceof String s) sb.append(s);
                            else if (t != null) sb.append(t.toString());
                        }
                    }
                    String result = sb.toString().trim();
                    if (!result.isEmpty()) return result;
                }
            }
        }
    }
    String fallback = response.toString();
    if (fallback.length() > 2000) fallback = fallback.substring(0, 2000);
    throw new BusinessException(ErrorCode.INTERNAL_ERROR, "OCR 解析失败，响应: " + fallback);
}
```

---

### 3. 文件上传 — 大小限制调整

**文件：** `src/main/java/com/innovation/training/support/LocalFileStorageService.java`

```java
// 修改前
private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;  // 10MB

// 修改后
private static final long MAX_FILE_SIZE = 500 * 1024 * 1024;  // 500MB
```

**文件：** `src/main/resources/application.yml`

```yaml
spring:
  servlet:
    multipart:
      max-file-size: 500MB      # 新增
      max-request-size: 500MB   # 新增

ai:
  qwen:
    ocr-model: qwen-vl-plus    # 从 qwen-vl-ocr-latest 改为 qwen-vl-plus
```

---

### 4. 教法库 — 视频上传管理

**文件：** `src/main/java/com/innovation/training/module/library/controller/TeachingLibraryController.java`

```java
// 新增 POST /api/teaching-library/videos
@Operation(summary = "上传视频教法资源")
@PostMapping("/videos")
public Result<ResourceResponse> upload(@RequestBody UploadVideoRequest request, Authentication authentication) {
    User user = currentUserService.requireUser(authentication);
    teacherAccessService.requireAny(authentication, "novice");
    return Result.success(teachingLibraryService.uploadVideo(user, request));
}

// 新增 PUT /api/teaching-library/videos/{id}
@Operation(summary = "更新视频教法资源")
@PutMapping("/videos/{id}")
public Result<ResourceResponse> update(@PathVariable Long id, @RequestBody UploadVideoRequest request, Authentication authentication) {
    User user = currentUserService.requireUser(authentication);
    return Result.success(teachingLibraryService.updateVideo(user, id, request));
}

// 新增 DELETE /api/teaching-library/videos/{id}
@Operation(summary = "删除视频教法资源")
@DeleteMapping("/videos/{id}")
public Result<Void> delete(@PathVariable Long id, Authentication authentication) {
    User user = currentUserService.requireUser(authentication);
    teachingLibraryService.deleteVideo(user, id);
    return Result.success(null);
}
```

**文件：** `src/main/java/com/innovation/training/module/library/service/TeachingLibraryService.java`

```java
// 上传视频
public ResourceResponse uploadVideo(User user, UploadVideoRequest req) {
    TeachingResource r = new TeachingResource();
    r.setUserId(user.getId());
    r.setTitle(req.getTitle() != null ? req.getTitle().trim() : "未命名视频");
    r.setResourceType("video");
    r.setMediaUrl(req.getMediaUrl() != null ? req.getMediaUrl().trim() : "");
    r.setUploader(user.getNickname() != null ? user.getNickname() : user.getUsername());
    r.setTags(req.getCategory() != null ? req.getCategory().trim() : "其他");
    r.setAuditStatus("approved");
    resourceMapper.insert(r);
    return ResourceResponse.from(r);
}

// 更新视频
public ResourceResponse updateVideo(User user, Long id, UploadVideoRequest req) {
    TeachingResource r = resourceMapper.selectById(id);
    if (r == null || !r.getUserId().equals(user.getId())) throw new RuntimeException("无权操作");
    if (req.getTitle() != null) r.setTitle(req.getTitle().trim());
    if (req.getSummary() != null) r.setSummary(req.getSummary().trim());
    if (req.getCategory() != null) r.setTags(req.getCategory().trim());
    resourceMapper.updateById(r);
    return ResourceResponse.from(r);
}

// 删除视频
public void deleteVideo(User user, Long id) {
    TeachingResource r = resourceMapper.selectById(id);
    if (r == null || !r.getUserId().equals(user.getId())) throw new RuntimeException("无权操作");
    resourceMapper.deleteById(id);
}

// 移除县域过滤，所有人可见
// .eq(TeachingResource::getCounty, user.getCounty()) 已删除
```

**新增文件：** `src/main/java/com/innovation/training/module/library/dto/UploadVideoRequest.java`

```java
package com.innovation.training.module.library.dto;

public class UploadVideoRequest {
    private String title;
    private String summary;
    private String content;
    private String category;
    private String mediaUrl;
    private String coverUrl;
    private String duration;
    // getters/setters...
}
```

---

### 5. 课题研究 — 增删改接口

**文件：** `src/main/java/com/innovation/training/module/research/controller/ResearchController.java`

```java
// 新增 PUT /api/research/topics/{id}
@Operation(summary = "更新课题")
@PutMapping("/{id}")
public Result<ResearchTopicResponse> update(@PathVariable Long id,
        @Valid @RequestBody SaveTopicRequest request,
        Authentication authentication) {
    teacherAccessService.requireAny(authentication, "mid");
    return Result.success(researchService.update(currentUserService.requireUserId(authentication), id, request));
}

// 新增 DELETE /api/research/topics/{id}
@Operation(summary = "删除课题")
@DeleteMapping("/{id}")
public Result<Void> delete(@PathVariable Long id, Authentication authentication) {
    teacherAccessService.requireAny(authentication, "mid");
    researchService.delete(currentUserService.requireUserId(authentication), id);
    return Result.success(null);
}
```

**文件：** `src/main/java/com/innovation/training/module/research/service/ResearchService.java`

```java
// 新增方法签名
ResearchTopicResponse update(Long userId, Long id, SaveTopicRequest request);
void delete(Long userId, Long id);
```

**文件：** `src/main/java/com/innovation/training/module/research/service/impl/ResearchServiceImpl.java`

```java
@Override
@Transactional(rollbackFor = Exception.class)
public ResearchTopicResponse update(Long userId, Long id, SaveTopicRequest request) {
    ResearchTopic topic = researchTopicMapper.selectOne(new LambdaQueryWrapper<ResearchTopic>()
            .eq(ResearchTopic::getId, id).eq(ResearchTopic::getUserId, userId));
    if (topic == null) throw new RuntimeException("课题不存在");
    topic.setTitle(request.getTitle().trim());
    topic.setMeta(trimToNull(request.getMeta()));
    topic.setExtra(trimToNull(request.getExtra()));
    topic.setSources(trimToNull(request.getSources()));
    topic.setUpdatedAt(LocalDateTime.now());
    researchTopicMapper.updateById(topic);
    return ResearchTopicResponse.from(topic);
}

@Override
@Transactional(rollbackFor = Exception.class)
public void delete(Long userId, Long id) {
    researchTopicMapper.delete(new LambdaQueryWrapper<ResearchTopic>()
            .eq(ResearchTopic::getId, id).eq(ResearchTopic::getUserId, userId));
}
```

---

## 三、配置变更

**文件：** `src/main/resources/application.yml`

| 变更项 | 旧值 | 新值 |
|--------|------|------|
| `spring.servlet.multipart.max-file-size` | 无（默认10MB） | `500MB` |
| `spring.servlet.multipart.max-request-size` | 无 | `500MB` |
| `ai.qwen.ocr-model` | `qwen-vl-ocr-latest` | `qwen-vl-plus` |

---

## 四、新增文件清单

```
eduagent/src/main/java/com/innovation/training/
├── module/diagnosis/
│   └── dto/DiagnosisTrendResponse.java
└── module/library/
    └── dto/UploadVideoRequest.java
```
