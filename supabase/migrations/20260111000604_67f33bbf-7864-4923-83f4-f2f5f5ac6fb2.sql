-- Fix data inconsistency: Mario Rossi incorrectly linked to mimmo's user_id

-- 1. Remove the erroneous user_id link from Mario Rossi
-- Mario Rossi (mariorossi@gmail.com) should NOT have user_id pointing to mimmo's account
UPDATE clients 
SET user_id = NULL 
WHERE id = '498a49e2-dbee-4481-b07b-9752300b3f79';

-- 2. Remove the 'client' role from mimmo@gmail.com (he's only a coach)
DELETE FROM user_roles 
WHERE user_id = 'a87f6def-07ed-4033-ba99-246510fd004a' 
AND role = 'client';