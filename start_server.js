import { createServer } from 'vite'

async function main() {
  const server = await createServer({
    configFile: './vite.config.ts',
    server: {
      port: 5000,
      host: '0.0.0.0',
    },
  })

  await server.listen()
  
  console.log('\n===================================================')
  console.log('  JanSathi AI Server is LIVE & RUNNING!')
  console.log('  Open in browser: http://localhost:5000')
  console.log('===================================================\n')
}

main().catch((err) => {
  console.error('Server error:', err)
})
