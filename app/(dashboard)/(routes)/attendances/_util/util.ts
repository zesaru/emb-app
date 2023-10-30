import { parse, isBefore } from 'date-fns';

export function verificarPuntualidad(
    horaEntrada: string,
    horaReferencia: string
  ): boolean{
    const horaEntradaObj = parse(horaEntrada, 'HH:mm:ss', new Date());
    const horaReferenciaObj = parse(horaReferencia, 'HH:mm:ss', new Date());

    return isBefore(horaEntradaObj, horaReferenciaObj)

  }
  