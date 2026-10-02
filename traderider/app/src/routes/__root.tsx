import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Traderider' },
      {
        name: 'description',
        content: 'Trade Rider. Övning på en bana.',
      },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <html lang="sv">
      <head>
        <HeadContent />
      </head>
      <body className="bg-paper text-ink font-sans antialiased">
        <Outlet />
        <Scripts />
      </body>
    </html>
  )
}
