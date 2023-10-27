"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Icons } from "@/components/animatespin"
import { useState } from "react"
import React from "react"
import { toast } from "react-toastify"
import { supabase } from '@/lib/supabase'



const FormSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 5 characters.",
  }),
  password: z.string().min(5, {
    message: "Password must be at least 5 characters.",
  }),
})


export default  function ResetForm() {
  const [loading, setLoading] = React.useState((false) as boolean);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  })

    async function onSubmit(dat: z.infer<typeof FormSchema>) {
 
    try {
      setLoading(true);
      const { data , error } = await supabase.auth.updateUser({
        email: dat.username,
        password: dat.password,
      });
      if (data.user) {
        toast.success("Contraseña cambiada con éxito");
      }
    } catch (error) {
      console.log(error);
      toast.error("Error al cambiar la contraseña");
    } finally {
      setLoading(false);
    }

  }

  return (
    <>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-2/3 space-y-6">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="mail@mail.com" {...field} />
              </FormControl>
              <FormDescription>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>password</FormLabel>
              <FormControl>
                <Input type='password' placeholder="******" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">{loading ? 
          
            <Icons.spinner className="animate-spin" /> 

          : 
          "Guardar"}
        </Button>
      </form>
    </Form>
    </>
  )
}
