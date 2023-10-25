"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { es } from 'date-fns/locale'
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

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { toast } from "react-toastify";
import UpdateCompensatorioResquest from "@/actions/add-compensatorio-request";

const requestFormSchema = z.object({
  dob: z.date({
    required_error: "A date is required.",
  }),
  hours: z.preprocess(
    (a) => parseInt(z.string().parse(a), 10),
    z.number().positive().min(1)
  ),
  time_start: z.string({
    required_error: "Hora de inicio no valida",
  }),
  time_finish: z.string({
    required_error: "Hora de finalización no valida",
  }),
});

type RequestFormValues = z.infer<typeof requestFormSchema>;

const defaultValues: Partial<RequestFormValues> = {};

export default function RequestForm() {
  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues,
  });

  const onSubmit = async (formData: RequestFormValues) => {
    const response = await UpdateCompensatorioResquest(formData);

    if (response?.success) {
      toast("🦄 Su solicitud ha sido registrada", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      form.reset({
        hours: 0,
        time_start: "",
        time_finish: "",
        dob: new Date(),
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="dob"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Fecha</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
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
                    // disabled={(date) =>
                    //   date < new Date() 
                    // }
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
          name="hours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de horas</FormLabel>
              <FormControl>
                <Input placeholder="ej.... 8" {...field} />
              </FormControl>
              <FormDescription></FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="time_start"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de horas</FormLabel>
              <FormControl>
                <Input type="time" placeholder="ej.... 8" {...field} />
              </FormControl>
              <FormDescription></FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="time_finish"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de horas</FormLabel>
              <FormControl>
                <Input type="time" placeholder="ej.... 8" {...field} />
              </FormControl>
              <FormDescription></FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Guardar</Button>
      </form>
    </Form>
  );
}
