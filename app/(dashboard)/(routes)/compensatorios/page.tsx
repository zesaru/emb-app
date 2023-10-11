"use client"

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const Compensatorios = () => {
    const supabase = createClientComponentClient();

  return (
    <div>Compensatorios</div>
  )
}

export default Compensatorios