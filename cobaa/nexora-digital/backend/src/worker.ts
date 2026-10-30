import { logger } from './config';
import { runWorkerLoop } from './services/order-worker';

// Worker terpisah agar bisa dijalankan di process sendiri (production).
runWorkerLoop(Number(process.env.WORKER_POLL_MS || 5000)).catch((e) => {
  logger.error({ e }, 'Worker gagal dijalankan');
  process.exit(1);
});
