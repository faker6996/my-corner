# 📊 OCR Processing Flow Documentation

This document provides a comprehensive overview of the OCR editing system's processing flow, from image upload to final text output.

## 🏗️ System Architecture Overview

```
User Upload → OCR Processing → LLM Correction → Manual Editing → Final Output
     ↓              ↓              ↓              ↓              ↓
   Tasks         Results      Corrections     Manual Text    Export
```

---

## 1. 📤 Upload & Create Task

### Flow: `POST /api/upload/image` → `POST /api/tasks`

```
User uploads images
  ↓
fileUploadService saves to filesystem (/uploads/YYYY/MM/DD/)
  ↓
Create image_files record (UUID, path, metadata)
  ↓
Create ocr_tasks (parent task - auto title: INF_OCR_YYYYMMDD_N)
  ↓
Create ocr_task_images[] (child records - 1 per image)
  ↓
Status: pending | Step: upload
```

### Database Tables

| Table             | Purpose               | Key Fields                                               |
| ----------------- | --------------------- | -------------------------------------------------------- |
| `ocr_tasks`       | Parent task container | `id`, `title`, `status`, `step`, `group_id`              |
| `ocr_task_images` | Child image records   | `id`, `task_id`, `image_file_id`, `status`, `llm_status` |
| `image_files`     | File metadata         | `id`, `uuid`, `file_path`, `mime_type`, `size`           |

### Task Naming Convention

- **Auto-generated title**: `INF_OCR_YYYYMMDD_N`
- Example: `INF_OCR_20251003_1`

---

## 2. 🔍 OCR Processing

### API: `POST /api/ocr/process`

```
For each image:
  ↓
Update ocr_task_images.status = 'processing'
  ↓
Read local file from UPLOAD_DIR
  ↓
Send FormData to OCR_AI_SERVICE_URL (external AI)
  ↓
Parse response: { text_regions[], extracted_text, confidence, etc }
  ↓
Create OCRResult.fromApiResponse()
  ↓
Persist to DB:
    - ocr_results (1 record)
    - text_regions[] (N regions with bbox, confidence)
  ↓
Update ocr_task_images.status = 'completed'
  ↓
Emit Socket.IO: task:status, task:result
```

### Database Structure

#### `ocr_results` (1 per image)

```typescript
{
  id: number
  task_id: number
  task_image_id: number
  extracted_text: string        // Raw OCR output
  corrected_text: string | null // LLM output
  final_text: string            // Computed (manual > corrected > original)
  avg_confidence: number        // 0.0 - 1.0
  text_count: number
  processing_time_seconds: number
  llm_spelling: JSONB[]         // Spelling analysis from LLM
  llm_extracted_info: JSONB[]   // Structured data extracted by LLM
  created_at: timestamp
  updated_at: timestamp
}
```

#### `text_regions` (N per result)

```typescript
{
  id: number;
  ocr_result_id: number;
  text: string; // Current display text
  original_text: string; // Original OCR output
  corrected_text: string; // LLM correction
  manual_text: string; // User manual edit
  bbox: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    width: number;
    height: number;
  }
  confidence: number; // 0.0 - 1.0
  region_index: number; // Sort order
  is_edited: boolean;
  created_at: timestamp;
  updated_at: timestamp;
}
```

### Key Processing Logic

- **File read priority**: Local `/uploads/*` > HTTP fetch
- **Timeout**: 60 seconds for external OCR service
- **Batch processing**: With concurrency control (`OCR_MAX_CONCURRENCY`)
- **Real-time updates**: WebSocket events `task:status`, `task:result`

---

## 3. 🤖 LLM Correction (Optional)

### API: `POST /api/tasks/{id}/llm-start`

```
Get latest OCR result by imageId
  ↓
Build fullText from extracted_text (preserves line breaks)
  ↓
Update ocr_task_images.llm_status = 'processing'
  ↓
POST to LLM_SERVICE_URL { text: fullText }
  ↓
Concurrency control (LLM_MAX_CONCURRENCY=2)
  ↓
Response: { corrected_text, spelling_analysis, extracted_info }
  ↓
llmApplyApp.applyCorrectedText():
    Split corrected_text by whitespace → tokens[]
    Map tokens[i] → text_regions[i].corrected_text
    Update ocr_results.corrected_text
    Recompute final_text (manual > corrected > original)
  ↓
Update ocr_task_images.llm_status = 'completed'
  ↓
Emit: llm:result
```

### Text Priority System

```typescript
final_text = manual_text || corrected_text || original_text || text;
```

**Priority Order**:

1. **Manual text** (highest priority - user edited)
2. **Corrected text** (LLM correction)
3. **Original text** (OCR output)
4. **Text** (fallback)

### LLM Features

- **Timeout**: `LLM_TIMEOUT_MS` (default 10 minutes / 600,000ms)
- **Queue management**: Prevents service overload
- **Spelling analysis**: Stored as JSONB in `ocr_results.llm_spelling`
- **Extracted info**: Structured data in `ocr_results.llm_extracted_info`
- **Socket event**: `llm:result` triggers UI update

### LLM Response Format

```typescript
{
  corrected_text: string; // Full corrected text
  spelling_analysis: Array<{
    // Word-level corrections
    line_index: number;
    word_index: number;
    original_word: string;
    corrected_word: string;
    confidence: number;
  }>;
  extracted_info: Array<{
    // Structured data extraction
    key: string;
    value: string;
    confidence: number;
  }>;
}
```

---

## 4. ✏️ Manual Editing

### API: `POST /api/tasks/{id}/apply-line-edits`

```
User edits line on UI
  ↓
Group words into lines by bbox position
  ↓
Save edit: { lineText, wordIndices[] }
  ↓
Update text_regions[].manual_text for each word
  ↓
Recompute final_text
  ↓
UI updates instantly
```

### Key Components

| Component               | Purpose                               |
| ----------------------- | ------------------------------------- |
| `LineOverlayEditor`     | Visual bbox editor with click-to-edit |
| `groupWordsIntoLines()` | Auto-group regions by Y-axis position |
| `manual_text` field     | Highest priority in text hierarchy    |

### Edit Flow

1. **User clicks** on text region in image
2. **Line detection**: Words grouped by vertical position (±5px tolerance)
3. **Edit mode**: Inline text editor appears
4. **Save**: `manual_text` updated for all words in line
5. **Recompute**: `final_text` recalculated with new manual text
6. **UI refresh**: Changes reflected immediately

---

## 5. 🔄 Real-time Updates

### Socket.IO Events

#### Server → Client Events

```typescript
// Task status change
socket.emit('task:status', {
  taskId: number
  imageId?: number
  status: TASK_STATUS   // 'pending' | 'processing' | 'completed' | 'failed'
  step: TASK_STEP       // 'upload' | 'ocr' | 'llm' | 'tts' | 'completed'
})

// OCR result ready
socket.emit('task:result', {
  taskId: number
  imageId: number
  resultId: number
})

// LLM correction completed
socket.emit('llm:result', {
  taskId: number
  imageId: number
})
```

#### Client Handlers

```typescript
// Update UI status indicator
socket.on("task:status", (payload) => {
  updateTaskStatus(payload.status, payload.step);
});

// Fetch and display OCR results
socket.on("task:result", async (payload) => {
  const results = await fetchOCRResults(payload.imageId);
  displayResults(results);
});

// Show LLM corrected text
socket.on("llm:result", async (payload) => {
  const llmData = await fetchLLMResults(payload.imageId);
  displayCorrectedText(llmData);
});
```

### Group Synchronization

- **Room joining**: Tasks join room `group:{groupId}`
- **Broadcast updates**: All images in group receive same events
- **Parallel processing**: Multi-image tasks update simultaneously
- **UI consistency**: All connected clients see updates in real-time

---

## 6. 📊 Data Models

### OCRResult Model

```typescript
class OCRResult {
  id?: number;
  task_id?: number;
  task_image_id?: number;
  extracted_text: string; // Raw OCR output
  corrected_text?: string; // LLM correction
  final_text: string; // Computed result
  text_regions: TextRegion[]; // Array of word/region data
  llm_spelling: any[]; // JSONB spelling analysis
  llm_extracted_info: any[]; // JSONB extracted information
  avg_confidence: number; // Average confidence score
  text_count: number; // Total number of text regions
  processing_time_seconds?: number;
  created_at?: Date;
  updated_at?: Date;

  // Methods
  getTextRegions(): TextRegion[];
  getTotalRegions(): number;
  getLowConfidenceRegions(): TextRegion[];
  static fromApiResponse(data: any): OCRResult;
}
```

### TextRegion Model

```typescript
class TextRegion {
  id?: number;
  ocr_result_id?: number;
  text: string; // Current display text
  original_text: string; // Original OCR output
  corrected_text?: string; // LLM correction
  manual_text?: string; // User manual edit
  bbox: BBox; // Bounding box coordinates
  confidence: number; // 0.0 - 1.0
  region_index: number; // Sort order in document
  is_edited: boolean; // Manual edit flag
  created_at?: Date;
  updated_at?: Date;

  // Methods
  getFinalText(): string; // Returns manual > corrected > original > text
  isLowConfidence(): boolean;
}

interface BBox {
  x1: number; // Top-left X
  y1: number; // Top-left Y
  x2: number; // Bottom-right X
  y2: number; // Bottom-right Y
  width: number;
  height: number;
}
```

---

## 7. 🎨 UI Components Architecture

### Component Hierarchy

```
TaskContainer (Main orchestrator)
├── ImageOCRViewer (Image display + bbox overlay)
│   ├── Image with zoom controls
│   └── SVG overlay with clickable regions
├── LineOverlayEditor (Edit by line)
│   ├── Line grouping logic
│   └── Inline text editor
├── TextRegionsList (Sidebar list)
│   ├── Word list with confidence
│   └── Search/filter functionality
├── LlmResultPanel (LLM analysis display)
│   ├── Corrected text
│   ├── Spelling analysis table
│   └── Extracted information
└── ProgressTracker (Statistics)
    ├── Confidence metrics
    ├── Processing time
    └── Region counts
```

### User Interaction Flow

```
1. Load task → Fetch group results via API
   ↓
2. Display image with bbox overlay (SVG rectangles)
   ↓
3. Click word → Select region, highlight bbox
   ↓
4. Edit mode → Inline editor for line text
   ↓
5. Save → Update manual_text via API
   ↓
6. Run LLM → Apply corrections automatically
   ↓
7. Socket updates → Refresh UI with new data
```

### Key UI Features

- **Bbox visualization**: SVG rectangles over image
- **Confidence coloring**: Red (low) → Yellow → Green (high)
- **Zoom controls**: Auto-fit + readable zoom for dense text
- **Line editing**: Group words into editable lines
- **Real-time sync**: Socket.IO updates across tabs
- **Keyboard shortcuts**: Navigate regions, save edits

---

## 8. ✨ Key Features

### Batch Processing

- **Multiple images per task**: Upload 1-100 images at once
- **Parallel processing**: Concurrent OCR jobs with queue management
- **Progress tracking**: Per-image status updates

### Concurrency Control

- **OCR queue**: `OCR_MAX_CONCURRENCY` (default: 7)
- **LLM queue**: `LLM_MAX_CONCURRENCY` (default: 2)
- **Request throttling**: Prevents service overload
- **Retry logic**: Failed jobs can be retried

### Real-time Updates

- **WebSocket status**: Live task/image status changes
- **Result streaming**: OCR results appear as completed
- **Multi-user sync**: All connected clients see updates
- **Event-driven UI**: React to server events automatically

### 3-Tier Text System

```
Priority 1: manual_text    (User edited)
Priority 2: corrected_text (LLM corrected)
Priority 3: original_text  (OCR raw output)
```

### Visual Editing

- **Click bbox to edit**: Direct manipulation of text regions
- **Line-based editing**: Auto-group words into lines
- **Confidence indicators**: Color-coded visual feedback
- **Zoom and pan**: Navigate large/dense documents

### Auto-grouping

- **Line detection**: Group words by Y-axis position (±5px)
- **Reading order**: Maintain left-to-right, top-to-bottom flow
- **Smart splitting**: Detect multi-column layouts

### Zoom Control

- **Auto-fit mode**: Scale image to viewport
- **Readable zoom**: Intelligent zoom for text density
  - Dense text (>100 regions): 1.5x zoom
  - Normal text: 1.0x zoom
- **Manual zoom**: User-controlled zoom level

### Audit Logging

- **System events tracked**:
  - Upload events
  - OCR start/complete/error
  - LLM start/complete/error
  - Manual edits
  - Task status changes
- **Event details**: Timestamp, user, action, metadata
- **Admin dashboard**: View all system logs

---

## 9. 🔧 Environment Variables

### OCR Service Configuration

```bash
# External OCR AI Service
OCR_AI_SERVICE_URL=http://192.168.210.26:5008/api/v2/ocr
OCR_AI_SERVICE_TOKEN=bearer_token_optional  # Optional authentication
OCR_MAX_CONCURRENCY=7                       # Max parallel OCR jobs
OCR_TIMEOUT_MS=60000                        # 60 seconds
```

### LLM Service Configuration

```bash
# External LLM Correction Service
LLM_SERVICE_URL=http://192.168.210.26:8052/chat
LLM_TIMEOUT_MS=600000                       # 10 minutes (600 seconds)
LLM_MAX_CONCURRENCY=2                       # Max parallel LLM jobs
NEXT_PUBLIC_LLM_MAX_CONCURRENCY=2          # Client-side setting
```

### WebSocket Configuration

```bash
# Socket.IO Gateway
NEXT_PUBLIC_WS_URL=http://localhost:4000   # Client WebSocket URL
WS_URL=http://localhost:4000                # Server WebSocket URL
WS_API_KEY=your_ws_api_key_here            # Optional API key
```

### Upload Configuration

```bash
# File Upload Settings
UPLOAD_DIR=./public/uploads                 # Local upload directory
UPLOAD_HOST=http://localhost:3000          # Public URL for uploads
MAX_FILE_SIZE=10485760                     # 10MB in bytes
ALLOWED_EXTENSIONS=jpg,jpeg,png,pdf        # Allowed file types
```

### Database Configuration

```bash
# PostgreSQL Connection
DATABASE_URL=postgresql://user:password@host:5432/ocr_editing
POSTGRES_USER=ocr_editing
POSTGRES_PASSWORD=your_password
POSTGRES_DB=ocr_editing
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

### Redis Configuration (Optional)

```bash
# Redis for Caching/Sessions
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

---

## 10. 🔄 Complete Processing Flow

### End-to-End Journey

```
📤 UPLOAD PHASE
User uploads images
  ↓
Files saved to /uploads/YYYY/MM/DD/
  ↓
Task created: INF_OCR_20251003_1
  ↓
Status: pending | Step: upload

⬇️

🔍 OCR PHASE
User clicks "Start OCR"
  ↓
For each image:
  - Status → processing
  - Send to OCR service
  - Parse text regions
  - Save to database
  - Status → completed
  ↓
Step: ocr → llm (if LLM enabled)
  ↓
Socket: task:result emitted

⬇️

🤖 LLM PHASE (Optional)
User clicks "Run LLM" or auto-triggered
  ↓
For each image:
  - LLM status → processing
  - Send text to LLM service
  - Receive corrections
  - Apply to text_regions
  - LLM status → completed
  ↓
Step: llm → completed
  ↓
Socket: llm:result emitted

⬇️

✏️ MANUAL EDIT PHASE (Optional)
User clicks on text region
  ↓
Edit line text
  ↓
Save manual_text to database
  ↓
UI updates instantly
  ↓
final_text recomputed

⬇️

📥 EXPORT PHASE
User clicks "Download"
  ↓
Generate output file:
  - Plain text (.txt)
  - JSON with metadata (.json)
  - PDF with layout (.pdf)
  ↓
Download to user's device

✅ COMPLETE
```

---

## 11. 🚀 API Endpoints Reference

### Upload & Tasks

| Endpoint                        | Method | Purpose                        |
| ------------------------------- | ------ | ------------------------------ |
| `/api/upload/image`             | POST   | Upload image files             |
| `/api/tasks`                    | POST   | Create new OCR task            |
| `/api/tasks`                    | GET    | List all tasks                 |
| `/api/tasks/{id}`               | GET    | Get task details               |
| `/api/tasks/{id}/group-results` | GET    | Get all results for task group |

### OCR Processing

| Endpoint           | Method | Purpose              |
| ------------------ | ------ | -------------------- |
| `/api/ocr/process` | POST   | Start OCR processing |
| `/api/ocr/retry`   | POST   | Retry failed OCR job |

### LLM Correction

| Endpoint                    | Method | Purpose               |
| --------------------------- | ------ | --------------------- |
| `/api/tasks/{id}/llm-start` | POST   | Start LLM correction  |
| `/api/tasks/{id}/llm-apply` | POST   | Apply LLM corrections |

### Manual Editing

| Endpoint                           | Method | Purpose                   |
| ---------------------------------- | ------ | ------------------------- |
| `/api/tasks/{id}/apply-line-edits` | POST   | Save manual line edits    |
| `/api/tasks/{id}/update-region`    | POST   | Update single text region |

### Configuration

| Endpoint          | Method | Purpose                |
| ----------------- | ------ | ---------------------- |
| `/api/config/ocr` | GET    | Get OCR service config |
| `/api/config/llm` | GET    | Get LLM service config |

---

## 12. 🗄️ Database Schema

### Core Tables

```sql
-- Parent task container
CREATE TABLE ocr_tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  step VARCHAR(20) DEFAULT 'upload',
  group_id VARCHAR(36),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Child image records
CREATE TABLE ocr_task_images (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES ocr_tasks(id),
  image_file_id INTEGER REFERENCES image_files(id),
  status VARCHAR(20) DEFAULT 'pending',
  llm_status VARCHAR(20) DEFAULT 'pending',
  llm_started_at TIMESTAMPTZ,
  llm_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- File metadata
CREATE TABLE image_files (
  id SERIAL PRIMARY KEY,
  uuid VARCHAR(36) UNIQUE NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  original_name VARCHAR(255),
  mime_type VARCHAR(100),
  size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- OCR results
CREATE TABLE ocr_results (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES ocr_tasks(id),
  task_image_id INTEGER REFERENCES ocr_task_images(id),
  extracted_text TEXT,
  corrected_text TEXT,
  final_text TEXT,
  avg_confidence DECIMAL(5,4),
  text_count INTEGER,
  processing_time_seconds INTEGER,
  llm_spelling JSONB DEFAULT '[]',
  llm_extracted_info JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Text regions (word/bbox data)
CREATE TABLE text_regions (
  id SERIAL PRIMARY KEY,
  ocr_result_id INTEGER REFERENCES ocr_results(id),
  text VARCHAR(500),
  original_text VARCHAR(500),
  corrected_text VARCHAR(500),
  manual_text VARCHAR(500),
  bbox_x1 INTEGER,
  bbox_y1 INTEGER,
  bbox_x2 INTEGER,
  bbox_y2 INTEGER,
  bbox_width INTEGER,
  bbox_height INTEGER,
  confidence DECIMAL(5,4),
  region_index INTEGER,
  is_edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 13. 🎯 Best Practices

### For Developers

1. **Always use transactions** when updating multiple text regions
2. **Emit socket events** after database changes for real-time sync
3. **Log system events** for debugging and audit trails
4. **Handle timeouts gracefully** with proper error messages
5. **Validate file types** before processing to avoid errors

### For Users

1. **Upload clear images** for best OCR accuracy
2. **Use LLM correction** for Vietnamese text improvement
3. **Review low-confidence regions** (highlighted in red)
4. **Save frequently** when making manual edits
5. **Check final output** before exporting

### Performance Optimization

1. **Adjust concurrency** based on server resources
2. **Use Redis caching** for frequently accessed data
3. **Optimize image sizes** before upload (max 10MB)
4. **Enable compression** for API responses
5. **Monitor timeout values** and adjust as needed

---

## 14. 🐛 Troubleshooting

### Common Issues

#### OCR Service Returns 500 Error

- **Cause**: External AI service is down or overloaded
- **Solution**: Check `OCR_AI_SERVICE_URL` and service logs
- **Workaround**: Increase `OCR_TIMEOUT_MS` or reduce concurrency

#### LLM Processing Fails

- **Cause**: LLM service timeout or invalid response
- **Solution**: Check `LLM_SERVICE_URL` endpoint health
- **Workaround**: Retry individual images, increase `LLM_TIMEOUT_MS`

#### WebSocket Not Connecting

- **Cause**: `WS_URL` misconfigured or gateway offline
- **Solution**: Verify WebSocket gateway is running
- **Workaround**: Manually refresh page to poll updates

#### Images Not Displaying

- **Cause**: `UPLOAD_HOST` incorrect or files missing
- **Solution**: Check file paths in `image_files` table
- **Workaround**: Verify `UPLOAD_DIR` has correct permissions

---

## 15. 📈 Future Enhancements

### Planned Features

- [ ] **PDF support**: Multi-page PDF processing
- [ ] **Batch export**: Download multiple tasks at once
- [ ] **Custom templates**: Pre-defined export formats
- [ ] **Advanced LLM**: Fine-tuned models for domain-specific text
- [ ] **Mobile app**: iOS/Android OCR scanning
- [ ] **API webhooks**: External integrations
- [ ] **Version control**: Track edit history per region
- [ ] **Collaborative editing**: Multi-user real-time editing

---

## 16. 📚 Additional Resources

### Related Documentation

- [User Guide](../UserGuide.md) - End-user documentation
- [API Reference](./API_REFERENCE.md) - Detailed API specs
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment

### External Services

- [OCR AI Service Documentation](https://ocr-service-docs.example.com)
- [LLM Service API](https://llm-service-docs.example.com)
- [Socket.IO Documentation](https://socket.io/docs/)

---

## 📝 Summary

The OCR processing system provides a complete pipeline from image upload to final text output:

**Upload → OCR → (Optional LLM) → Manual Edit → Export** 🚀

Key advantages:

- ✅ **High accuracy**: AI-powered OCR + LLM correction
- ✅ **User control**: Manual editing with visual feedback
- ✅ **Real-time**: Live updates via WebSocket
- ✅ **Scalable**: Batch processing with concurrency control
- ✅ **Flexible**: 3-tier text priority system
- ✅ **Auditable**: Complete event logging

---

**Last Updated**: October 3, 2025  
**Version**: 1.0.0  
**Maintainer**: OCR Editing Team
