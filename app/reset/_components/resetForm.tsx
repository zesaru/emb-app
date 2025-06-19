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
import { resetPasswordAction } from "@/actions/auth-change-password"
import { passwordResetSchema } from "@/lib/validation"



type ResetFormData = z.infer<typeof passwordResetSchema>

export default function ResetForm() {
  const [loading, setLoading] = React.useState(false)

  const form = useForm<ResetFormData>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      email: "",
    },
  })

  async function onSubmit(data: ResetFormData) {
    try {
      setLoading(true)
      
      const result = await resetPasswordAction(data.email)
      
      if (result.success) {
        toast.success("Se ha enviado un enlace de recuperación a tu email")
        form.reset()
      } else {
        toast.error(result.error || "Error al enviar el email de recuperación")
      }
    } catch (error) {
      console.log(error)
      toast.error("Error inesperado. Intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-2/3 space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input 
                  type="email" 
                  placeholder="tu-email@ejemplo.com" 
                  {...field} 
                  disabled={loading}
                />
              </FormControl>
              <FormDescription>
                Te enviaremos un enlace para restablecer tu contraseña.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading} className="min-w-[140px]">
          {loading ? (
            <>
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> 
              Enviando...
            </>
          ) : (
            "Enviar Enlace"
          )}
        </Button>
      </form>
    </Form>
    </>
  )
}
