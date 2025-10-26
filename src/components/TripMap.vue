<template>
  <div class="map-wrapper" :class="{ expanded: isExpanded }">
    <!-- Toolbar with maximize/minimize button -->
    <div class="map-toolbar">
      <v-btn class="map-btn" @click="toggleExpand" variant="flat" :prepend-icon="isExpanded ? 'mdi-window-minimize' : 'mdi-window-maximize'">
        {{ isExpanded ? 'Minimize' : 'Maximize' }}
      </v-btn>
    </div>

    <div ref="mapEl" class="map-el"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import 'leaflet/dist/leaflet.css'
import * as L from 'leaflet'
import type { Destination } from './TripView.vue'

// Fix marker icon paths in bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png?url'
import markerIcon   from 'leaflet/dist/images/marker-icon.png?url'
import markerShadow from 'leaflet/dist/images/marker-shadow.png?url'

delete (L.Icon.Default.prototype as any)._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

export default defineComponent({
  name: 'TripMap',
  components: {},
  props: {
    destinations: {
      type: Array as () => Destination[],
      required: true,
    },
  },
  data() {
    return {
      map: null as L.Map | null,
      markers: [] as L.Marker[],
      polyline: null as L.Polyline | null,
      isExpanded: false,
      iconCache: {} as Record<number, L.Icon>,
    }
  },
  computed: {
    withCoords(): Destination[] {
      return (this.destinations ?? []).filter(
          d => typeof d.lat === 'number' && typeof d.lng === 'number'
      )
    },
  },
  mounted() {
    this.initMap()
    window.addEventListener('resize', this.onResize, { passive: true })
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.onResize)
    this.map?.remove()
    this.map = null
  },
  watch: {
    destinations: {
      handler() {
        // re-render markers and route on any order/coord change
        if (!this.map) {
          // initialize if not yet
          this.$nextTick(() => { this.initMap(); this.renderAll() })
        } else {
          this.renderAll()
        }
      },
      deep: true,
    },
  },
  methods: {
    initMap() {
      if (this.map) return
      const el = this.$refs.mapEl as HTMLDivElement | undefined
      if (!el) return

      this.map = L.map(el, {
        zoomControl: true,
        center: [46.0, 11.0], // fallback (N. Italy)
        zoom: 6,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(this.map)

      this.renderAll()

      // In flex layouts size can change after mount
      requestAnimationFrame(() => {
        this.map?.invalidateSize()
      })
    },
    renderAll() {
      if (!this.map) return

      // clear old layers
      this.markers.forEach(m => m.remove())
      this.markers = []
      this.polyline?.remove()
      this.polyline = null

      // markers
     /* this.withCoords.forEach((d, i) => {
        // const m = L.marker([d.lat as number, d.lng as number]).addTo(this.map!)
        const m = L.marker([d.lat as number, d.lng as number], {
          icon: this.makeNumberedIcon(i + 1),
        }).addTo(this.map!)

        m.bindPopup(
            `<div style="min-width:160px">
             <div><strong>${this.escapeHtml(d.name || `Stop ${i + 1}`)}</strong></div>
             ${d.address ? `<div class="text-caption">${this.escapeHtml(d.address)}</div>` : ''}
             <div class="text-caption">${this.escapeHtml(d.start)} – ${this.escapeHtml(d.end)} (${d.nights} nights)</div>
           </div>`
        )
        this.markers.push(m)
      })*/
      this.withCoords.forEach((d, i) => {
        const m = L.marker([d.lat as number, d.lng as number], {
          icon: this.makeNumberedSvgIcon(i + 1),   // ⬅️ numbered SVG
        }).addTo(this.map!)

        m.bindPopup(
            `<div style="min-width:160px">
                      <div><strong>${this.escapeHtml(d.name || `Stop ${i + 1}`)}</strong></div>
                      ${d.address ? `<div class="text-caption">${this.escapeHtml(d.address)}</div>` : ''}
                      <div class="text-caption">${this.escapeHtml(d.start)} – ${this.escapeHtml(d.end)} (${d.nights} nights)</div>
                    </div>`
        )
        this.markers.push(m)
      })

      // route polyline
      if (this.withCoords.length >= 2) {
        const latlngs = this.withCoords.map(d => [d.lat as number, d.lng as number]) as [number, number][]
        this.polyline = L.polyline(latlngs).addTo(this.map)
      }

      this.fitBounds()
    },
    fitBounds() {
      if (!this.map) return
      const pts = this.withCoords.map(d => L.latLng(d.lat as number, d.lng as number))
      if (pts.length === 0) return
      const bounds = L.latLngBounds(pts)
      this.map.fitBounds(bounds, { padding: [30, 30] })
    },
    onResize() {
      if (!this.map) return
      this.map.invalidateSize()
      this.fitBounds()
    },
    escapeHtml(s: unknown) {
      return String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    },
    toggleExpand() {
      this.isExpanded = !this.isExpanded
      this.$nextTick(() => {
        this.map?.invalidateSize()
      })
    },
    makeNumberedSvgIcon(n: number, color = '#1976d2'): L.Icon {
      // cache if you want; otherwise skip
      const cached = this.iconCache?.[n]
      if (cached) return cached

      // scale facts:
      // original pin: 40x52
      // we render at 60% => iconSize = [24, 31]
      // to keep text visually the same, multiply font by ~1/0.6 = 1.6667
      const fontBase = 14           // your original font size
      const scaleFactor = 1 / 0.6   // ≈ 1.6667
      // tiny adjustment for 2+ digits so they still fit the head
      const fontSize = (n >= 10 ? (fontBase * scaleFactor * 0.90) : (fontBase * scaleFactor)).toFixed(1)

      const svg = `
        <svg width="40" height="52" viewBox="0 0 40 52" xmlns="http://www.w3.org/2000/svg">
          <!-- pin -->
          <path d="M20 0c11 0 20 8.7 20 19.5 0 15-20 32.5-20 32.5S0 34.5 0 19.5C0 8.7 9 0 20 0z" fill="${color}"/>
          <!-- subtle inner highlight -->
          <circle cx="20" cy="19.5" r="11" fill="white" opacity="0.08"/>
          <!-- number (compensated font size so it looks same on screen) -->
          <text x="20" y="19.5" text-anchor="middle"
                font-size="${fontSize}"
                font-family="system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial"
                fill="#fff" font-weight="700" dy=".35em"
                stroke="rgba(0,0,0,0.35)" stroke-width="2" paint-order="stroke">
            ${n}
          </text>
        </svg>`.trim()

      const url = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
      const icon = L.icon({
        iconUrl: url,
        iconSize: [24, 31],   // 3/5 of [40, 52]
        iconAnchor: [12, 31], // bottom-center
        popupAnchor: [0, -28]
      })

      if (this.iconCache) this.iconCache[n] = icon
      return icon
    }
  },
})
</script>

<style scoped>
.map-wrapper {
  position: relative;
  width: 100%;
  height: 250px; /* small initial height */
  border-radius: 12px;
  overflow: hidden;
  transition: height 0.3s ease;
}
.map-el {
  width: 30vw;      /* small default */
  height: 250px;    /* match your wrapper small height */
  transition: all 0.3s ease;
}

.map-wrapper.expanded .map-el {
  width: 100vw;     /* take full width when expanded */
  height: 70vh;     /* expanded height */
}
/*
!* expanded mode *!
.map-wrapper.expanded {
  height: 70vh; !* big map when expanded *!
}

.map-el {
  width: 70vh;
  height: 70vh;
}*/

.map-toolbar {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1000;
}

.map-btn {
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 12px;
}

.marker-circle {
  width: 32px;
  height: 32px;
  background: #1976d2; /* Vuetify primary */
  color: #fff;
  font-size: 14px;
  font-weight: bold;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 0 4px rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}

</style>
<!--<style scoped>
/* Map fills its parent. No fixed px here. */
.map-host {
  /*height: 100%;
  width: 100%;*/
  border-radius: 12px;
  overflow: hidden;
}
.map-el {
  height: 70vh;
  width: 70vw;
}
.map-btn {
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 12px;
}
</style>-->
