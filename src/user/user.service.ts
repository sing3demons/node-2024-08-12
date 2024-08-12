import { type Prisma, type PrismaClient } from "@prisma/client";
import type { DetailLog, SummaryLog } from "../server/logger";
import { TQueyUser, TUser } from "./user.model";

export default class UserService {
    constructor(private readonly prisma: PrismaClient) { }
    private node = 'postgres'

    public async getAllUser({ email, name, limit, page }: TQueyUser, detailLog: DetailLog, summaryLog: SummaryLog) {
        const cmd = 'get-all-user', invoke = detailLog.createInvoke()
        const take = Number(limit)
        const skip = (Number(page) - 1) * take
        const opt: Prisma.UserFindManyArgs = {
            where: {
                email: { contains: email },
                name: { contains: name },
            },
            orderBy: { email: 'asc' },
            take: +limit,
            skip: skip,
        }

        try {
            detailLog.addInputRequest(this.node, cmd, invoke, opt)
            const [result, total] = await this.prisma.$transaction([
                this.prisma.user.findMany(opt),
                this.prisma.user.count({ where: opt.where }),
            ])
            detailLog.addOutputRequest(this.node, cmd, invoke, result)
            summaryLog.addSuccessBlock(this.node, cmd, '200', 'success')
            return { data: result, total }
        } catch (error) {
            if (error instanceof Error) {
                detailLog.addOutputRequest(this.node, cmd, invoke, error.message)
                summaryLog.addErrorBlock(this.node, cmd, '500', error.message)
                throw error
            }
            detailLog.addOutputRequest(this.node, cmd, invoke, 'An unknown error occurred')
            summaryLog.addErrorBlock(this.node, cmd, '500', 'An unknown error occurred')
            throw error
        }
    }

    public async createUser(body: TUser, detailLog: DetailLog, summaryLog: SummaryLog) {
        const cmd = 'insert-user', invoke = detailLog.createInvoke()

        const opt: Prisma.UserCreateArgs = {
            data: {
                email: body.email,
                name: body.name,
                createBy: 'system',
                updateBy: 'system',
            },
        }
        try {
            detailLog.addInputRequest(this.node, cmd, invoke, opt)
            const result = await this.prisma.user.create(opt)
            detailLog.addOutputRequest(this.node, cmd, invoke, result)
            summaryLog.addSuccessBlock(this.node, cmd, '201', 'success')
            return result
        } catch (error) {
            if (error instanceof Error) {
                detailLog.addOutputRequest(this.node, cmd, invoke, error.message)
                summaryLog.addErrorBlock(this.node, cmd, '500', error.message)
                return []
            }
            detailLog.addOutputRequest(this.node, cmd, invoke, 'An unknown error occurred')
            summaryLog.addErrorBlock(this.node, cmd, '500', 'An unknown error occurred')
            throw error
        }
    }

    public async getUserById(id: string, detailLog: DetailLog, summaryLog: SummaryLog) {
        const cmd = 'get-user-by-id', invoke = detailLog.createInvoke()
        const opt: Prisma.UserFindUniqueArgs = { where: { id } }
        try {
            detailLog.addInputRequest(this.node, cmd, invoke, opt)
            const result = await this.prisma.user.findUnique(opt)
            if (!result) {
                throw new Error('User not found')
            }
            detailLog.addOutputRequest(this.node, cmd, invoke, result)
            summaryLog.addSuccessBlock(this.node, cmd, '200', 'success')
            return result
        } catch (error) {
            if (error instanceof Error) {
                detailLog.addOutputRequest(this.node, cmd, invoke, error.message)
                summaryLog.addErrorBlock(this.node, cmd, '404', error.message)
                throw error
            }
            detailLog.addOutputRequest(this.node, cmd, invoke, 'An unknown error occurred')
            summaryLog.addErrorBlock(this.node, cmd, '500', 'An unknown error occurred')
            throw error
        }
    }

    public async updateUser(id: string, body: TUser, detailLog: DetailLog, summaryLog: SummaryLog) {
        const cmd = 'update-user', invoke = detailLog.createInvoke()
        const opt: Prisma.UserUpdateArgs = {
            where: { id },
            data: {
                email: body.email,
                name: body.name,
                updateBy: 'system',
            },
        }
        try {
            detailLog.addInputRequest(this.node, cmd, invoke, opt)
            const result = await this.prisma.user.update(opt)
            detailLog.addOutputRequest(this.node, cmd, invoke, result)
            summaryLog.addSuccessBlock(this.node, cmd, '200', 'success')
            return result
        } catch (error) {
            if (error instanceof Error) {
                detailLog.addOutputRequest(this.node, cmd, invoke, error.message)
                summaryLog.addErrorBlock(this.node, cmd, '500', error.message)
                throw error
            }
            detailLog.addOutputRequest(this.node, cmd, invoke, 'An unknown error occurred')
            summaryLog.addErrorBlock(this.node, cmd, '500', 'An unknown error occurred')
            throw error
        }
    }

    public async deleteUser(id: string, detailLog: DetailLog, summaryLog: SummaryLog) {
        const cmd = 'delete-user', invoke = detailLog.createInvoke()
        const opt: Prisma.UserDeleteArgs = { where: { id } }
        try {
            detailLog.addInputRequest(this.node, cmd, invoke, opt)
            const result = await this.prisma.user.delete(opt)
            detailLog.addOutputRequest(this.node, cmd, invoke, result)
            summaryLog.addSuccessBlock(this.node, cmd, '200', 'success')
            return result
        } catch (error) {
            if (error instanceof Error) {
                detailLog.addOutputRequest(this.node, cmd, invoke, error.message)
                summaryLog.addErrorBlock(this.node, cmd, '500', error.message)
                throw error
            }
            detailLog.addOutputRequest(this.node, cmd, invoke, 'An unknown error occurred')
            summaryLog.addErrorBlock(this.node, cmd, '500', 'An unknown error occurred')
            throw error
        }
    }
}