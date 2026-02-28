"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import type { Plant } from "@/lib/types/plants"

const plantFormSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich").max(100, "Maximal 100 Zeichen"),
  species: z.string().max(100).optional().or(z.literal("")),
  location: z.string().max(200).optional().or(z.literal("")),
  planted_at: z.string().optional().or(z.literal("")),
  notes: z.string().max(1000, "Maximal 1000 Zeichen").optional().or(z.literal("")),
})

type PlantFormValues = z.infer<typeof plantFormSchema>

interface AddPlantSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (plant: Plant) => void
}

export function AddPlantSheet({ open, onOpenChange, onSuccess }: AddPlantSheetProps) {
  const form = useForm<PlantFormValues>({
    resolver: zodResolver(plantFormSchema),
    defaultValues: {
      name: "",
      species: "",
      location: "",
      planted_at: "",
      notes: "",
    },
  })

  const isSubmitting = form.formState.isSubmitting

  async function onSubmit(values: PlantFormValues) {
    try {
      const body: Record<string, string> = { name: values.name }
      if (values.species) body.species = values.species
      if (values.location) body.location = values.location
      if (values.planted_at) body.planted_at = values.planted_at
      if (values.notes) body.notes = values.notes

      const res = await fetch("/api/plants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        throw new Error("Fehler beim Erstellen der Pflanze")
      }

      const data = await res.json()
      form.reset()
      onOpenChange(false)
      onSuccess(data.plant)
    } catch {
      form.setError("name", { message: "Fehler beim Speichern. Bitte versuche es erneut." })
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Neue Pflanze</SheetTitle>
          <SheetDescription>
            Lege eine neue Pflanze in deinem Garten an.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name der Pflanze *</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. Basilikum" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="species"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Art / Gattung</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. Tomate, Rosa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Standort im Garten</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. Südterrasse, Hochbeet" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="planted_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pflanzdatum</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notizen</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Besondere Pflegehinweise, Beobachtungen..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SheetFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Speichern
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
