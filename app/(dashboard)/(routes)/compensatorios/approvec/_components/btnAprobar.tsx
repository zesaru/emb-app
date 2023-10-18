import UpdateCompensatorio from "@/actions/updateCompensatorio";
import React from "react";

export default function BtnAprobar(compensatorio:any ) {
  async function create(formData: FormData) {
    "use server";

    // mutate data
    const aprobar = await UpdateCompensatorio(compensatorio.idcompensatorio, compensatorio.idusuario);
    // revalidate cache
  }
  return (
    <form action={create}>
      <button type="submit" className="btn btn-primary">
        Aprobar
      </button>
    </form>
  );
};

