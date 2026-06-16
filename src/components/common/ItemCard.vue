<template>
  <RouterLink class="item-card" :class="hotnessClass" :to="`/item/${item.id}`">
    <ItemImageGallery :images="item.images" :fallback-text="item.category" />
    <div class="item-card__body">
      <div class="item-card__topline">
        <span class="pill">{{ item.category }}</span>
        <span class="status-pill" :class="statusToneClass(item.status)">{{ formatItemStatus(item.status) }}</span>
      </div>
      <h3>{{ item.title }}</h3>
      <p>{{ item.description }}</p>
      <div class="item-card__meta">
        <span>{{ item.location }}</span>
        <span>{{ formatCondition(item.condition) }}</span>
      </div>
      <div class="item-card__stats">
        <span class="hotness-pill" :class="hotnessPillClass">{{ hotnessLabel }}</span>
        <span class="stat-mini">👁 {{ item.view_count }}</span>
        <span class="stat-mini">🔄 {{ requestCount }}</span>
      </div>
      <div class="item-card__owner">
        <span v-if="owner">{{ owner.nickname }}</span>
        <span v-if="isMine" class="mine">我的</span>
      </div>
    </div>
  </RouterLink>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import type { Item } from '@/models/item';
import type { User } from '@/models/user';
import { useAuthStore } from '@/stores/authStore';
import { useItemStore } from '@/stores/itemStore';
import { useThemeStore } from '@/stores/themeStore';
import {
  formatCondition,
  formatHotness,
  formatItemStatus,
  getHotnessLevel,
  statusToneClass,
} from '@/utils/formatters';

import ItemImageGallery from './ItemImageGallery.vue';

const props = defineProps<{
  item: Item;
  owner?: User;
}>();

const authStore = useAuthStore();
const itemStore = useItemStore();
useThemeStore();
const isMine = computed(() => authStore.currentUser?.id === props.item.user_id);
const hotness = computed(() => itemStore.hotnessOf(props.item));
const hotnessLevel = computed(() => getHotnessLevel(hotness.value));
const hotnessLabel = computed(() => formatHotness(hotness.value));
const requestCount = computed(() => itemStore.requestCountOf(props.item.id));
const hotnessClass = computed(() => {
  const level = hotnessLevel.value;
  if (level === 'super') return 'item-card--super-hot';
  if (level === 'hot') return 'item-card--hot';
  if (level === 'warm') return 'item-card--warm';
  return '';
});
const hotnessPillClass = computed(() => {
  const level = hotnessLevel.value;
  if (level === 'super') return 'hotness-super';
  if (level === 'hot') return 'hotness-hot';
  if (level === 'warm') return 'hotness-warm';
  if (level === 'mild') return 'hotness-mild';
  return 'hotness-cold';
});
</script>
