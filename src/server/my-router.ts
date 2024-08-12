import { Router, type Request, type Response, type NextFunction } from 'express'
import { z } from 'zod'
import { fromZodError } from 'zod-validation-error'
import { DetailLog, SummaryLog } from './logger'

export { z }

interface BaseResponse<T = unknown> {
    statusCode?: number
    message?: string
    /**
     * @default true
     */
    success?: boolean
    data?: T
    traceStack?: string
    page?: number
    pageSize?: number
    total?: number
}

export const responseData = <T>(data: BaseResponse<T>, detailLog: DetailLog, summaryLog: SummaryLog): BaseResponse<T> => {
    detailLog.end()
    summaryLog.end()
    return data
}

type MaybePromise<T> = T | Promise<T>

type RequestHandler = (req: Request, res: Response<BaseResponse>, next: NextFunction) => MaybePromise<BaseResponse>

type TypedHandler<
    TQuery extends z.ZodTypeAny = z.ZodAny,
    TParams extends z.ZodTypeAny = z.ZodAny,
    TBody extends z.ZodTypeAny = z.ZodAny,
    TResponse extends BaseResponse = BaseResponse
> = (context: {
    query: z.infer<TQuery>
    params: z.infer<TParams>
    body: z.infer<TBody>
    req: Request<z.infer<TParams>, any, z.infer<TBody>, z.infer<TQuery>>
    res: Response<TResponse>
}) => MaybePromise<TResponse>

interface HandlerMetadata {
    __handlerMetadata: true
    method: HTTPMethod
    path: string
    handler: RequestHandler
}

enum HttpMethod {
    GET = 'get',
    POST = 'post',
    PUT = 'put',
    DELETE = 'delete',
    PATCH = 'patch',
}

type HTTPMethod = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head'

class HttpError extends Error {
    constructor(public statusCode: number, message: string) {
        super(message)
        this.name = 'HttpError'
    }
}

class ValidationError extends HttpError {
    constructor(public message: string) {
        super(400, message)
        this.name = 'ValidationError'
    }
}

export class NotFoundError extends HttpError {
    constructor(message: string) {
        super(404, message)
        this.name = 'NotFoundError'
    }
}

export class UnauthorizedError extends HttpError {
    constructor(message: string) {
        super(401, message)
        this.name = 'UnauthorizedError'
    }
}

export function globalErrorHandler(
    error: unknown,
    _request: Request,
    response: Response<BaseResponse>,
    _next: NextFunction
) {
    let statusCode = 500
    let message = 'An unknown error occurred'

    if (error instanceof HttpError) {
        statusCode = error.statusCode
    }

    if (error instanceof Error) {
        console.log(`${error.name}: ${error.message}`)
        message = error.message

        if (message.includes('not found')) {
            statusCode = 404
        }
    } else {
        console.log('Unknown error')
        message = `An unknown error occurred, ${String(error)}`
    }

    const data = {
        statusCode: statusCode,
        message,
        success: false,
        data: null,
        traceStack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined,
    }

    response.status(statusCode).send(data)
}
class TypedRouteHandler<
    RouteQuery extends z.ZodTypeAny = z.ZodAny,
    RouteParams extends z.ZodTypeAny = z.ZodAny,
    RouteBody extends z.ZodTypeAny = z.ZodAny
> {
    private schema: {
        query?: RouteQuery
        params?: RouteParams
        body?: RouteBody
    } = {}

    constructor(private readonly path: string, private readonly method: HTTPMethod) { }

    applySchema(schema: { query?: RouteQuery; params?: RouteParams; body?: RouteBody }) {
        this.schema.query = schema.query
        this.schema.params = schema.params
        this.schema.body = schema.body
        return this
    }

    handler(handler: TypedHandler<RouteQuery, RouteParams, RouteBody>) {
        const invokeHandler = async (req: Request, res: Response, next: NextFunction) => {
            let message = ''
            let query, params, body
            try {
                message = 'Query'
                query = this.schema.query ? this.schema.query.parse(req.query) : undefined
                message = 'Params'
                params = this.schema.params ? this.schema.params.parse(req.params) : undefined
                message = 'Body'
                body = this.schema.body ? this.schema.body.parse(req.body) : undefined
            } catch (error: unknown) {
                if (error instanceof z.ZodError) {
                    const validationError = fromZodError(error)
                    const msg = `${message} ${validationError.toString()}`.replace(/"/g, `'`)
                    throw new ValidationError(msg)
                }
            }
            return handler({ query, params, body: body as any, req, res })
        }

        return {
            method: this.method,
            path: this.path,
            handler: invokeHandler,
            __handlerMetadata: true,
        }
    }
}
export class MyRouter {
    constructor(public readonly instance: Router = Router()) { }

    private preRequest(handler: RequestHandler) {
        const invokeHandler = async (req: Request, res: Response, next: NextFunction) => {
            try {
                const result = await handler(req, res, next)
                res.send({
                    success: true,
                    message: 'Request successful',
                    ...result,
                } satisfies BaseResponse)
            } catch (err) {
                next(err)
            }
        }
        return invokeHandler
    }

    Register(classInstance: object) {
        Object.values(classInstance).forEach(({ __handlerMetadata, handler, method, path }: HandlerMetadata) => {
            if (__handlerMetadata) this.instance.route(path)[method](this.preRequest(handler))
            // if (__handlerMetadata) this.instance.route(path)[method](handler)
        })
        return this
    }
}

type TSchema<Query, Params, Body> = { query?: Query; params?: Params; body?: Body }

export class TypeRoute {
    post<
        Query extends z.ZodTypeAny = z.ZodAny,
        Params extends z.ZodTypeAny = z.ZodAny,
        Body extends z.ZodTypeAny = z.ZodAny
    >(path: string, handler: TypedHandler<Query, Params, Body>, schema: TSchema<Query, Params, Body> = {}) {
        return new TypedRouteHandler<Query, Params, Body>(path, HttpMethod.POST).applySchema(schema).handler(handler)
    }
    get<
        Query extends z.ZodTypeAny = z.ZodAny,
        Params extends z.ZodTypeAny = z.ZodAny,
        Body extends z.ZodTypeAny = z.ZodAny
    >(path: string, handler: TypedHandler<Query, Params, Body>, schema: TSchema<Query, Params, Body> = {}) {
        return new TypedRouteHandler<Query, Params, Body>(path, HttpMethod.GET).applySchema(schema).handler(handler)
    }

    put<
        Query extends z.ZodTypeAny = z.ZodAny,
        Params extends z.ZodTypeAny = z.ZodAny,
        Body extends z.ZodTypeAny = z.ZodAny
    >(path: string, handler: TypedHandler<Query, Params, Body>, schema: TSchema<Query, Params, Body> = {}) {
        return new TypedRouteHandler<Query, Params, Body>(path, HttpMethod.POST).applySchema(schema).handler(handler)
    }

    patch<
        Query extends z.ZodTypeAny = z.ZodAny,
        Params extends z.ZodTypeAny = z.ZodAny,
        Body extends z.ZodTypeAny = z.ZodAny
    >(path: string, handler: TypedHandler<Query, Params, Body>, schema: TSchema<Query, Params, Body> = {}) {
        return new TypedRouteHandler<Query, Params, Body>(path, HttpMethod.PATCH).applySchema(schema).handler(handler)
    }
    delete<
        Query extends z.ZodTypeAny = z.ZodAny,
        Params extends z.ZodTypeAny = z.ZodAny,
        Body extends z.ZodTypeAny = z.ZodAny
    >(path: string, handler: TypedHandler<Query, Params, Body>, schema: TSchema<Query, Params, Body> = {}) {
        return new TypedRouteHandler<Query, Params, Body>(path, HttpMethod.DELETE).applySchema(schema).handler(handler)
    }
}

export type IRoute = TypeRoute
