import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'Emb_app',
  eventKey: process.env.INNGEST_EVENT_KEY,
})
