<script lang="ts">
import { defineComponent } from "vue";
import type { ItinerarySearchResponseDto } from "@/api";

interface Comment {
  id: number;
  userName: string;
  text: string;
  timestamp: Date;
}

interface ItineraryWithInteractions extends ItinerarySearchResponseDto {
  imageUrl?: string;
  likes?: number;
  isLiked?: boolean;
  comments?: Comment[];
  showAllComments?: boolean;
}

export default defineComponent({
  name: 'ItineraryFeed',
  props: {
    itineraries: {
      type: Array as () => ItinerarySearchResponseDto[],
      default: () => []
    }
  },
  data() {
    return {
      feedItems: [] as ItineraryWithInteractions[],
      newCommentText: {} as Record<number, string>,
      // Mock Bilder für Destinationen
      mockImages: [
        'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
        'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800',
        'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800',
        'https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=800',
        'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800',
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800',
      ]
    }
  },
  watch: {
    itineraries: {
      immediate: true,
      handler(newItineraries: ItinerarySearchResponseDto[]) {
        this.feedItems = newItineraries.map((item, index) => ({
          ...item,
          imageUrl: this.mockImages[index % this.mockImages.length],
          likes: Math.floor(Math.random() * 100) + 5,
          isLiked: false,
          comments: this.generateMockComments(),
          showAllComments: false
        }));
      }
    }
  },
  methods: {
    generateMockComments(): Comment[] {
      const comments: Comment[] = [];
      const numComments = Math.floor(Math.random() * 5);
      const users = ['Anna Schmidt', 'Max Mueller', 'Lisa Weber', 'Tom Fischer', 'Sarah Klein'];
      const texts = [
        'Looks amazing! 😍',
        'I want to go there too!',
        'Great destination choice!',
        'Beautiful place! ✨',
        'Added to my bucket list!'
      ];

      for (let i = 0; i < numComments; i++) {
        comments.push({
          id: Date.now() + i,
          userName: users[i % users.length] || 'Anonymous',
          text: texts[i % texts.length] || 'Nice!',
          timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        });
      }

      return comments;
    },

    toggleLike(item: ItineraryWithInteractions) {
      if (item.isLiked) {
        // Unlike
        item.isLiked = false;
        item.likes = Math.max(0, (item.likes || 0) - 1);
      } else {
        // Like
        item.isLiked = true;
        item.likes = (item.likes || 0) + 1;
      }
      // TODO: Backend API call
    },

    addComment(item: ItineraryWithInteractions, index: number) {
      const commentText = this.newCommentText[index];
      if (commentText && commentText.trim()) {
        const comment: Comment = {
          id: Date.now(),
          userName: 'You',
          text: commentText.trim(),
          timestamp: new Date()
        };

        if (!item.comments) {
          item.comments = [];
        }
        item.comments.unshift(comment);
        this.newCommentText[index] = '';

        // TODO: Backend API call
      }
    },

    toggleComments(item: ItineraryWithInteractions) {
      item.showAllComments = !item.showAllComments;
    },

    formatTimeAgo(date: Date): string {
      const now = new Date();
      const diffMs = now.getTime() - new Date(date).getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m`;

      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h`;

      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`;

      return `${Math.floor(diffDays / 30)}mo`;
    },

    formatDate(d: string | Date | null | undefined): string {
      if (!d) return '';
      const date = d instanceof Date ? d : new Date(d);
      if (isNaN(date.getTime())) return '';
      return new Intl.DateTimeFormat(
        navigator.language || 'de-DE',
        { dateStyle: 'medium' }
      ).format(date);
    }
  }
})
</script>

<template>
  <div class="itinerary-feed">
    <!-- Feed Items -->
    <v-container class="py-4">
      <v-row justify="center">
        <v-col cols="12" md="8" lg="6">
          <v-card
            v-for="(item, index) in feedItems"
            :key="index"
            class="mb-6 feed-card"
            elevation="2"
          >
            <!-- Header -->
            <v-card-title class="pa-3">
              <div class="d-flex align-center mb-2">
                <v-avatar color="primary" size="40" class="mr-3">
                  <v-icon>mdi-account-circle</v-icon>
                </v-avatar>
                <div class="flex-grow-1">
                  <div class="text-subtitle-1 font-weight-bold">{{ item.userName }}</div>
                  <div class="text-caption text-medium-emphasis d-flex align-center">
                    <v-icon size="x-small" class="mr-1">mdi-map-marker</v-icon>
                    {{ item.destination }}
                  </div>
                </div>
              </div>
            </v-card-title>

            <!-- Title Header -->
            <div class="px-4 pt-3 pb-3">
              <div class="text-h5 font-weight-bold">
                {{ item.title }}
              </div>
            </div>

            <!-- Image -->
            <v-img
              :src="item.imageUrl"
              height="400"
              cover
              class="feed-image"
            >
              <template v-slot:placeholder>
                <v-row class="fill-height ma-0" align="center" justify="center">
                  <v-progress-circular indeterminate color="primary"></v-progress-circular>
                </v-row>
              </template>
            </v-img>

            <!-- Action Bar -->
            <v-card-actions class="px-3 py-2">
              <v-btn
                :icon="false"
                :color="item.isLiked ? 'pink' : 'default'"
                @click="toggleLike(item)"
                size="large"
                variant="text"
                class="px-2"
              >
                <v-icon :icon="item.isLiked ? 'mdi-heart' : 'mdi-heart-outline'" class="mr-1"></v-icon>
                <span class="text-body-2">{{ item.likes }}</span>
              </v-btn>
              <v-btn
                :icon="false"
                @click="toggleComments(item)"
                size="large"
                variant="text"
                class="px-2"
              >
                <v-icon icon="mdi-comment-outline" class="mr-1"></v-icon>
                <span class="text-body-2">{{ item.comments?.length || 0 }}</span>
              </v-btn>
            </v-card-actions>

            <!-- Content -->
            <v-card-text class="px-4 py-3">
              <div class="text-body-1 description-text">
                {{ item.shortDescription }}
              </div>
            </v-card-text>

            <!-- Comments -->
            <div v-if="item.comments && item.comments.length > 0" class="px-4 pb-2">
              <!-- View all comments button -->
              <v-btn
                v-if="!item.showAllComments && item.comments.length > 2"
                variant="text"
                size="small"
                class="px-0 text-caption text-medium-emphasis"
                @click="toggleComments(item)"
              >
                View all {{ item.comments.length }} comments
              </v-btn>

              <!-- Comments List -->
              <div v-if="item.showAllComments || item.comments.length <= 2">
                <div
                  v-for="comment in item.showAllComments ? item.comments : item.comments.slice(0, 2)"
                  :key="comment.id"
                  class="mb-2"
                >
                  <span class="font-weight-bold text-body-2">{{ comment.userName }}</span>
                  <span class="text-body-2 ml-2">{{ comment.text }}</span>
                  <span class="text-caption text-medium-emphasis ml-2">
                    {{ formatTimeAgo(comment.timestamp) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Add Comment -->
            <v-divider></v-divider>
            <div class="px-4 py-3">
              <v-text-field
                v-model="newCommentText[index]"
                placeholder="Add a comment..."
                variant="plain"
                density="compact"
                hide-details
                @keyup.enter="addComment(item, index)"
              >
                <template v-slot:append>
                  <v-btn
                    v-if="newCommentText[index]"
                    variant="text"
                    color="primary"
                    size="small"
                    @click="addComment(item, index)"
                  >
                    Post
                  </v-btn>
                </template>
              </v-text-field>
            </div>
          </v-card>

          <!-- Empty State -->
          <v-card v-if="feedItems.length === 0" class="pa-8 text-center">
            <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-image-off-outline</v-icon>
            <div class="text-h6 text-medium-emphasis mb-2">No itineraries found</div>
            <div class="text-body-2 text-medium-emphasis">
              Searcg for travel inspiration from other travelers
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
.itinerary-feed {
  background-color: #fafafa;
  min-height: 100vh;
}

.feed-card {
  border-radius: 16px !important;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.feed-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.feed-image {
  cursor: pointer;
  transition: transform 0.3s ease, filter 0.3s ease;
}

.feed-image:hover {
  transform: scale(1.02);
  filter: brightness(1.05);
}

.feed-title {
  font-weight: 500;
}

/* Instagram-like styling */
:deep(.v-card-title) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

:deep(.v-card-actions) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
</style>
