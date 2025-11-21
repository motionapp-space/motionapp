-- Add partial payment tracking to package table
ALTER TABLE public.package 
ADD COLUMN partial_payment_cents INTEGER DEFAULT 0;