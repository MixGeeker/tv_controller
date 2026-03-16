<script setup lang="ts">
import { ref } from 'vue'
import { useController } from '../composables/useController'
import HudPanel from './ui/HudPanel.vue'
import HudButton from './ui/HudButton.vue'
import HudModal from './ui/HudModal.vue'

const {
  mediaLibrary,
  selectedMediaId,
  loading,
  uploadForm,
  urlForm,
  mediaCountLabel,
  formatDate,
  onUploadSelected,
  handleUpload: originalHandleUpload,
  handleRegisterUrl: originalHandleRegisterUrl,
} = useController()

const showAddMedia = ref(false)
const activeTab = ref<'upload' | 'url'>('upload')

const handleUpload = async () => {
  await originalHandleUpload()
  if (!loading.upload) {
    showAddMedia.value = false
  }
}

const handleRegisterUrl = async () => {
  await originalHandleRegisterUrl()
  if (!loading.register) {
    showAddMedia.value = false
  }
}
</script>

<template>
  <HudPanel kicker="MEDIA" title="媒体库">
    <template #headerRight>
      <span class="media-badge">{{ mediaCountLabel }}</span>
      <HudButton variant="primary" @click="showAddMedia = true">
        新增媒体
      </HudButton>
    </template>

    <div class="media-library">
      <div v-if="mediaLibrary.length === 0" class="media-empty">
        暂无媒体，请点击右上角「新增媒体」。
      </div>
      <div v-else class="media-library__list">
        <button
          v-for="asset in mediaLibrary"
          :key="asset.id"
          class="media-item"
          :class="{ 'media-item--selected': asset.id === selectedMediaId }"
          @click="selectedMediaId = asset.id"
        >
          <span class="media-item__type" :class="asset.type === 'video' ? 'type--video' : 'type--image'">
            {{ asset.type === 'video' ? 'VID' : 'IMG' }}
          </span>
          <div class="media-item__info">
            <strong>{{ asset.title || asset.id }}</strong>
            <p>{{ asset.contentType }} · {{ asset.sourceType === 'upload' ? '本地' : '远程' }} · {{ formatDate(asset.createdAt) }}</p>
          </div>
        </button>
      </div>
    </div>
  </HudPanel>

  <!-- 新增媒体模态框 -->
  <HudModal
    v-model:show="showAddMedia"
    kicker="ADD MEDIA"
    title="新增媒体"
  >
    <div class="media-tabs">
      <button 
        class="media-tab" 
        :class="{ 'media-tab--active': activeTab === 'upload' }"
        @click="activeTab = 'upload'"
      >
        本地上传
      </button>
      <button 
        class="media-tab" 
        :class="{ 'media-tab--active': activeTab === 'url' }"
        @click="activeTab = 'url'"
      >
        远程 URL
      </button>
    </div>

    <div class="media-forms-container">
      <form v-if="activeTab === 'upload'" class="media-form" @submit.prevent="handleUpload">
        <label class="hud-field">
          <span>文件</span>
          <input type="file" accept="video/mp4,image/*" @change="onUploadSelected" />
        </label>
        <label class="hud-field">
          <span>标题</span>
          <input v-model="uploadForm.title" type="text" placeholder="欢迎视频" />
        </label>
        <label class="hud-field">
          <span>类型</span>
          <select v-model="uploadForm.type">
            <option value="video">视频</option>
            <option value="image">图片</option>
          </select>
        </label>
      </form>

      <form v-if="activeTab === 'url'" class="media-form" @submit.prevent="handleRegisterUrl">
        <label class="hud-field">
          <span>地址</span>
          <input v-model="urlForm.url" type="url" placeholder="http://..." />
        </label>
        <label class="hud-field">
          <span>Content-Type</span>
          <input v-model="urlForm.contentType" type="text" placeholder="video/mp4" />
        </label>
        <label class="hud-field">
          <span>标题</span>
          <input v-model="urlForm.title" type="text" placeholder="ERP 下发素材" />
        </label>
        <label class="hud-field">
          <span>缩略图</span>
          <input v-model="urlForm.thumbnailUrl" type="url" placeholder="可选" />
        </label>
        <label class="hud-field">
          <span>类型</span>
          <select v-model="urlForm.type">
            <option value="video">视频</option>
            <option value="image">图片</option>
          </select>
        </label>
      </form>
    </div>

    <template #footer>
      <HudButton variant="ghost" @click="showAddMedia = false">取消</HudButton>
      <HudButton 
        v-if="activeTab === 'upload'" 
        variant="primary" 
        :disabled="loading.upload" 
        @click="handleUpload"
      >
        {{ loading.upload ? '上传中...' : '开始上传' }}
      </HudButton>
      <HudButton 
        v-if="activeTab === 'url'" 
        variant="warn" 
        :disabled="loading.register" 
        @click="handleRegisterUrl"
      >
        {{ loading.register ? '登记中...' : '登记 URL' }}
      </HudButton>
    </template>
  </HudModal>
</template>

<style scoped>
.media-badge {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  padding: 3px 10px;
  background: var(--accent-dim);
  border: 1px solid var(--border-bright);
  color: var(--accent);
}

.media-library {
  display: grid;
  gap: 6px;
}

.media-empty {
  padding: 16px;
  text-align: center;
  font-size: 0.82rem;
  color: var(--text-muted);
  border: 1px dashed var(--border);
  background: rgba(0, 0, 0, 0.2);
}

.media-library__list {
  display: grid;
  gap: 4px;
  /* 增加媒体列表的高度，因为表单被移除了 */
  max-height: 480px; 
  overflow-y: auto;
}

.media-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 10px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
}

.media-item:hover {
  background: var(--bg-card-hover);
  border-color: var(--border-bright);
}

.media-item--selected {
  background: var(--bg-card-selected);
  border-color: var(--accent);
}

.media-item__type {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  letter-spacing: 0.08em;
  padding: 2px 6px;
  border: 1px solid;
  flex-shrink: 0;
}

.type--video {
  color: var(--accent);
  border-color: rgba(0, 212, 255, 0.3);
}

.type--image {
  color: var(--warn);
  border-color: rgba(255, 149, 0, 0.3);
}

.media-item__info {
  min-width: 0;
}

.media-item__info strong {
  font-size: 0.85rem;
  color: var(--text-bright);
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.media-item__info p {
  font-size: 0.72rem;
  color: var(--text-dim);
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 模态框样式 */
.media-tabs {
  display: flex;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--border);
}

.media-tab {
  flex: 1;
  padding: 12px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-dim);
  font-weight: 500;
  transition: all 0.2s;
}

.media-tab:hover {
  color: var(--text-bright);
  background: rgba(0, 212, 255, 0.05);
}

.media-tab--active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

.media-forms-container {
  min-height: 250px;
}

.media-form {
  display: grid;
  gap: 16px;
}

.hud-field {
  display: grid;
  gap: 6px;
}

.hud-field span {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-dim);
}
</style>
