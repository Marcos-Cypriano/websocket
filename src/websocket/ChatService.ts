import { io } from '../http'

io.on("connect", socket => {
    // io.emit envia informação global, socket.emit informação controlada
    socket.emit("chat_initiated", {
        message: 'Seu chat foi iniciado'
    })
})