const notify = require('../scripts/Notify');
function makeHandleEvent(client, clientManager, chatroomManager,io) {

  async function ensureUserSelected(clientId) {
    return await clientManager.getUserByClientId(clientId)
  }

   async function ensureValidChatroom(chatroomName) {
     if(chatroomName.type === 'single'){

       const x = await chatroomManager.getChatroomByName(chatroomName)
       return x
     }
    else{
      const x = await chatroomManager.getGroupOrGameName(chatroomName,client)
      return  x
    }
   
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
        const y = await chatroomManager.checkIfUserExited({_id:chatroom.getId()})
        callback(chatroom.getId(),x,y)
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
    client.to(chatroomName.convo_id).emit('unread',{})
    let x
    if(chatroomName.type === 'group'){
       x  = await chatroomManager.leaveChatroomGroup(chatroomName)

    }
     else if(chatroomName.type === 'game_without_game_id'){
      x  = await chatroomManager.leaveChatroomWithConversationId(chatroomName)

   }
   else if(chatroomName.type === 'kick_player'){
    x  = await chatroomManager.kickPlayer(chatroomName)
    client.to(chatroomName.convo_id).emit('unread',{})

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
        const clientNumber = io.sockets.adapter.rooms[chatroomName._id];
        const activeUsers = clientManager.filterClients(Object.keys(clientNumber.sockets))
        const x = await chatroomManager.saveMessagesAndPopulate(message) 
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
    // chatroomManager.saveMessages(message) 
    chatroomManager.notifyAllUsersNotInTheChatroom(chatroomName, message,activeUsers)
    callback()

}

async function handleSlotAvailability({ booking } = {}, callback) {
  // const clientNumber = io.sockets.adapter.rooms[game.conversation];
  // const activeUsers = clientManager.filterClients(Object.keys(clientNumber.sockets))
  // client.to(chatroomName._id).emit('new',message)
  // client.to(chatroomName._id).emit('unread',message)
  chatroomManager.handleSlotAvailability(booking,client)
  // chatroomManager.saveMessages(message) 
  //chatroomManager.notifyAllUsersNotInTheChatroom(chatroomName, message,activeUsers)
  callback()

}

async function handleSlotAvailabilityDueToCancellation({ booking } = {}, callback) {
  // const clientNumber = io.sockets.adapter.rooms[game.conversation];
  // const activeUsers = clientManager.filterClients(Object.keys(clientNumber.sockets))
  // client.to(chatroomName._id).emit('new',message)
  // client.to(chatroomName._id).emit('unread',message)
  chatroomManager.handleSlotAvailabilityWithCancellation(booking,client)
  // chatroomManager.saveMessages(message) 
  //chatroomManager.notifyAllUsersNotInTheChatroom(chatroomName, message,activeUsers)
  callback()

}


async function handleUpdateParams({ chatroomName, message,params } = {}, callback) {
  const clientNumber = io.sockets.adapter.rooms[chatroomName._id];
  const activeUsers = clientManager.filterClients(Object.keys(clientNumber.sockets))
  client.to(chatroomName._id).emit('new',message)
  client.to(chatroomName._id).emit('unread',message)
  const x  = await chatroomManager.updateParams(message,params)
  // chatroomManager.saveMessages(message) 
  chatroomManager.notifyAllUsersNotInTheChatroom(chatroomName, message,activeUsers)
  callback(x)

}


async function handleUpdateGroup({ chatroomName, message,members } = {}, callback) {
  const clientNumber = io.sockets.adapter.rooms[chatroomName._id];
  const activeUsers = clientManager.filterClients(Object.keys(clientNumber.sockets))
  client.to(chatroomName._id).emit('new',message)
  client.to(chatroomName._id).emit('unread',message)
  const x  = await chatroomManager.updateGroup(message,members)
  // chatroomManager.saveMessages(message) 
  chatroomManager.notifyAllUsersNotInTheChatroom(chatroomName, message,activeUsers)

  callback(x)

}

 async function handleMessage({ chatroomName, message } = {}, callback) {
    if(chatroomName.type === 'single'){
      const clientNumber = io.sockets.adapter.rooms[chatroomName._id].length;
      if(io.sockets.adapter.rooms[chatroomName._id].length < 2){
        if(chatroomName && chatroomName.exit){
          chatroomManager.registerExitedUser(chatroomName,message)
        }
        chatroomManager.saveMessage(message)
        chatroomManager.notifyAllUsers(chatroomName, message)
        
        callback()
      }else{
         const x = await chatroomName && chatroomName.exit && chatroomManager.registerExitedUser(chatroomName,message)
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
    
    if(game.ids.length > 0  || game.convo_ids.length > 0){
      let x = game.ids.length > 0 && await chatroomManager.sendInvites(game.game._id,game.game.conversation,game.ids,game.user_id,game.town,client)
      let y = game.convo_ids.length > 0 && await chatroomManager.sendGroupInvites(game.game._id,game.game.conversation,game.convo_ids,game.user_id,game.game.name,game.town,client)
      console.log('hit ',game.convo_ids)
      x.length > 0 && x.forEach((clientId)=>{
        const client =  clientManager.getClient(clientId)
       })
       y.length > 0 && y.forEach((clientId)=>{
         const client =  clientManager.getClient(clientId)
        })
        callback()
    } else{
      const z = await chatroomManager.makeTownTrue(game.game._id,game.town)
      
      callback(z)
    }
   
   
  }


  async function handleJoinGame(game,callback){
    const x = await chatroomManager.joinGame(game.game_id,game.id,client)
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

  return {handleSlotAvailabilityDueToCancellation,handleSlotAvailability,handleLeaveChatrooms,handleUpdateGroup,handleUpdateParams,handleUpdateImage,handleRegister, handleJoin, handleLeave, handleMessage, handleGetChatrooms, handleGetAvailableUsers, handleDisconnect, handleInvites, handleJoinGame,handleTyping,handleMessageGames}
}
