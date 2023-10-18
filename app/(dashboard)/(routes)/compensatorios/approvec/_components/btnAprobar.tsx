import UpdateCompensatorio from "@/actions/updateCompensatorio";
import React from "react";
import { toast } from "react-toastify";

export default function BtnAprobar({ compensatory }: { compensatory: any } ) {
  async function create(formData: FormData) {
    "use server";

    // mutate data
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

