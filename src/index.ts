import Logger from "./server/logger"
import { responseData, IRoute, TypeRoute, z } from "./server/my-router"
import Server from "./server/server"
import { PrismaClient } from '@prisma/client'
import UserService from "./user/user.service"
import UserController from "./user/user.controller"
import ProfileController from "./profile/profile.controller"

const prisma = new PrismaClient({ log: ['query'] })




const myRoute: IRoute = new TypeRoute()
const userService = new UserService(prisma)
const userController = new UserController(myRoute, userService)

const profileController = new ProfileController(myRoute)


const app = new Server(async () => {
    await prisma.$connect()
})

app.route('/api', profileController)
app.route('/api', userController)
app.listen(3000, async () => {
    await prisma.$disconnect()
})
