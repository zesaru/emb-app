import { getRequestUser } from "@/lib/auth/request-user";
import { requireUserActive } from "@/lib/auth/admin-check";
import { formatInTimeZone } from "date-fns-tz";
import { redirect } from "next/navigation";
import Calendar from "./_components/calendar";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const {
    data: { user },
  } = await getRequestUser();

  if (!user) {
    redirect("/login");
  }

  await requireUserActive(user.id);
  const initialDate = formatInTimeZone(new Date(), "Asia/Tokyo", "yyyy-MM-dd");

  return (
    <>
      <div className="flex flex-col">
        <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-6 sm:px-6 sm:py-10">
          <Calendar initialDate={initialDate} />
        </div>
      </div>
    </>
  );
}
