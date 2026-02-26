"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { es } from 'date-fns/locale'
import type { z } from "zod";

import { cn } from "@/lib/utils";
import { compensatoryRequestSchema } from "@/lib/validation/schemas";
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
import addCompensatorioRequest from "@/actions/add-compensatorio-request";

type RequestFormValues = z.infer<typeof compensatoryRequestSchema>;

const defaultValues: Partial<RequestFormValues> = {};

export default function RequestForm() {
  const [isPending, startTransition] = useTransition();
  const form = useForm<RequestFormValues>({
    resolver: zodResolver(compensatoryRequestSchema),
    defaultValues,
  });

  const onSubmit = async (formData: RequestFormValues) => {
    startTransition(async () => {
      const response = await addCompensatorioRequest(formData);

      if (response?.success) {
        if (response.warning) {
          toast.warn(response.warning, {
            position: "top-right",
            autoClose: 4000,
            theme: "light",
          });
        }
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
        return;
      }

      toast.error(response?.error || "No se pudo registrar la solicitud", {
        position: "top-right",
        autoClose: 4000,
        theme: "light",
      });
    });
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
                      type="button"
                      disabled={isPending}
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP", { locale: es })
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
                    disabled={isPending}
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
                <Input
                  type="number"
                  min={1}
                  max={12}
                  step={1}
                  inputMode="numeric"
                  disabled={isPending}
                  placeholder="ej.... 8"
                  {...field}
                />
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
              <FormLabel>Hora de inicio</FormLabel>
              <FormControl>
                <Input type="time" placeholder="ej.... 8" disabled={isPending} {...field} />
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
              <FormLabel>Hora de finalización</FormLabel>
              <FormControl>
                <Input type="time" placeholder="ej.... 8" disabled={isPending} {...field} />
              </FormControl>
              <FormDescription></FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar"}
        </Button>
      </form>
    </Form>
  );
}
