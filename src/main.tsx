import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createTheme, MantineProvider } from '@mantine/core'
import type { CSSVariablesResolver } from '@mantine/core'
import '@mantine/core/styles.css'
import App from './App'

// Mantine's default primary, dimmed and error colors are below WCAG AA contrast on white.
const theme = createTheme({ primaryShade: 8 })
const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {
    '--mantine-color-dimmed': 'var(--mantine-color-gray-7)',
    '--mantine-color-error': 'var(--mantine-color-red-9)',
  },
  dark: {},
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme} cssVariablesResolver={cssVariablesResolver}>
      <App />
    </MantineProvider>
  </StrictMode>,
)
