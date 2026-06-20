-- File: data.sql
INSERT INTO accounts (id, customer_id, iban, currency, balance, status) VALUES 
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c1d2e3f4-a5b6-7890-cdef-123456789abc', 'HU74 1164 0000 0000 0100 9999 8888', 'EUR', 14250.00, 'ACTIVE');

INSERT INTO transactions (id, customer_id, account_from, account_to, amount, status, payment_type, idempotency_key, reference) VALUES 
('t-001-initiated', 'c1d2e3f4-a5b6-7890-cdef-123456789abc', 'HU74 1164 0000 0000 0100 9999 8888', 'DE89 3704 0044 0532 0130 00', 250.00, 'PENDING_APPROVAL', 'SEPA_INSTANT', 'idemp-key-001', 'Invoice #884'),
('t-002-approved', 'c1d2e3f4-a5b6-7890-cdef-123456789abc', 'HU74 1164 0000 0000 0100 9999 8888', 'FR76 3000 6000 0112 3456 7890 189', 150.75, 'APPROVED', 'SEPA_STANDARD', 'idemp-key-002', 'Contract payment Q3');

INSERT INTO audit_log (entity_type, entity_id, action, performed_by, trace_id) VALUES 
('TRANSACTION', 't-001-initiated', 'INITIATED', 'X-User-ID-customer', 'trace-sim-init'),
('TRANSACTION', 't-002-approved', 'APPROVED', 'X-Approver-ID-admin', 'trace-sim-approve');