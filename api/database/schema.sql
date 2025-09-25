-- StockTake Database Schema
-- PostgreSQL database for cross-platform stock take application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table with role-based access control
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('retail_staff', 'retail_manager', 'warehouse_staff', 'retail_backend', 'tech_admin')),
    store_id UUID REFERENCES stores(id),
    warehouse_id UUID REFERENCES warehouses(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stores table
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Warehouses table
CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Items table
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    short_id VARCHAR(50) UNIQUE, -- For barcode generation
    name VARCHAR(255) NOT NULL,
    description TEXT,
    has_rfid BOOLEAN DEFAULT false,
    category VARCHAR(100),
    unit_price DECIMAL(10,2),
    store_id UUID REFERENCES stores(id),
    warehouse_id UUID REFERENCES warehouses(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock take sessions
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('retail', 'warehouse')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
    store_id UUID REFERENCES stores(id),
    warehouse_id UUID REFERENCES warehouses(id),
    created_by UUID REFERENCES users(id),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paused_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Counts table for tracking inventory counts
CREATE TABLE counts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) NOT NULL,
    item_id UUID REFERENCES items(id) NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    device_id VARCHAR(255) NOT NULL,
    round_number INTEGER NOT NULL CHECK (round_number IN (1, 2, 3)), -- 1=first, 2=second, 3=final
    count_value INTEGER NOT NULL,
    scan_method VARCHAR(50) CHECK (scan_method IN ('rfid', 'barcode', 'qr', 'manual')),
    remarks TEXT,
    photo_url VARCHAR(500),
    is_confirmed BOOLEAN DEFAULT false,
    counted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, item_id, user_id, round_number)
);

-- Approvals table for manager approval workflow
CREATE TABLE approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) NOT NULL,
    item_id UUID REFERENCES items(id) NOT NULL,
    first_count_id UUID REFERENCES counts(id),
    second_count_id UUID REFERENCES counts(id),
    final_count_id UUID REFERENCES counts(id),
    approved_by UUID REFERENCES users(id),
    approved_count INTEGER,
    approval_status VARCHAR(50) CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    approval_notes TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log for tracking all actions
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    session_id UUID REFERENCES sessions(id),
    item_id UUID REFERENCES items(id),
    action VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}',
    device_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sync status for external integrations
CREATE TABLE sync_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) NOT NULL,
    integration_type VARCHAR(50) NOT NULL CHECK (integration_type IN ('netsuite', 'mps', 'admin')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'syncing', 'success', 'failed')),
    payload JSONB DEFAULT '{}',
    error_message TEXT,
    synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_items_sku ON items(sku);
CREATE INDEX idx_items_short_id ON items(short_id);
CREATE INDEX idx_counts_session_item ON counts(session_id, item_id);
CREATE INDEX idx_counts_user ON counts(user_id);
CREATE INDEX idx_counts_round ON counts(round_number);
CREATE INDEX idx_approvals_session ON approvals(session_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_session ON audit_logs(session_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON warehouses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_counts_updated_at BEFORE UPDATE ON counts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_approvals_updated_at BEFORE UPDATE ON approvals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sync_status_updated_at BEFORE UPDATE ON sync_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
