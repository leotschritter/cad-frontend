<script lang="ts">
import { defineComponent } from "vue";
import type { ItinerarySearchResponseDto, CommentDto, LikeDto } from "@/api";
import { getApi } from "@/services/api";
import { useAuthStore } from "@/stores/auth";
import TripViewReadOnly from "@/components/TripViewReadOnly.vue";

interface Comment {
  id: string;
  userName: string;
  userEmail: string;
  text: string;
  timestamp: Date;
}

interface ItineraryWithInteractions extends ItinerarySearchResponseDto {
  itineraryId?: number;
  imageUrls?: string[];
  likes?: number;
  isLiked?: boolean;
  comments?: Comment[];
  showAllComments?: boolean;
}

export default defineComponent({
  name: 'ItineraryFeed',
  components: {TripViewReadOnly},
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
      likeApi: getApi('LikeManagementApi'),
      commentApi: getApi('CommentManagementApi'),
      locationApi: getApi('LocationManagementApi'),
      authStore: useAuthStore(),
      placeholderImage: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80',
      detailsItinerary: null as ItinerarySearchResponseDto | null,
    }
  },
  watch: {
    itineraries: {
      immediate: true,
      async handler(newItineraries: ItinerarySearchResponseDto[]) {
        this.feedItems = newItineraries.map((item) => ({
          ...item,
          itineraryId: item.id, // Mappe id zu itineraryId
          imageUrls: [],
          likes: 0,
          isLiked: false,
          comments: [],
          showAllComments: false
        }));

        // Lade die echten Like-Daten, Kommentare und Bilder für alle Itineraries
        await this.loadLikesForAllItems();
        await this.loadCommentsForAllItems();
        await this.loadImagesForAllItems();
      }
    }
  },
  methods: {
    async loadLikesForAllItems() {
      if (!this.authStore.user?.email) return;

      try {
        // Lade alle Likes des aktuellen Users
        const userLikes = await this.likeApi.likeUserUserEmailGet({
          userEmail: this.authStore.user.email
        });

        // Lade Like-Count für jede Itinerary
        for (const item of this.feedItems) {
          if (item.itineraryId) {
            try {
              const likeResponse = await this.likeApi.likeItineraryItineraryIdGet({
                itineraryId: item.itineraryId
              });
              item.likes = likeResponse.likeCount || 0;

              // Prüfe, ob der User diese Itinerary geliked hat
              item.isLiked = userLikes.some((like: LikeDto) => like.itineraryId === item.itineraryId);
            } catch (err) {
              console.error(`Failed to load likes for itinerary ${item.itineraryId}:`, err);
              item.likes = 0;
              item.isLiked = false;
            }
          }
        }
      } catch (err) {
        console.error('Failed to load user likes:', err);
      }
    },

    async loadCommentsForAllItems() {
      for (const item of this.feedItems) {
        if (item.itineraryId) {
          try {
            const commentsFromApi = await this.commentApi.commentItineraryItineraryIdGet({
              itineraryId: item.itineraryId
            });

            // Konvertiere API-Kommentare zu lokalem Format und sortiere nach Zeitpunkt (älteste zuerst)
            item.comments = commentsFromApi
              .map((comment: CommentDto) => ({
                id: comment.id || '',
                userName: comment.userEmail?.split('@')[0] || 'Anonymous',
                userEmail: comment.userEmail || '',
                text: comment.comment || '',
                timestamp: comment.createdAt ? new Date(comment.createdAt) : new Date()
              }))
              .sort((a: Comment, b: Comment) => a.timestamp.getTime() - b.timestamp.getTime());

          } catch (err) {
            console.error(`Failed to load comments for itinerary ${item.itineraryId}:`, err);
            item.comments = [];
          }
        }
      }
    },

    async loadImagesForAllItems() {
      for (const item of this.feedItems) {
        if (item.itineraryId) {
          try {
            const locations = await this.locationApi.locationItineraryItineraryIdGet({
              itineraryId: item.itineraryId
            });

            // Sammle alle Bilder aus allen Locations
            const allImages: string[] = [];
            for (const location of locations) {
              if (location.imageUrls && location.imageUrls.length > 0) {
                allImages.push(...location.imageUrls);
              }
            }

            // Setze die echten Bilder oder Platzhalterbild wenn keine vorhanden
            if (allImages.length > 0) {
              item.imageUrls = allImages;
            } else {
              item.imageUrls = [this.placeholderImage];
            }

          } catch (err) {
            console.error(`Failed to load images for itinerary ${item.itineraryId}:`, err);
            // Fallback zum Platzhalterbild bei Fehler
            item.imageUrls = [this.placeholderImage];
          }
        }
      }
    },

    async toggleLike(item: ItineraryWithInteractions) {
      if (!this.authStore.user?.email) {
        console.error('User must be logged in to like');
        return;
      }

      if (!item.itineraryId) {
        console.error('Itinerary ID is missing');
        return;
      }

      const previousLikeState = item.isLiked;
      const previousLikeCount = item.likes || 0;

      try {
        if (item.isLiked) {
          // Unlike
          item.isLiked = false;
          item.likes = Math.max(0, (item.likes || 0) - 1);

          await this.likeApi.likeItineraryItineraryIdDelete({
            itineraryId: item.itineraryId,
            userEmail: this.authStore.user.email
          });

          console.log(`Unliked itinerary ${item.itineraryId}`);
        } else {
          // Like
          item.isLiked = true;
          item.likes = (item.likes || 0) + 1;

          await this.likeApi.likeItineraryItineraryIdPost({
            itineraryId: item.itineraryId,
            userEmail: this.authStore.user.email
          });

          console.log(`Liked itinerary ${item.itineraryId}`);
        }
      } catch (err) {
        // Bei Fehler: Vorherigen Zustand wiederherstellen
        console.error('Failed to toggle like:', err);
        item.isLiked = previousLikeState;
        item.likes = previousLikeCount;

        // Optional: Zeige Fehlermeldung an
        const error = err as { response?: { status?: number } };
        if (error?.response?.status === 409) {
          console.warn('Like already exists or was already removed');
        }
      }
    },

    async addComment(item: ItineraryWithInteractions, index: number) {
      const commentText = this.newCommentText[index];
      if (!commentText || !commentText.trim()) {
        return;
      }

      if (!this.authStore.user?.email) {
        console.error('User must be logged in to comment');
        return;
      }

      if (!item.itineraryId) {
        console.error('Itinerary ID is missing');
        return;
      }

      try {
        // Sende Kommentar an Backend
        const newComment = await this.commentApi.commentItineraryItineraryIdPost({
          itineraryId: item.itineraryId,
          commentRequest: {
            userEmail: this.authStore.user.email,
            comment: commentText.trim()
          }
        });

        // Füge den neuen Kommentar zur Liste hinzu
        const comment: Comment = {
          id: newComment.id || '',
          userName: this.authStore.user.name || this.authStore.user.email?.split('@')[0] || 'Anonymous',
          userEmail: newComment.userEmail || '',
          text: newComment.comment || '',
          timestamp: newComment.createdAt ? new Date(newComment.createdAt) : new Date()
        };

        if (!item.comments) {
          item.comments = [];
        }

        // Füge neuen Kommentar am Ende hinzu (da wir älteste zuerst sortieren)
        item.comments.push(comment);
        this.newCommentText[index] = '';

        console.log(`Comment added to itinerary ${item.itineraryId}`);
      } catch (err) {
        console.error('Failed to add comment:', err);
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

    openTripDetailsDialog(itineraryId: number): void {
      this.detailsItinerary = this.itineraries.find((itinerary) => itinerary.id === itineraryId) ?? null;
    },
    closeTripDetailsDialog(): void {
      this.detailsItinerary = null;
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

            <!-- Image Carousel -->
            <v-carousel
              height="400"
              hide-delimiters
              show-arrows="hover"
              cycle
              interval="5000"
              @click="openTripDetailsDialog(item.itineraryId)"
            >
              <v-carousel-item
                v-for="(image, imgIndex) in item.imageUrls"
                :key="imgIndex"
                :src="image"
                cover
              >
                <template v-slot:placeholder>
                  <v-row class="fill-height ma-0" align="center" justify="center">
                    <v-progress-circular indeterminate color="primary"></v-progress-circular>
                  </v-row>
                </template>
              </v-carousel-item>
            </v-carousel>

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
    <v-dialog v-model="detailsItinerary" max-width="90vw" persistent>
      <v-card style="max-height: 90vh;">
        <v-card-title class="text-h6 bg-primary d-flex align-center">
          <v-icon class="mr-2">mdi-map-marker-path</v-icon>
          Show Locations - {{ detailsItinerary?.title || '' }}
          <v-chip v-if="detailsItinerary?.destination" size="small" class="ml-3" variant="tonal">
            {{ detailsItinerary.destination }}
          </v-chip>
        </v-card-title>
        <v-card-text class="pa-4" style="height: calc(90vh - 140px); overflow-y: auto;">
          <TripViewReadOnly
              :itinerary-id="detailsItinerary?.id"
              :short-description="detailsItinerary?.shortDescription"
              @cancel="closeTripDetailsDialog"
          />
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer/>
          <v-btn variant="text" size="large" @click="closeTripDetailsDialog">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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

/* Carousel styling */
:deep(.v-carousel) {
  border-radius: 0;
}

:deep(.v-carousel__controls) {
  background: transparent;
}

:deep(.v-btn--icon) {
  background-color: rgba(255, 255, 255, 0.8);
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
