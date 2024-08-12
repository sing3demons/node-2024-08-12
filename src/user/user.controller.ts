import { IRoute, responseData } from "../server/my-router"
import UserService from "./user.service"
import Logger from "../server/logger"
import { QueyUserSchema, TUserResponse, userIdSchema, userSchema } from "./user.model"
import { Request } from "express"

export default class UserController {
    constructor(
        private readonly myRoute: IRoute,
        private readonly userService: UserService
    ) { }

    private node = 'client'

    public getAllUser = this.myRoute.get('/users', async ({ query, req }) => {
        const cmd = 'get-all-user', invoke = 'initInvoke'
        const { detailLog, summaryLog } = new Logger(req as unknown as Request, invoke, cmd, invoke)
        detailLog.addInputRequest(this.node, cmd, invoke, {})
        summaryLog.addSuccessBlock(this.node, cmd, 'null', 'success')

        const { data, total } = await this.userService.getAllUser(query, detailLog, summaryLog)
        const response: TUserResponse[] = data.map((item) => {
            return {
                id: item.id,
                email: item.email,
                href: `/users/${item.id}`,
                name: item.name || '',
            }
        })
        return responseData({
            data: response,
            total,
            page: +query.page,
            pageSize: +query.limit
        }, detailLog, summaryLog)
    }, {
        query: QueyUserSchema
    })

    public createUser = this.myRoute.post('/users', async ({ body, req }) => {
        const cmd = 'post-user', invoke = 'initInvoke'
        const { detailLog, summaryLog } = new Logger(req as Request, invoke, cmd, invoke)
        detailLog.addInputRequest(this.node, cmd, invoke, {})
        summaryLog.addSuccessBlock(this.node, cmd, 'null', 'success')

        const result = await this.userService.createUser(body, detailLog, summaryLog)
        return responseData({
            statusCode: 201,
            message: 'Created',
            data: result,
        }, detailLog, summaryLog)
    }, {
        body: userSchema
    })

    public getUserById = this.myRoute.get('/users/:id', async ({ params, req }) => {
        const cmd = 'get-user-by-id', invoke = 'initInvoke'
        const { detailLog, summaryLog } = new Logger(req as Request, invoke, cmd, invoke)
        detailLog.addInputRequest(this.node, cmd, invoke, {})
        summaryLog.addSuccessBlock(this.node, cmd, 'null', 'success')

        const result = await this.userService.getUserById(params.id, detailLog, summaryLog)
        return responseData({
            data: {
                id: result.id,
                href: `/users/${result.id}`,
                email: result.email,
                name: result.name || '',
            },
        }, detailLog, summaryLog)
    }, { params: userIdSchema })

    public updateUser = this.myRoute.put('/users/:id', async ({ params, body, req }) => {
        const cmd = 'put-user', invoke = 'initInvoke'
        const { detailLog, summaryLog } = new Logger(req as Request, invoke, cmd, invoke)
        detailLog.addInputRequest(this.node, cmd, invoke, {})
        summaryLog.addSuccessBlock(this.node, cmd, 'null', 'success')

        const result = await this.userService.updateUser(params.id, body, detailLog, summaryLog)
        return responseData({
            data: result,
        }, detailLog, summaryLog)
    }, {
        params: userIdSchema,
        body: userSchema
    })

    public deleteUser = this.myRoute.delete('/users/:id', async ({ params, req }) => {
        const cmd = 'delete-user', invoke = 'initInvoke'
        const { detailLog, summaryLog } = new Logger(req as Request, invoke, cmd, invoke)
        detailLog.addInputRequest(this.node, cmd, invoke, {})
        summaryLog.addSuccessBlock(this.node, cmd, 'null', 'success')

        await this.userService.deleteUser(params.id, detailLog, summaryLog)
        return responseData({
            statusCode: 204,
            message: 'Deleted',
        }, detailLog, summaryLog)
    }, {
        params: userIdSchema
    })
}