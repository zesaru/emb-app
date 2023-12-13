import {
  Tailwind,
  Img,
  Html,
  Column,
  Section,
} from "@react-email/components";


const  Email  = async() => {

  return (
    <Tailwind
      config={{
        theme: {
          extend: {
            colors: {
              brand: "#007291",
            },
          },
        },
      }}
    >
      <Html className="m-8">
        <Section>
          <Img
            className=""
            src="https://www.reshot.com/preview-assets/icons/QHG5VUMN76/human-computer-interaction-QHG5VUMN76.svg"
            alt="logo"
            width="60"
            height="60"
          />
        </Section >
          <p className="py-4">
            Este mensaje es automatizado del sistema de Emb-app para los administradores,
            el cual muestra la cantidad de registros, horas de descanso y vacaciones que no han sido aprobados.
          </p>
        <Section >
          <Column className="bg-[#F0C48A] p-2 m-2 text-slate-100 w-24">Nombre y Apellidos</Column>
          <Column className="bg-[#F0C48A] p-2 m-2 text-slate-100 w-24 text-center">Registros</Column>
          <Column className="bg-[#F0C48A] p-2 m-2 text-slate-100 w-24 text-center">Horas de descanso</Column>
          <Column className="bg-[#F0C48A] p-2 m-2 text-slate-100 w-24 text-center">Vacaciones</Column>
        </Section>
        <Section>
          <Column className="border-2 p-2 m-2 w-24">xxx</Column>
          <Column className="border-2 p-2 m-2 w-24 text-center">xxxx</Column>
          <Column className="border-2 p-2 m-2 w-24 text-center">xxx</Column>
          <Column className="border-2 p-2 m-2 w-24 text-center">xxxx</Column>
        </Section>

      </Html>
    </Tailwind>
  );
};

export default Email;
