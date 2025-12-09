/*
  # Create scanners table for managing scanner devices
  
  1. New Tables
    - `scanners`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `scanner_name` (text)
      - `scanner_type` (text) - camera, manual, excel
      - `device_info` (text)
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `last_used_at` (timestamptz)
  
  2. Security
    - Enable RLS on `scanners` table
    - Add policy for users to manage their own scanners
*/

CREATE TABLE IF NOT EXISTS scanners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scanner_name text NOT NULL,
  scanner_type text DEFAULT 'camera',
  device_info text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz,
  UNIQUE(user_id, scanner_name)
);

ALTER TABLE scanners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scanners"
  ON scanners
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own scanners"
  ON scanners
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scanners"
  ON scanners
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scanners"
  ON scanners
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);