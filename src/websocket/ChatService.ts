import { container } from 'tsyringe'
import { io } from '../http'
import { CreateChatRoomService } from '../services/CreateChatRoomService'
import { CreateUserService } from '../services/CreateUserService'
import { GetAllUsersService } from '../services/GetAllUsersService'
import { GetChatRoomByUsersService } from '../services/GetChatRoomByUsersService'
import { GetUserBySocketIdService } from '../services/GetUserBySocketIdService'

io.on("connect", socket => {
    // io.emit envia informação global, socket.emit informação controlada
    socket.on("start", async (data) => {
        const { email, name, avatar } = data
        const createUserService = container.resolve(CreateUserService)

        if (email && name && avatar) {
            const user = await createUserService.execute({
                email,
                name,
                avatar,
                socketId: socket.id
            })
    
            socket.broadcast.emit("new_users", user)
        }
        
        socket.emit("error", { message: "Fill in all informations."})
    })

    socket.on("get_users", async (callback) => {
        const getAllUsersService = container.resolve(GetAllUsersService)
        const users = await getAllUsersService.execute()

        callback(users)
    })

    socket.on("start_chat", async (data, callback) => {
        const getChatRoomByUsersService = container.resolve(GetChatRoomByUsersService)
        const createChatRoomService = container.resolve(CreateChatRoomService)
        const getUserBySocketIdService = container.resolve(GetUserBySocketIdService)

        const userLogged = await getUserBySocketIdService.execute(socket.id)

        let room = await getChatRoomByUsersService.execute([data.idUser, userLogged._id])

        if (!room) {
            room = await createChatRoomService.execute([data.idUser, userLogged._id])
        }

        callback(room)
    })
})