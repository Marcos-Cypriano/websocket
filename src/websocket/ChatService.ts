import { container } from 'tsyringe'
import { io } from '../http'
import { CreateChatRoomService } from '../services/CreateChatRoomService'
import { CreateMessageService } from '../services/CreateMessageService'
import { CreateUserService } from '../services/CreateUserService'
import { GetAllUsersService } from '../services/GetAllUsersService'
import { GetChatRoomByIdService } from '../services/GetChatRoomByIdService'
import { GetChatRoomByUsersService } from '../services/GetChatRoomByUsersService'
import { GetMessageByChatRoomService } from '../services/GetMessageByChatRoomService'
import { GetUserBySocketIdService } from '../services/GetUserBySocketIdService'

io.on("connect", socket => {
    // io. comunicação com todos usuários, socket. informação direcionada

    // Entry form
    socket.on("start", async (data) => {
        const { email, name, avatar } = data
        const createUserService = container.resolve(CreateUserService)

        // If all information was filled
        if (email && name && avatar) {
            const user = await createUserService.execute({
                email,
                name,
                avatar,
                socketId: socket.id
            })
    
            socket.broadcast.emit("new_users", user)
        } else {
            // Return error if any the form has any null information
            socket.emit("error", { message: "Fill in all informations."})
        }
    })

    // Get all users to screen on side bar
    socket.on("get_users", async (callback) => {
        const getAllUsersService = container.resolve(GetAllUsersService)
        const users = await getAllUsersService.execute()

        callback(users)
    })

    // When clicking on a user and start a chat
    socket.on("start_chat", async (data, callback) => {
        const getChatRoomByUsersService = container.resolve(GetChatRoomByUsersService)
        const createChatRoomService = container.resolve(CreateChatRoomService)
        const getUserBySocketIdService = container.resolve(GetUserBySocketIdService)
        const getMessageByChatRoomService = container.resolve(GetMessageByChatRoomService)
        
        const userLogged = await getUserBySocketIdService.execute(socket.id)

        // If there is already a chat
        let room = await getChatRoomByUsersService.execute([data.idUser, userLogged._id])

        // Create a new if there is not already a chat
        if (!room) {
            room = await createChatRoomService.execute([data.idUser, userLogged._id])
        }

        socket.join(room.idChatRoom)

        // Getting all messages from chatroom
        const messages = await getMessageByChatRoomService.execute(room.idChatRoom)

        callback({ room, messages })
    })

    socket.on("message", async (data) => {
        const getUserBySocketIdService = container.resolve(GetUserBySocketIdService)
        const createMessageService = container.resolve(CreateMessageService)
        const getChatRoomByIdService = container.resolve(GetChatRoomByIdService)

        const user = await getUserBySocketIdService.execute(socket.id)

        // Saving message
        const message = await createMessageService.execute({
            to: user._id,
            text: data.message,
            roomId: data.idChatRoom
        })

        // Sending message to all chatroom users
        io.to(data.idChatRoom).emit("message", {
            message,
            user
        })

        // Send notification
        const room = await getChatRoomByIdService.execute(data.idChatRoom)

        const userFrom = room.idUsers.find((response) => String(response._id) != String(user._id))

        io.to(userFrom.socketId).emit("notification", {
            newMessage: true,
            roomId: data.idChatRoom,
            from: user
        })

    })
})