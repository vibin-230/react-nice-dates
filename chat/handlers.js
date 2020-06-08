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
        chatroom.addUser(client)
        client.join(chatroom.getId())
        const token = client.handshake.query.token;
        const x =  await chatroom.getChatHistory(chatroom.getId(),token)
        callback(chatroom.getId(), x)
      })
      .catch(callback)
  }



  async function handleLeave(chatroomName, callback) {
    const createEntry = () => ({ event: `left ` })

    // handleEvent(chatroomName, createEntry)
    //   .then(function (chatroom) {
    //     // remove member from chatroom
    //     chatroom.removeUser(client.id)
    //     callback(null)
    //   })
    //   .catch(callback)  
    client.leave(chatroomName.convo_id)
    let x
    if(chatroomName.type === 'group'){
       x  = await chatroomManager.leaveChatroomGroup(chatroomName)

    }
     else if(chatroomName.type === 'game_without_game_id'){
      x  = await chatroomManager.leaveChatroomWithConversationId(chatroomName)

   }
    
    else{
      x  = await chatroomManager.leaveChatroom(chatroomName)
    }
    x.forEach((clientId)=>{
      const client =  clientManager.getClient(clientId)
     })
    callback()

  }

  

  async function handleMessageGames({ chatroomName, message } = {}, callback) {
        console.log('hit',chatroomName,message);
        const clientNumber = io.sockets.adapter.rooms[chatroomName._id];
        const activeUsers = clientManager.filterClients(Object.keys(clientNumber.sockets))
        const x = await chatroomManager.saveMessagesAndPopulate(message) 
        console.log('hit 2',x);
        client.to(chatroomName._id).emit('new',x)
        client.to(chatroomName._id).emit('unread',x)
        chatroomManager.notifyAllUsersNotInTheChatroom(chatroomName, message,activeUsers)
        callback()
    
  }

  async function handleUpdateImage({ chatroomName, message } = {}, callback) {
    const clientNumber = io.sockets.adapter.rooms[chatroomName._id];
    const activeUsers = clientManager.filterClients(Object.keys(clientNumber.sockets))
    client.to(chatroomName._id).emit('new',message)
    client.to(chatroomName._id).emit('unread',message)
    chatroomManager.updateImage(message)
    console.log('hit in handle update image');
    // chatroomManager.saveMessages(message) 
    chatroomManager.notifyAllUsersNotInTheChatroom(chatroomName, message,activeUsers)
    callback()

}

 async function handleMessage({ chatroomName, message } = {}, callback) {
    if(chatroomName.type === 'single'){
      const clientNumber = io.sockets.adapter.rooms[chatroomName._id].length;
      if(io.sockets.adapter.rooms[chatroomName._id].length < 2){
        chatroomManager.saveMessage(message)
        chatroomManager.notifyAllUsers(chatroomName, message)
        callback()
      }else{
        client.to(chatroomName._id).emit('new',message)
        client.to(chatroomName._id).emit('unread',message)
        //chatroomManager.notifyAllUsers(chatroomName, message)
        chatroomManager.saveMessage(message) 
        callback()
     }
    }else{
    const clientNumber = io.sockets.adapter.rooms[chatroomName._id];
     const activeUsers = clientManager.filterClients(Object.keys(clientNumber.sockets))
       client.to(chatroomName._id).emit('new',message)
        client.to(chatroomName._id).emit('unread',message)
        chatroomManager.saveMessage(message) 
        chatroomManager.notifyAllUsersNotInTheChatroom(chatroomName, message,activeUsers)
        callback()
    }
    
  }


  async function handleInvites(game,callback){
    
    let x = game.ids.length > 0 && await chatroomManager.sendInvites(game.game._id,game.game.conversation,game.ids,game.user_id,game.town)
    let y = game.convo_ids.length > 0 && await chatroomManager.sendGroupInvites(game.game._id,game.game.conversation,game.convo_ids,game.user_id,game.game.name,game.town)
     x.length > 0 && x.forEach((clientId)=>{
     const client =  clientManager.getClient(clientId)
    })
    y.length > 0 && y.forEach((clientId)=>{
      const client =  clientManager.getClient(clientId)
     })
    callback()
  }


  async function handleJoinGame(game,callback){
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

  async function handleLeaveChatrooms(obj, callback) {
    const x = await chatroomManager.serializeChatrooms(obj.user_id)
    x.forEach((conversation)=> client.leave(conversation._id))
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

  async function handleTyping({ chatroomName, message } = {}, callback) {
    client.to(chatroomName._id).emit('typing',message)
    return callback()
  }

  return {handleLeaveChatrooms,handleUpdateImage,handleRegister, handleJoin, handleLeave, handleMessage, handleGetChatrooms, handleGetAvailableUsers, handleDisconnect, handleInvites, handleJoinGame,handleTyping,handleMessageGames}
}
