import Logger from "../server/logger"
import { IRoute, responseData, z } from "../server/my-router"

export default class ProfileController {
    constructor(private readonly myRoute: IRoute) { }
    getProfile = this.myRoute.get('/profile', async ({ query, req }) => {
        const cmd = 'post-profile', invoke = 'initInvoke', node = 'client'
        const { detailLog, summaryLog } = new Logger(req, invoke, cmd, '')
        detailLog.addInputRequest(node, cmd, invoke, query)
        summaryLog.addSuccessBlock(node, cmd, 'null', 'success')

        return responseData({ data: [] }, detailLog, summaryLog)
    }, { query: z.object({ username: z.string().optional() }) })


    postProfile = this.myRoute.post(
        '/profile',
        async ({ body, req }) => {
            const cmd = 'post-profile', invoke = 'initInvoke', node = 'client'
            const { detailLog, summaryLog } = new Logger(req, invoke, cmd, '')
            detailLog.addInputRequest(node, cmd, invoke, {})
            summaryLog.addSuccessBlock(node, cmd, 'null', 'success')
            return responseData({ data: { username: body.username } }, detailLog, summaryLog)
        },
        { body: z.object({ username: z.string() }) }
    )

    getProfileById = this.myRoute.get(
        '/profile/:id',
        async ({ params }) => {
            return { data: { id: params.id } }
        },
        { params: z.object({ id: z.string() }) })
}