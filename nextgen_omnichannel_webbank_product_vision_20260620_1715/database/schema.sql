-- File: schema.sql
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    iban VARCHAR(34) UNIQUE NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'EUR',
    balance DECIMAL(15,2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'FROZEN', 'CLOSED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    account_from VARCHAR(34) NOT NULL CHECK (LENGTH(account_from) = 34),
    account_to VARCHAR(34) NOT NULL CHECK (LENGTH(account_to) = 34),
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    status VARCHAR(30) NOT NULL CHECK (status IN ('PENDING_APPROVAL', 'APPROVED', 'EXECUTED', 'REJECTED', 'FAILED_SYSTEM_ERROR', 'MANUAL_REVIEW_REQUIRED')),
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('SEPA_INSTANT', 'SEPA_STANDARD', 'DOMESTIC_RTGS', 'TEMPLATE_EXECUTION')),
    idempotency_key VARCHAR(64) UNIQUE NOT NULL,
    reference VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('TRANSACTION', 'ACCOUNT', 'AUTH')),
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    performed_by VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    details JSONB,
    trace_id VARCHAR(64),
    CONSTRAINT chk_audit_action CHECK (action IN ('INITIATED', 'APPROVED', 'REJECTED', 'FAILED', 'REVIEW_REQUESTED', 'LOGIN', 'LOGOUT'))
);

CREATE INDEX idx_transactions_customer_status ON transactions(customer_id, status);
CREATE INDEX idx_transactions_idempotency ON transactions(idempotency_key);
CREATE INDEX idx_audit_log_trace ON audit_log(trace_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_txn_update_timestamp BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();