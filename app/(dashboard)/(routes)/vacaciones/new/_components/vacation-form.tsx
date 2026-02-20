"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { es } from 'date-fns/locale'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { addVacation } from "@/actions/add-vacations";
import { toast } from "react-toastify";

const getStartOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const formSchema = z.object({
  start: z.date({
    required_error: "La fecha es requerida.",
  }),
  finish: z.date({
    required_error: "La fecha es requerida.",
  }),
  days: z.coerce.number({
    required_error: "La cantidad de día(s) es requerida.",
  }).int().min(1, "Debe solicitar al menos 1 día.").max(30, "Máximo 30 días."),
}).superRefine(({ start, finish }, ctx) => {
  const today = getStartOfDay(new Date());
  const startDate = getStartOfDay(start);
  const finishDate = getStartOfDay(finish);

  if (startDate < today) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["start"],
      message: "La fecha de inicio no puede ser en el pasado.",
    });
  }

  if (finishDate < startDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["finish"],
      message: "La fecha de término no puede ser anterior a la fecha de inicio.",
    });
  }
});

type VacationFormValues = z.infer<typeof formSchema>;

const defaultValues: Partial<VacationFormValues> = {};

export function VacationNewForm() {
  const form = useForm<VacationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const today = getStartOfDay(new Date());

  const onSubmit =  async (data: VacationFormValues) => {
    try {
      const response = await addVacation({
        start: format(data.start, "yyyy-MM-dd"),
        finish: format(data.finish, "yyyy-MM-dd"),
        days: data.days,
      });

      if (response?.success) {
        toast("Solicitud de vacaciones registrada correctamente.", {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        form.reset();
        return;
      }

      toast(response?.error || "No se pudo registrar la solicitud de vacaciones.", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    } catch {
      toast("Ocurrió un error inesperado al registrar la solicitud.", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    }
  };  

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="start"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Fecha de inicio</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      type="button"
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Seleccione una fecha</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => getStartOfDay(date) < today}
                    locale={es}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription></FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="finish"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Fecha de termino</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      type="button"
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Seleccione una fecha</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => getStartOfDay(date) < today}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
              <FormDescription></FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="days"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cantidad de días</FormLabel>
              <FormControl>
                <Input {...field} type="number" min={1} max={30} />
              </FormControl>
              <FormDescription></FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Guardando..." : "Guardar"}
        </Button>
      </form>
    </Form>
  );
}
