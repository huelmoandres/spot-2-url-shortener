import { z } from 'zod'

// Schema Zod para el formulario de acortamiento de URL
export const urlSchema = z.object({
    url: z
        .string()
        .min(1, 'La URL es requerida')
        .url('Ingresá una URL válida con http:// o https://')
        .max(2048, 'La URL es demasiado larga (máx. 2048 caracteres)'),
})

export type UrlFormData = z.infer<typeof urlSchema>
