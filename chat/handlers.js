function makeHandleEvent(client, clientManager, chatroomManager) {
 async function ensureExists(getter, rejectionMessage) {
    return new Promise(function (resolve, reject) {
      const res =  getter()
      return res
        ? resolve(res)
        : reject(rejectionMessage)
    })
  }

  async function ensureUserSelected(clientId) {
    return await clientManager.getUserByClientId(clientId)
    // return ensureExists(
    //   () => clientManager.getUserByClientId(clientId),
    //   'select user first'
    // )
  }

   async function ensureValidChatroom(chatroomName) {
    return await chatroomManager.getChatroomByName(chatroomName)
    // return ensureExists(
    //   () =>  chatroomManager.getChatroomByName(chatroomName),
    //   `invalid chatroom name: ${chatroomName}`
    // )
  }

  async function ensureValidChatroomAndUserSelected(chatroomName) {
    const chatroom = await ensureValidChatroom(chatroomName)
    const user = await ensureUserSelected(client.id)
    return Promise.resolve({chatroom,user})
    // return Promise.all([
    //   ensureValidChatroom(chatroomName),
    //   ensureUserSelected(client.id)
    // ])
    //   .then(([chatroom, user]) => 
    //   {
    //     return Promise.resolve({ chatroom, user })
    //   }
      
      
    //   )
  }

  function handleEvent(chatroomName, createEntry) {
    return ensureValidChatroomAndUserSelected(chatroomName)
      .then(function ({ chatroom, user }) {
        console.log('handleEvent',chatroom.serialize)
        // append event to chat history
         const entry = { user, ...createEntry() }
          
        // // notify other clients in chatroom
        // //client.emit('new',entry)
         chatroom.addEntry(entry)
         chatroom.broadcastMessage({ chat: chatroom.getId(), ...entry })
        return chatroom
      })
  }

  

  return handleEvent
}

module.exports = function (client, clientManager, chatroomManager) {
  const handleEvent = makeHandleEvent(client, clientManager, chatroomManager)

  async function handleRegister(userName, callback) {
    const x = await clientManager.isUserAvailable(userName)
    if (!x)
      return callback('user is not available')
    const user =  await clientManager.getUserByName(userName)
    clientManager.registerClient(client, user)

    return callback(null, user)
  }

 async function handleJoin(chatroomName, callback) {
    const createEntry = () => ({ event: `establishing connection` })
    handleEvent(chatroomName, createEntry)
      .then(async function (chatroom) {
        // add member to chatroom
        chatroom.addUser(client)
        // send chat history to client
        const x =  await chatroom.getChatHistory(chatroom.getId())
        callback(chatroom.getId(), x)
      })
      .catch(callback)
  }



  function handleLeave(chatroomName, callback) {
    const createEntry = () => ({ event: `left ` })

    handleEvent(chatroomName, createEntry)
      .then(function (chatroom) {
        // remove member from chatroom
        chatroom.removeUser(client.id)

        callback(null)
      })
      .catch(callback)  
  }

  function handleMessage({ chatroomName, message } = {}, callback) {

    const createEntry = () => ({ message })

    handleEvent(chatroomName, createEntry).then((chatroom) => {
        return callback(null, null)
      })
      .catch(callback)
  }

  async function handleGetChatrooms(_, callback) {
    return callback(null, await chatroomManager.serializeChatrooms(_))
  }

  async function handleGetAvailableUsers(_, callback) {
    return callback(null,await clientManager.getAvailableUsers(_) )
  }

  function handleDisconnect() {
    // remove user profile
    clientManager.removeClient(client)
    // remove member from all chatrooms
    chatroomManager.removeClient(client)
  }

  return { handleRegister, handleJoin, handleLeave, handleMessage, handleGetChatrooms, handleGetAvailableUsers, handleDisconnect}
}
