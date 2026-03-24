export async function register() {
  if (
    process.env.NEXT_RUNTIME === 'nodejs' &&
    process.env.BACKUP_ENABLED === 'true'
  ) {
    const { startBackupScheduler } = await import('@/lib/backup/scheduler')
    startBackupScheduler()
  }
}
