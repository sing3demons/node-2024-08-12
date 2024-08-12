import { Request } from 'express'

declare global {
    namespace Express {
        interface Request {
            signedToken?: User;
        }
    }
}

type User = {}