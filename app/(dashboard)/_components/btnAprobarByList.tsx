import React from "react";

export default function BtnAprobar(compensatory: any) {
  async function create(formData: FormData) {
    //"use server";
    // mutate data
    //const response = await UpdateCompensatorio(compensatory);

    }
  return (
    <form action={create}>
      <button type="submit" className="btn btn-primary">
        Aprobar
      </button>
    </form>
  );
};
