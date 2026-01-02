-- =============================================
-- Setup Script: Supabase Storage Bucket para Backups
-- =============================================

-- 1. Crear el bucket 'backups' para almacenar los backups
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('backups', 'backups', false, 1073741824, ARRAY['application/json', 'application/gzip', 'application/x-gzip', 'application/sql', 'text/plain'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 1073741824,
  allowed_mime_types = ARRAY['application/json', 'application/gzip', 'application/x-gzip', 'application/sql', 'text/plain'];

-- 2. Políticas de seguridad (RLS) para el bucket de backups
-- Solo los usuarios admin pueden acceder a los backups

-- Política: SELECT (Ver/Descargar backups)
CREATE POLICY "Admins can view backups"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'backups'
  AND (
    (SELECT admin FROM users WHERE id = auth.uid()) = 'admin'
    OR auth.role() = 'service_role'
  )
);

-- Política: INSERT (Subir backups)
CREATE POLICY "Admins can upload backups"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'backups'
  AND (
    (SELECT admin FROM users WHERE id = auth.uid()) = 'admin'
    OR auth.role() = 'service_role'
  )
);

-- Política: UPDATE (Actualizar backups)
CREATE POLICY "Admins can update backups"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'backups'
  AND (
    (SELECT admin FROM users WHERE id = auth.uid()) = 'admin'
    OR auth.role() = 'service_role'
  )
)
WITH CHECK (
  bucket_id = 'backups'
  AND (
    (SELECT admin FROM users WHERE id = auth.uid()) = 'admin'
    OR auth.role() = 'service_role'
  )
);

-- Política: DELETE (Eliminar backups)
CREATE POLICY "Admins can delete backups"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'backups'
  AND (
    (SELECT admin FROM users WHERE id = auth.uid()) = 'admin'
    OR auth.role() = 'service_role'
  )
);

-- 3. Verificar configuración
SELECT 
  id, 
  name, 
  public, 
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'backups';
