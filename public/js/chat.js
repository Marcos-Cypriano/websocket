const socket = io("http://localhost:3000")

let idChatRoom = ''

function onLoad() {
    const urlParams = new URLSearchParams(window.location.search)
    const name = urlParams.get('name')
    const avatar = urlParams.get('avatar')
    const email = urlParams.get('email')

    // Filling logged user's info
    document.querySelector(".user_logged").innerHTML += `
        <img
            class="avatar_user_logged"
            src="${avatar}
        />
        <strong id="user_logged">${name}</strong>
    `

    socket.emit('start', {
        email,
        name,
        avatar
    })

    socket.on("new_users", (user) => {
        const existInDiv = document.getElementById(`user_${user._id}`)

        if (!existInDiv) {
            addUser(user)
        }
    })

    socket.emit("get_users", (users) => {

        users.map( user => {
            if(user.email != email) {
                addUser(user)
            }
        })
    })

    socket.on('error', (error) => {
        alert(error.message)
        window.location.href = "/"  
    })

    socket.on("message", (data) => {
        if (data.message.roomId === idChatRoom) {
            addMessage(data)
        }
    })

    socket.on("notification", data => {
        if (data.roomId !== idChatRoom) {
            const user = document.getElementById(`user_${data.from._id}`)
    
            user.insertAdjacentHTML("afterbegin", `
                <div class="notification"></div>
            `)
        }
    })
}

function addMessage(data) {
    const divMessageUser = document.getElementById("message_user")

    divMessageUser.innerHTML += `
    <span class="user_name user_name_date">
        <img
        class="img_user"
        src=${data.user.avatar}
        />
        <strong> ${data.user.name}</strong>
        <span> ${dayjs(data.message.createdAt).format("DD/MM/YYYY HH:mm")}</span>
    </span>
    <div class="messages">
        <span class="chat_message"> ${data.message.text}</span>
    </div>
    `
}

function addUser(user) {
    const usersList = document.getElementById("users_list")
    usersList.innerHTML += `
    <li
        class="user_name_list "
        id="user_${user._id}"
        idUser="${user._id}"
    >
        <img
            class="nav_avatar"
            src=${user.avatar}
        />
        ${user.name}
    </li>
    `
}

document.getElementById("users_list").addEventListener("click", (e) => {

    // Cleaning elements
    document.querySelectorAll(".user_name_list").forEach(user => {
        user.classList.remove("bg-gray-700")
    })
    document.getElementById("message_user").innerHTML = ""
    
    if(e.target && e.target.matches("li.user_name_list")) {
        const idUser = e.target.getAttribute("idUser")
        
        socket.emit("start_chat", {idUser}, (response) => {
            idChatRoom = response.room.idChatRoom

            response.messages.forEach(message => {
                const data = {
                    message,
                    user: message.to
                }

                addMessage(data)
            })
        })

        // Highlighting chosen user
        document.getElementById(`user_${idUser}`).classList.add("bg-gray-700")
    }
})

document.getElementById("user_message").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        const message = e.target.value

        const data = {
            message,
            idChatRoom
        }

        socket.emit("message", data)

        e.target.value = ''
    }
})

onLoad()