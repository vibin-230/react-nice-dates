const notify = require('../scripts/Notify');
function makeHandleEvent(client, clientManager, chatroomManager,io) {

  async function ensureUserSelected(clientId) {
    return await clientManager.getUserByClientId(clientId)
  }

   async function ensureValidChatroom(chatroomName) {
     if(chatroomName.type === 'single')
    return await chatroomManager.getChatroomByName(chatroomName)
    else
    return await chatroomManager.getGroupOrGameName(chatroomName)
  }

  async function ensureValidChatroomAndUserSelected(chatroomName) {
    const chatroom = await ensureValidChatroom(chatroomName)
    const user = await ensureUserSelected(client.id)
    return Promise.resolve({chatroom,user})
    
  }

  function handleEvent(chatroomName, createEntry) {
    return ensureValidChatroomAndUserSelected(chatroomName)
      .then(function ({ chatroom, user }) {
        // append event to chat history
         const entry = { user, ...createEntry() }
         chatroom.addEntry(entry)
          return chatroom
      })
  }


  return handleEvent
}

module.exports = function (client, clientManager, chatroomManager,io) {
  const handleEvent = makeHandleEvent(client, clientManager, chatroomManager,io)

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
        client.join(chatroom.getId())

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
    console.log('asdasdasdasdasd',chatroomName)
    if(chatroomName.type === 'single'){
      const clientNumber = io.sockets.adapter.rooms[chatroomName._id].length;
      console.log('client_no',clientNumber)
      if(io.sockets.adapter.rooms[chatroomName._id].length < 2){
        chatroomManager.saveMessage(message)
        chatroomManager.notifyOtherUsers(chatroomName, message)
        callback()
      }else{
       
        client.to(chatroomName._id).emit('new',message)
        client.to(chatroomName._id).emit('unread',message)
        chatroomManager.saveMessage(message) 
        callback()
      }
    }else{
      console.log('hit',message)
        client.to(chatroomName._id).emit('new',message)
        client.to(chatroomName._id).emit('unread',message)
        chatroomManager.saveMessage(message) 
        chatroomManager.notifyAllUsers(chatroomName, message)
        callback()
    }
    
  }


  async function handleInvites(game,callback){
    const x = await chatroomManager.sendInvites(game.game._id,game.game.conversation,game.ids)
    x.forEach((clientId)=>{
     const client =  clientManager.getClient(clientId)
    })
    callback()
  }


  async function handleJoinGame(game,callback){
    console.log(game);
    const x = await chatroomManager.joinGame(game.game_id,game.id)
    x.forEach((clientId)=>{
     const client =  clientManager.getClient(clientId)
    })
    callback()
  }

  async function handleGetChatrooms(_, callback) {
    const x = await chatroomManager.serializeChatrooms(_)
    x.forEach((conversation)=>client.join(conversation._id))
    return callback()
  }

  async function handleGetAvailableUsers(_, callback) {
    return callback(null,await clientManager.getAvailableUsers(_) )
  }

  function handleDisconnect(token) {
    // remove user profile
    clientManager.removeClient(client,token)
    // remove member from all chatrooms
    chatroomManager.removeClient(client)
  }

  return { handleRegister, handleJoin, handleLeave, handleMessage, handleGetChatrooms, handleGetAvailableUsers, handleDisconnect, handleInvites, handleJoinGame}
}
