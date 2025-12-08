export interface Product {
  serial_number: string;
  packaging: string;
  production_order: string;
  location: string;
  production_date: string;
  production_time: string;
  product_code: string;
  product_name: string;
  created_at: string;
}

export interface ScanHistory {
  id: string;
  user_id: string;
  serial_number: string;
  scan_method: 'camera' | 'manual' | 'excel';
  scanned_at: string;
  scan_date: string;
  products?: Product;
}

export interface User {
  id: string;
  email: string;
}
