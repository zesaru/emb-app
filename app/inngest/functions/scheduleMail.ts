import { inngest } from '../client';

export const scheduleMail = inngest.createFunction(
  { id: "scheduleMail"},
  { cron:"TZ=Asia/Tokyo 0 8 * * *"},
  async ({ step }) => {
    console.log('scheduleMail');
  }
);