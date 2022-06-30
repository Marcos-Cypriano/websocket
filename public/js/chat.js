const socket = io("http://localhost:3000")


socket.on('chat_initiated', data => {
    console.log(data)
})