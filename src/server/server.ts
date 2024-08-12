import express from 'express'
import type { Express, Request, Response, NextFunction, RequestHandler } from 'express'
import http from 'http'
import { v7 as uuid } from 'uuid'
import { globalErrorHandler, MyRouter } from './my-router'
import { Socket } from 'net'
import promBundle from 'express-prom-bundle'

const metricsMiddleware = promBundle({ includeMethod: true })

interface IServer {
    // start: () => IServer
    use: (handler: RequestHandler) => IServer
    listen: (port: number) => void
}

class Server implements IServer {
    private readonly app: Express
    constructor(cb?: () => Promise<void> | void) {
        this.app = express()
        this.app.use((req: Request, _res: Response, next: NextFunction) => {
            if (!req.headers['x-transaction-id']) {
                req.headers['x-transaction-id'] = `default-${uuid()}`
            }
            next()
        })
        this.app.use(express.json({ limit: '50mb' }))
        this.app.use(express.urlencoded({ extended: true }))
        this.app.get('/healthz', (_req: Request, res: Response) => { res.status(200).send('OK') })
        this.app.use(metricsMiddleware)
        cb?.()
    }
    // app.use(new MyRouter().Register(new ExampleController(myRoute)).instance)
    public route = (path: string, classInstance: object, ...middleware: RequestHandler[]) => {
        this.app.use(path, ...middleware, new MyRouter().Register(classInstance).instance)
        return this
    }

    public use = (...handler: RequestHandler[]) => {
        this.app.use(...handler)
        return this
    }

    public listen = (port: number | string, close?: () => Promise<void> | void) => {
        this.app.use((req: Request, res: Response, _next: NextFunction) => {
            res.status(404).json({ message: 'Unknown URL', path: req.originalUrl })
        })
        this.app.use(globalErrorHandler)
        const server = http.createServer(this.app).listen(port, () => {
            console.log(`Server is running on port: ${port}`)
        })

        const connections = new Set<Socket>();

        server.on('connection', (connection) => {
            connections.add(connection);
            connection.on('close', () => {
                connections.delete(connection);
            });
        });

        const signals = ['SIGINT', 'SIGTERM']
        signals.forEach(signal => {
            process.on(signal, () => {
                console.log(`Received ${signal}, shutting down gracefully...`);
                server.close(() => {
                    console.log('Closed out remaining connections.');
                    close?.()
                    process.exit(0);
                });

                // If after 10 seconds the server hasn't finished, force shutdown
                setTimeout(() => {
                    console.error('Forcing shutdown as server is taking too long to close.');
                    connections.forEach((connection) => {
                        connection.destroy();
                    });
                    close?.()
                    process.exit(1);
                }, 10000);
            });
        });

    }
}

export default Server