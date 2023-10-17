'use client'

import * as React from 'react';

interface EmailTemplateProps {
  hours: number;
  event_name: string;
  event_date: string;
}


export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  hours,event_name,event_date
}) => (
  <div>
    <h1>La presente es para comunicarle que el usuario, {hours}! ha solicitado aprobar la siguiente solicitud <a href='https:emb-app/compensatorios'></a></h1>
  </div>
);
