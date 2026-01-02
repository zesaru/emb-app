export interface BackupMetadata {
  id: string;
  filename: string;
  createdAt: Date;
  size: number;
  type: 'full';
  status: 'pending' | 'completed' | 'failed';
  storageLocation: ('local' | 'cloud')[];
  checksum: string;
  tablesCount: number;
}

export interface BackupResult {
  success: boolean;
  metadata?: BackupMetadata;
  error?: string;
  duration: number;
}

export interface RestoreResult {
  success: boolean;
  restoredAt: Date;
  tablesAffected: string[];
  error?: string;
}

export interface BackupConfig {
  retentionDays: number;
  localPath: string;
  storageBucket: string;
  notifyOnSuccess: boolean;
  notifyOnFailure: boolean;
  notificationEmail: string;
}
