import { PrismaClient } from "@prisma/client";

export default class ProfileService {
    constructor(private readonly prisma: PrismaClient) { }
    private node = 'postgres'
}