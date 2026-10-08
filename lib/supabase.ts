import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Browser client. Uses cookies so that middleware.ts can see the session.
export const supabase = createClientComponentClient();
