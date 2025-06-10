import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode, isPreview }) => {
  const isDev = mode === 'development'
  const isLocalDev = command === 'serve' && !isPreview

  // Your existing config...
  const apiBaseUrl = isLocalDev
    ? 'http://localhost:3060'
    : 'https://papertool-server.sodalabs.io'

  const deploymentBaseUrl = isDev
    ? 'https://dev.papertool.sodalabs.io'
    : 'https://papertool.sodalabs.io'

  return {
    base: isLocalDev ? '/' : deploymentBaseUrl,

    define: {
      "process.env": {},
      __API_BASE_URL__: JSON.stringify(apiBaseUrl),
      __DEPLOYMENT_ENV__: JSON.stringify(isDev ? 'development' : 'production'),
      __BASE_URL__: JSON.stringify(deploymentBaseUrl)
    },
  }
})
