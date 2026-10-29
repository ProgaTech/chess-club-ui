import { ClerkProvider } from '@clerk/react'
import type { ComponentProps } from 'react'
import { BrowserRouter } from 'react-router-dom'
import App from '@/App.tsx'
import { useDarkTheme } from '@/lib/theme'

type ClerkAppearance = NonNullable<ComponentProps<typeof ClerkProvider>['appearance']>

interface IThemedClerkProviderProps {
  publishableKey: string
}

const clerkFonts = { fontFamily: 'Courier New', fontFamilyButtons: 'Courier New' }

const lightClerk: ClerkAppearance = {
  variables: {
    ...clerkFonts,
    colorForeground: '#2e3532',
    colorPrimary: '#2e3532',
    colorPrimaryForeground: '#f7f6f4',
  },
}

// Mirrors the .dark palette in index.css.
const darkClerk: ClerkAppearance = {
  variables: {
    ...clerkFonts,
    colorBackground: '#232826',
    colorForeground: '#e8e6e2',
    colorMutedForeground: '#a3aba7',
    colorNeutral: '#ffffff',
    colorInput: '#1a1e1c',
    colorInputForeground: '#e8e6e2',
    colorPrimary: '#e8e6e2',
    colorPrimaryForeground: '#1a1e1c',
  },
}

export function ThemedClerkProvider(props: IThemedClerkProviderProps) {
  const { publishableKey } = props
  const dark = useDarkTheme()

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      afterSignOutUrl="/"
      appearance={dark ? darkClerk : lightClerk}
      signInFallbackRedirectUrl="/"
      signInUrl="/sign-in"
      signUpFallbackRedirectUrl="/"
      signUpUrl="/sign-up"
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  )
}
