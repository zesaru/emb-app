import { promises as fs } from 'fs';
import path from 'path';
import { BackupMetadata } from './backup-types';
import { createClient } from '@supabase/supabase-js';

const BACKUP_DIR = path.join(process.cwd(), 'backups');

// Cliente administrativo con service_role key para operaciones de Storage
// Nota: Estas operaciones requieren service_role key que debe estar configurada en el entorno
function createAdminStorageClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase service role environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

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
    // Nota: El bucket de backups debe ser creado manualmente en Supabase
    // para usar las funciones administrativas de Storage

    try {
      const storage = createAdminStorageClient();
      const bucketName = 'backups';

      // Intentar crear el bucket (puede fallar si ya existe)
      try {
        const { error: createError } = await storage.storage.createBucket(bucketName, {
          public: false
        });

        if (createError && !createError.message.includes('already exists')) {
          console.warn('Could not create bucket:', createError.message);
        }
      } catch (e: any) {
        // Ignorar errores de bucket ya existente
        if (!e.message?.includes('already exists')) {
          console.warn('Bucket creation warning:', e.message);
        }
      }

      // Upload file
      const { error } = await storage.storage.from(bucketName).upload(filename, file, {
        contentType: 'application/json',
        upsert: true
      });

      if (error) {
        throw new Error(`Failed to upload to cloud: ${error.message}`);
      }
    } catch (error: any) {
      // Si falla por falta de service_role key, solo loggear warning
      if (error.message?.includes('service role')) {
        console.warn('Cloud storage not available: service role key not configured');
        return;
      }
      throw error;
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
    try {
      const storage = createAdminStorageClient();
      const bucketName = 'backups';

      const { data, error } = await storage.storage.from(bucketName).list();

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
    } catch (error: any) {
      // Si falla por falta de service_role key, retornar array vacío
      if (error.message?.includes('service role') || error.message?.includes('Missing')) {
        console.warn('Cloud storage not available: service role key not configured');
        return [];
      }
      console.error('Error listing cloud backups:', error);
      return [];
    }
  },

  async downloadFromCloud(filename: string): Promise<Buffer> {
    const storage = createAdminStorageClient();
    const bucketName = 'backups';

    const { data, error } = await storage
      .storage
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
    const storage = createAdminStorageClient();
    const bucketName = 'backups';

    const { error } = await storage
      .storage
      .from(bucketName)
      .remove([filename]);

    if (error) {
      throw new Error(`Failed to delete from cloud: ${error.message}`);
    }
  }
};
