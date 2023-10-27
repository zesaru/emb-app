import UpdateCompensatorio from "@/actions/updateCompensatorio";
import React from "react";

export default function BtnAprobar({ compensatory }: { compensatory: any } ) {
  async function create(formData: FormData) {
    "use server";

    const response = await UpdateCompensatorio(compensatory);

    }
  return (
    <form action={create}>
      <button type="submit" className="btn btn-primary">
        Aprobar
      </button>
    </form>
  );
};

