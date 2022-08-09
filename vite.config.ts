import solid from 'solid-start/vite'
import { defineConfig } from 'vite'
import windicss from 'vite-plugin-windicss'
import vercel from 'solid-start-vercel'

let adapter: ReturnType<typeof vercel>

if (process.env.CLOUD_SERVICE_NAME === 'vercel')  {
  console.log('Using vercel adapter...')
  adapter = vercel()
}

export default defineConfig({
  plugins: [windicss(), solid({ ssr: true, adapter })],
  envPrefix: ['SERVER_'],
})
