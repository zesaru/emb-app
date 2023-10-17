'use client'
import { Button } from '@react-email/button';
import { Html } from '@react-email/html';
import * as React from 'react';

interface EmailTemplateProps {
  hours: number;
  event_name: string;
  event_date: string;
}


export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  hours,event_name,event_date
}) => (
  <Html lang="en" dir="ltr">
  <Button href="https://example.com" style={{ color: '#61dafb' }}>
    Click me
  </Button>
</Html>
);
