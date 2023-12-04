import { serve } from "inngest/next";
import { inngest } from "../../inngest/client";
import { scheduleMail } from '../../inngest/functions/scheduleMail';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    scheduleMail
  ],
});
