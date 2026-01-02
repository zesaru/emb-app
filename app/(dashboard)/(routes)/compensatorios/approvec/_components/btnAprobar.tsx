import UpdateCompensatorio from "@/actions/updateCompensatorio";
import { CompensatorysWithUser } from "@/types/collections";
import React from "react";

export default function BtnAprobar({ compensatory }: { compensatory: CompensatorysWithUser[] }) {
  async function create(formData: FormData) {
    "use server";

    // Extraer el primer elemento del array
    const data = compensatory[0];
    if (!data) {
      throw new Error("No se encontraron datos del compensatorio");
    }

    const response = await UpdateCompensatorio([data]);

    if (response?.error) {
      throw new Error(response.error);
    }
  }

  return (
    <form action={create}>
      <button type="submit" className="btn btn-primary">
        Aprobar
      </button>
    </form>
  );
}
