import { z } from "zod";


export const userSchema = z.object({
    id: z.string().optional(),
    email: z.string().email(),
    name: z.string().optional(),
    posts: z.array(z.object({})).optional(),
    profile: z.object({}).optional()
})

export const QueyUserSchema = z.object({
    email: z.string().email().optional(),
    name: z.string().optional(),
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('10')
})

export const UserResponseSchema = z.object({
    name: z.string().optional(),
})
export const userIdSchema = z.object({
    id: z.string()
})

export type TQueyUser = z.infer<typeof QueyUserSchema>

export type TUser = z.infer<typeof userSchema>

export type TUserResponse = Omit<TUser, 'id'> & { id: string, href: string }