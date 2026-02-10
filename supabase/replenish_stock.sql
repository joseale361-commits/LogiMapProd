CREATE OR REPLACE FUNCTION replenish_stock(p_distributor_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  WITH updated_rows AS (
    UPDATE public.product_variants pv
    SET stock_virtual = target_stock,
        updated_at = NOW()
    FROM public.products p
    WHERE pv.product_id = p.id
      AND p.distributor_id = p_distributor_id
      AND pv.stock_virtual < pv.target_stock
    RETURNING pv.id
  )
  SELECT count(*) INTO updated_count FROM updated_rows;
  
  RETURN updated_count;
END;
$$;