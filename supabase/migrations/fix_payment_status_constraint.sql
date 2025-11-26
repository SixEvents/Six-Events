-- Fix payment_status constraint to allow 'paid' and 'pending'
-- This fixes the error: "new row violates check constraint reservations_payment_status_check"

-- Drop existing constraint if exists
ALTER TABLE reservations 
DROP CONSTRAINT IF EXISTS reservations_payment_status_check;

-- Add new constraint with correct values
ALTER TABLE reservations 
ADD CONSTRAINT reservations_payment_status_check 
CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));

-- Ensure payment_method accepts 'cash' and 'card' (stripe is stored as 'card')
ALTER TABLE reservations 
DROP CONSTRAINT IF EXISTS reservations_payment_method_check;

ALTER TABLE reservations 
ADD CONSTRAINT reservations_payment_method_check 
CHECK (payment_method IN ('cash', 'card', 'stripe'));

-- Add comment for clarity
COMMENT ON COLUMN reservations.payment_status IS 'Payment status: pending (cash not paid yet), paid (cash paid or stripe confirmed), failed, refunded';
COMMENT ON COLUMN reservations.payment_method IS 'Payment method: cash (in-person), card (stripe), stripe (legacy)';
