/*
  # Create Pallet Scanner Database Schema

  1. New Tables
    - `products`
      - `serial_number` (text, primary key) - Unique serial number for each pallet
      - `packaging` (text) - Type of packaging (e.g., PALLET)
      - `production_order` (text) - Production order number
      - `location` (text) - Production location code
      - `production_date` (date) - Date of production
      - `production_time` (time) - Time of production
      - `product_code` (text) - Product identification code
      - `product_name` (text) - Full product name
      - `created_at` (timestamptz) - Record creation timestamp
    
    - `scan_history`
      - `id` (uuid, primary key) - Unique scan record ID
      - `user_id` (uuid, foreign key) - Reference to auth.users
      - `serial_number` (text, foreign key) - Reference to products
      - `scan_method` (text) - Method used: 'camera', 'manual', or 'excel'
      - `scanned_at` (timestamptz) - Timestamp of scan
      - `scan_date` (date) - Date of scan for grouping

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to:
      - Read all products
      - Create scan history
      - Read their own scan history
*/

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  serial_number text PRIMARY KEY,
  packaging text NOT NULL DEFAULT '',
  production_order text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  production_date date,
  production_time time,
  product_code text NOT NULL DEFAULT '',
  product_name text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create scan_history table
CREATE TABLE IF NOT EXISTS scan_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  serial_number text NOT NULL REFERENCES products(serial_number) ON DELETE CASCADE,
  scan_method text NOT NULL DEFAULT 'manual',
  scanned_at timestamptz DEFAULT now(),
  scan_date date DEFAULT CURRENT_DATE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_scan_history_user_id ON scan_history(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_history_scan_date ON scan_history(scan_date);
CREATE INDEX IF NOT EXISTS idx_scan_history_scanned_at ON scan_history(scanned_at DESC);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;

-- Products policies: All authenticated users can read products
CREATE POLICY "Authenticated users can read all products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

-- Scan history policies: Users can insert their own scans
CREATE POLICY "Users can create their own scan history"
  ON scan_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Scan history policies: Users can read their own scan history
CREATE POLICY "Users can read their own scan history"
  ON scan_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Scan history policies: Users can delete their own scan history
CREATE POLICY "Users can delete their own scan history"
  ON scan_history FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);