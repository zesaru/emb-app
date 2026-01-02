import { promises as fs } from 'fs';
import path from 'path';
import { BackupMetadata } from './backup-types';
import { createStorageClient } from '@/utils/supabase/storage';

const BACKUP_DIR = path.join(process.cwd(), 'backups');

export const storageManager = {
  async saveToLocal(file: Buffer, filename: string): Promise<BackupMetadata> {
    // Ensure backup directory exists
    try {
      await fs.mkdir(BACKUP_DIR, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    const filepath = path.join(BACKUP_DIR, filename);
    await fs.writeFile(filepath, file);

    const stats = await fs.stat(filepath);

    return {
      id: filename.replace('.json', ''),
      filename,
      createdAt: stats.mtime,
      size: stats.size,
      type: 'full',
      status: 'completed',
      storageLocation: ['local'],
      checksum: '',
      tablesCount: 0
    };
  },

  async saveToCloud(file: Buffer, filename: string): Promise<void> {
    const storage = createStorageClient();
    const bucketName = 'backups';

    // Ensure bucket exists
    const { data: buckets } = await storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === bucketName);

    if (!bucketExists) {
      const { error: createError } = await storage.createBucket(bucketName, {
        public: false
      });

      if (createError && createError.message !== 'Bucket already exists') {
        throw new Error(`Failed to create bucket: ${createError.message}`);
      }
    }

    // Upload file
    const { error } = await storage.from(bucketName).upload(filename, file, {
      contentType: 'application/json',
      upsert: true
    });

    if (error) {
      throw new Error(`Failed to upload to cloud: ${error.message}`);
    }
  },

  async listLocalBackups(): Promise<BackupMetadata[]> {
    try {
      await fs.mkdir(BACKUP_DIR, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    try {
      const files = await fs.readdir(BACKUP_DIR);
      const backups: BackupMetadata[] = [];

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const filepath = path.join(BACKUP_DIR, file);
        const stats = await fs.stat(filepath);

        backups.push({
          id: file.replace('.json', ''),
          filename: file,
          createdAt: stats.mtime,
          size: stats.size,
          type: 'full',
          status: 'completed',
          storageLocation: ['local'],
          checksum: '',
          tablesCount: 0
        });
      }

      return backups;
    } catch (error) {
      console.error('Error listing local backups:', error);
      return [];
    }
  },

  async listCloudBackups(): Promise<BackupMetadata[]> {
    const storage = createStorageClient();
    const bucketName = 'backups';

    try {
      const { data, error } = await storage.from(bucketName).list();

      if (error) {
        throw error;
      }

      return (data || []).map(file => ({
        id: file.name.replace('.json', ''),
        filename: file.name,
        createdAt: new Date(file.created_at || Date.now()),
        size: file.metadata?.size || 0,
        type: 'full',
        status: 'completed',
        storageLocation: ['cloud'],
        checksum: '',
        tablesCount: 0
      }));
    } catch (error) {
      console.error('Error listing cloud backups:', error);
      return [];
    }
  },

  async downloadFromCloud(filename: string): Promise<Buffer> {
    const storage = createStorageClient();
    const bucketName = 'backups';

    const { data, error } = await storage
      .from(bucketName)
      .download(filename);

    if (error || !data) {
      throw new Error(`Failed to download from cloud: ${error?.message || 'Unknown error'}`);
    }

    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  },

  async deleteLocalBackup(filename: string): Promise<void> {
    const filepath = path.join(BACKUP_DIR, filename);
    await fs.unlink(filepath);
  },

  async deleteCloudBackup(filename: string): Promise<void> {
    const storage = createStorageClient();
    const bucketName = 'backups';

    const { error } = await storage
      .from(bucketName)
      .remove([filename]);

    if (error) {
      throw new Error(`Failed to delete from cloud: ${error.message}`);
    }
  }
};
