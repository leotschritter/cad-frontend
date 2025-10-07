import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'        // <-- load MDI font
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// Icons: load aliases + mdi set
import { aliases, mdi } from 'vuetify/iconsets/mdi'

// Labs: register VDateInput (or import locally in SFC)
import { VDateInput } from 'vuetify/labs/VDateInput'

export const vuetify = createVuetify({
  components: {
    ...components,
    VDateInput,
  },
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,            // enables $calendar, $close, etc.
    sets: { mdi },
  },
})
