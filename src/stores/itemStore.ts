import { defineStore } from 'pinia';
import { orderBy } from 'lodash-es';

import { itemApi } from '@/api/itemApi';
import { ItemStatus } from '@/constants/item';
import { FORM_MESSAGES } from '@/constants/messages';
import type { Item, ItemDraft } from '@/models/item';
import { message } from '@/utils/message';
import { validateItemDraft } from '@/utils/validators';
import { useExchangeStore } from './exchangeStore';

export type ItemSortBy = 'latest' | 'hot';

export const calculateItemHotness = (viewCount: number, requestCount: number): number => {
  return viewCount * 1 + requestCount * 10;
};

export const useItemStore = defineStore('items', {
  state: () => ({
    items: [] as Item[],
    keyword: '',
    category: '全部',
    statusFilter: ItemStatus.AVAILABLE as ItemStatus,
    sortBy: 'latest' as ItemSortBy,
    loading: false,
  }),
  getters: {
    visibleItems: (state) => {
      const exchangeStore = useExchangeStore();
      const filtered = state.items.filter((item) => {
        const categoryMatched = state.category === '全部' || item.category === state.category;
        const keywordMatched = `${item.title}${item.description}${item.location}`
          .toLowerCase()
          .includes(state.keyword.toLowerCase());
        return categoryMatched && keywordMatched && item.status === state.statusFilter;
      });

      if (state.sortBy === 'hot') {
        return orderBy(
          filtered,
          [(item) => calculateItemHotness(item.view_count, exchangeStore.requestCountForItem(item.id))],
          ['desc'],
        );
      }
      return orderBy(filtered, ['created_at'], ['desc']);
    },
    myItems: (state) => (userId: string) => state.items.filter((item) => item.user_id === userId),
    availableMyItems: (state) => (userId: string) =>
      state.items.filter((item) => item.user_id === userId && item.status === ItemStatus.AVAILABLE),
    hotnessOf: () => (item: Item) => {
      const exchangeStore = useExchangeStore();
      return calculateItemHotness(item.view_count, exchangeStore.requestCountForItem(item.id));
    },
    requestCountOf: () => (itemId: string) => {
      const exchangeStore = useExchangeStore();
      return exchangeStore.requestCountForItem(itemId);
    },
  },
  actions: {
    async hydrate() {
      this.loading = true;
      try {
        this.items = await itemApi.list();
      } finally {
        this.loading = false;
      }
    },
    async publish(draft: ItemDraft) {
      const error = validateItemDraft(draft);
      if (error) {
        message(error, 'error');
        return null;
      }
      const item = await itemApi.create({
        user_id: draft.user_id,
        title: draft.title,
        description: draft.description,
        category: draft.category,
        condition: draft.condition,
        images: [...draft.images],
        location: draft.location,
        status: ItemStatus.AVAILABLE,
      });
      this.items = await itemApi.list();
      message('物品已发布，等待合适的交换', 'success');
      return item;
    },
    async offline(itemId: string) {
      await itemApi.setStatus(itemId, ItemStatus.OFFLINE);
      this.items = await itemApi.list();
      message('物品已下架', 'success');
    },
    assertCanExchange(userId: string) {
      const ownItems = this.availableMyItems(userId);
      if (!ownItems.length) {
        message(FORM_MESSAGES.exchangeNeedOwnItem, 'error');
        return false;
      }
      return true;
    },
  },
});
