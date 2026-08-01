// Configuració de PM2 per servir el build "standalone" de Next.
// El port ha de coincidir amb l'App Port del site de CloudPanel.
module.exports = {
  apps: [
    {
      name: "gomini",
      script: "server.js",
      cwd: ".next/standalone",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "600M",
      env: {
        NODE_ENV: "production",
        HOSTNAME: "127.0.0.1",
        PORT: process.env.PORT || 3000,
      },
    },
  ],
};
