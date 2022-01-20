//Server (emit) -> cleint receive --acknowledgement--> server

//Client (emit) -> server receive --acknowledgement--> client
const socket =io()

//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')


//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoScroll = () => {
    //new message element
    let $newMessage = $messages.lastElementChild

    //Height of new message
    let newMessageStyles = getComputedStyle($newMessage)
    let newMessageMargin = parseInt(newMessageStyles.marginBottom)
    let newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //Visible Height
    let visibleHeight = $messages.offsetHeight

    //Height of message container
    let containerHeight = $messages.scrollHeight

    //How far have i scrolled
    let scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }

}


//render messages on browser
socket.on("message", (msg) => {
    const html = Mustache.render(messageTemplate,{
        username: msg.username,
        message: msg.text,
        createdAt: moment(msg.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()

})

socket.on('locationMessage', (location) => {
    const html = Mustache.render(locationMessageTemplate, {
        username: location.username,
        url: location.url,
        createdAt: moment(location.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('roomUsers', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    //disable
    $messageFormButton.setAttribute('disabled', 'disabled')

    const message = e.target.elements.msg.value

    socket.emit('sendMessage', message, (error) => {
        //enable
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ""
        $messageFormInput.focus()
        if(error) {
            return console.log(error)
        }

      console.log('Message was delivered')
    })

})

document.querySelector('#send-location').addEventListener('click', (e) => {
    var location = navigator.geolocation
    if(!location) {
        return alert('Geolocation not support by your browser')
    }

    $sendLocationButton.setAttribute('disabled', 'disabled')

    location.getCurrentPosition((position) => {
        let lat = position.coords.latitude
        let long = position.coords.longitude
        socket.emit('sendLocation', {
            latitude: lat,
            longitude: long
        }, () => {
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location shared')
        })
    })
})

socket.emit('join', {username, room}, (error) => {
    if (error) {
        alert(error)
        location.href ='/'
    }
})
