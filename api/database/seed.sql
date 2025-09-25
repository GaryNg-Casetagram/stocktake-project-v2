-- Sample data for testing and development
-- Insert test stores
INSERT INTO stores (id, name, code, address, timezone) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Central Store', 'CENTRAL', '123 Main Street, Central District', 'Asia/Hong_Kong'),
('550e8400-e29b-41d4-a716-446655440002', 'East Store', 'EAST', '456 East Road, Eastern District', 'Asia/Hong_Kong'),
('550e8400-e29b-41d4-a716-446655440003', 'West Store', 'WEST', '789 West Avenue, Western District', 'Asia/Hong_Kong');

-- Insert test warehouses
INSERT INTO warehouses (id, name, code, address, timezone) VALUES
('650e8400-e29b-41d4-a716-446655440001', 'Main Warehouse', 'MAIN_WH', '100 Industrial Road, Warehouse District', 'Asia/Hong_Kong'),
('650e8400-e29b-41d4-a716-446655440002', 'Distribution Center', 'DIST_CENTER', '200 Logistics Park, Distribution Zone', 'Asia/Hong_Kong');

-- Insert test users (password: 'password123' - hashed with bcrypt)
INSERT INTO users (id, email, password_hash, first_name, last_name, role, store_id, warehouse_id) VALUES
-- Tech Admin
('750e8400-e29b-41d4-a716-446655440001', 'admin@stocktake.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System', 'Admin', 'tech_admin', NULL, NULL),

-- Retail Store Managers
('750e8400-e29b-41d4-a716-446655440002', 'manager.central@stocktake.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John', 'Smith', 'retail_manager', '550e8400-e29b-41d4-a716-446655440001', NULL),
('750e8400-e29b-41d4-a716-446655440003', 'manager.east@stocktake.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sarah', 'Johnson', 'retail_manager', '550e8400-e29b-41d4-a716-446655440002', NULL),

-- Retail Staff
('750e8400-e29b-41d4-a716-446655440004', 'staff1.central@stocktake.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Mike', 'Chen', 'retail_staff', '550e8400-e29b-41d4-a716-446655440001', NULL),
('750e8400-e29b-41d4-a716-446655440005', 'staff2.central@stocktake.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Lisa', 'Wong', 'retail_staff', '550e8400-e29b-41d4-a716-446655440001', NULL),

-- Warehouse Staff
('750e8400-e29b-41d4-a716-446655440006', 'warehouse1@stocktake.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'David', 'Lee', 'warehouse_staff', NULL, '650e8400-e29b-41d4-a716-446655440001'),
('750e8400-e29b-41d4-a716-446655440007', 'warehouse2@stocktake.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Emma', 'Zhang', 'warehouse_staff', NULL, '650e8400-e29b-41d4-a716-446655440001'),

-- Retail Backend
('750e8400-e29b-41d4-a716-446655440008', 'backend@stocktake.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Backend', 'User', 'retail_backend', NULL, NULL);

-- Insert sample items with RFID and non-RFID examples
INSERT INTO items (id, sku, short_id, name, description, has_rfid, category, unit_price, store_id, warehouse_id) VALUES
-- RFID Items
('850e8400-e29b-41d4-a716-446655440001', 'CTF-C-CIM-242614E67PMBL', 'CTF001', 'Premium Camera Lens 24mm', 'High-quality camera lens with advanced optics', true, 'Electronics', 299.99, '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001'),
('850e8400-e29b-41d4-a716-446655440002', 'CTF-C-CIM-242614E67PMBL-2', 'CTF002', 'Premium Camera Lens 50mm', 'Professional portrait lens with image stabilization', true, 'Electronics', 399.99, '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001'),
('850e8400-e29b-41d4-a716-446655440003', 'CTF-C-CIM-242614E67PMBL-3', 'CTF003', 'Wireless Camera Remote', 'Bluetooth camera remote with timer function', true, 'Electronics', 89.99, '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001'),

-- Non-RFID Items
('850e8400-e29b-41d4-a716-446655440004', 'CTF-C-CIM-242614E67PMBL-4', 'CTF004', 'Camera Strap Leather', 'Genuine leather camera strap with quick release', false, 'Accessories', 45.99, '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001'),
('850e8400-e29b-41d4-a716-446655440005', 'CTF-C-CIM-242614E67PMBL-5', 'CTF005', 'Memory Card 64GB', 'High-speed SD card for professional photography', false, 'Storage', 79.99, '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001'),
('850e8400-e29b-41d4-a716-446655440006', 'CTF-C-CIM-242614E67PMBL-6', 'CTF006', 'Camera Cleaning Kit', 'Professional camera cleaning tools and solutions', false, 'Accessories', 29.99, '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001'),

-- Items for East Store
('850e8400-e29b-41d4-a716-446655440007', 'CTF-C-CIM-242614E67PMBL-7', 'CTF007', 'Tripod Professional', 'Heavy-duty tripod with ball head', false, 'Accessories', 199.99, '550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440001'),
('850e8400-e29b-41d4-a716-446655440008', 'CTF-C-CIM-242614E67PMBL-8', 'CTF008', 'Camera Bag Large', 'Professional camera bag with laptop compartment', false, 'Accessories', 149.99, '550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440001'),

-- Warehouse Items
('850e8400-e29b-41d4-a716-446655440009', 'CTF-C-CIM-242614E67PMBL-9', 'CTF009', 'Bulk Camera Bodies', 'Professional camera bodies (bulk packaging)', true, 'Electronics', 1299.99, NULL, '650e8400-e29b-41d4-a716-446655440001'),
('850e8400-e29b-41d4-a716-446655440010', 'CTF-C-CIM-242614E67PMBL-10', 'CTF010', 'Bulk Lens Collection', 'Mixed lens collection for wholesale', true, 'Electronics', 899.99, NULL, '650e8400-e29b-41d4-a716-446655440001');

-- Insert sample session
INSERT INTO sessions (id, name, type, status, store_id, created_by) VALUES
('950e8400-e29b-41d4-a716-446655440001', 'Central Store Year-End Stock Take 2025', 'retail', 'active', '550e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440002');

-- Insert sample counts (first round)
INSERT INTO counts (id, session_id, item_id, user_id, device_id, round_number, count_value, scan_method, remarks) VALUES
('a50e8400-e29b-41d4-a716-446655440001', '950e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440004', 'device-001', 1, 5, 'rfid', 'All items found in electronics section'),
('a50e8400-e29b-41d4-a716-446655440002', '950e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440004', 'device-001', 1, 3, 'rfid', 'Found in display case'),
('a50e8400-e29b-41d4-a716-446655440003', '950e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440004', '750e8400-e29b-41d4-a716-446655440005', 'device-002', 1, 12, 'barcode', 'Found in accessories section'),
('a50e8400-e29b-41d4-a716-446655440004', '950e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440005', '750e8400-e29b-41d4-a716-446655440005', 'device-002', 1, 8, 'qr', 'Memory cards in storage drawer');

-- Insert sample audit logs
INSERT INTO audit_logs (user_id, session_id, item_id, action, details, device_id) VALUES
('750e8400-e29b-41d4-a716-446655440004', '950e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440001', 'count_created', '{"round": 1, "value": 5, "method": "rfid"}', 'device-001'),
('750e8400-e29b-41d4-a716-446655440004', '950e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440002', 'count_created', '{"round": 1, "value": 3, "method": "rfid"}', 'device-001'),
('750e8400-e29b-41d4-a716-446655440005', '950e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440004', 'count_created', '{"round": 1, "value": 12, "method": "barcode"}', 'device-002'),
('750e8400-e29b-41d4-a716-446655440005', '950e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440005', 'count_created', '{"round": 1, "value": 8, "method": "qr"}', 'device-002');
