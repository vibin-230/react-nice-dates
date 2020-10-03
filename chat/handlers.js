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
        //for single user
        //const y = await chatroomManager.checkIfUserExited({_id:chatroom.getId()})
        const x =  await chatroom.getChatHistory(chatroom.getId(),token)
        console.log('getCHatHistory',chatroom.getId(),x.length);
        callback(chatroom.getId(),x.messages,x.conversation)
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
    
    


    if(chatroomName.type === 'group'){
       x  = await chatroomManager.leaveChatroomGroup(chatroomName,io)
       console.log(x);
       if(x && x.type !== 'single'){
         const clientNumber = io.sockets.adapter.rooms[chatroomName._id];
         const activeUsers = clientNumber  ? clientManager.filterClients(Object.keys(clientNumber.sockets)) : []
         chatroomManager.notifyAllUsersNotInTheChatroom(x.conversation, x.message,activeUsers)
       }
    }

  else  if(chatroomName.type === 'delete'){
      x  = await chatroomManager.deleteChatroom(chatroomName,io)
   }
     else if(chatroomName.type === 'game_without_game_id'){
      x  = await chatroomManager.leaveChatroomWithConversationId(chatroomName,io)
      if(x && x.type !== 'single'){
        const clientNumber = io.sockets.adapter.rooms[chatroomName._id];
      const activeUsers = clientNumber  ? clientManager.filterClients(Object.keys(clientNumber.sockets)) : []
        chatroomManager.notifyAllUsersNotInTheChatroom(x.conversation, x.message,activeUsers)
      }
   }
   else if(chatroomName.type === 'kick_player'){
    x  = await chatroomManager.kickPlayer(chatroomName,io,client)
    if(x && x.type !== 'single'){
      const clientNumber = io.sockets.adapter.rooms[chatroomName._id];
      const activeUsers = clientNumber  ? clientManager.filterClients(Object.keys(clientNumber.sockets)) : []
      chatroomManager.notifyAllUsersNotInTheChatroom(x.conversation, x.message,activeUsers)
    }
 }
 else if(chatroomName.type === 'single'){
  x  = await chatroomManager.leaveChatroomSingle(chatroomName,client)
}
    else{
      x  = await chatroomManager.leaveChatroom(chatroomName,io)
      if(x && x.type !== 'single'){
        const clientNumber = io.sockets.adapter.rooms[chatroomName._id];
      const activeUsers = clientNumber  ? clientManager.filterClients(Object.keys(clientNumber.sockets)) : []
//      const activeUsers = clientManager.filterClients(Object.keys(clientNumber.sockets))
        chatroomManager.notifyAllUsersNotInTheChatroom(x.conversation, x.message,activeUsers)

      }
    }
    // x.forEach((clientId)=>{
    //   const client =  clientManager.getClient(clientId)
    //  })
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

async function handleSlotAvailability({ game } = {}, callback) {
  // const clientNumber = io.sockets.adapter.rooms[game.conversation];
  // const activeUsers = clientManager.filterClients(Object.keys(clientNumber.sockets))
  // client.to(chatroomName._id).emit('new',message)
  // client.to(chatroomName._id).emit('unread',message)
  chatroomManager.handleSlotAvailability(game.conversation,io)
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

async function handleProfileAlerts({friend} = {}, callback) {
  //const x  = await clientManager.getClient1(client,friend)
  //console.log(x,friend);
  const y = await chatroomManager.handleProfileAlerts(friend,io)
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


async function handleUpdateGroup({ chatroomName, message,members,colors } = {}, callback) {
  const clientNumber = io.sockets.adapter.rooms[chatroomName._id];
  const x  = await chatroomManager.addMemberIntoTheClub(chatroomName,message,members,colors,io)
  const activeUsers = clientManager.filterClients(Object.keys(clientNumber.sockets))
  //client.to(chatroomName._id).emit('new',message)
  //client.emit('unread',message)
  //io.emit('unread', 'hello friends!');
  //client.to(chatroomName._id).emit('unread',message)
  // chatroomManager.saveMessages(message) 
  chatroomManager.notifyAllUsersNotInTheChatroom(chatroomName, message,activeUsers)

  callback()

}

 async function handleMessage({ chatroomName, message } = {}, callback) {
    if(chatroomName.type === 'single'){
      if(io.sockets.adapter.rooms[chatroomName._id] && io.sockets.adapter.rooms[chatroomName._id].length < 2){
        if(chatroomName && chatroomName.exit){
          chatroomManager.registerExitedUser(chatroomName,message)
        }
        const clientNumber = io.sockets.adapter.rooms[chatroomName._id];
       const activeUsers = clientManager.filterClients(Object.keys(clientNumber.sockets))
       const y = await chatroomManager.saveAsyncMessage(message) 
       client.to(chatroomName._id).emit('new',y)
       client.to(chatroomName._id).emit('unread',y)
        chatroomManager.notifyAllUsersNotInTheChatroom(chatroomName, message,activeUsers)
        chatroomName.exit && chatroomName.type === 'single' ? callback({exit:false,message:y}):callback({message:y})
      }else{
         const x = await chatroomName && chatroomName.exit && chatroomManager.registerExitedUser(chatroomName,message)
         const y = await chatroomManager.saveAsyncMessage(message) 
        client.to(chatroomName._id).emit('new',y)
        client.to(chatroomName._id).emit('unread',y)
      
        //chatroomManager.notifyAllUsersNotInTheChatroom(chatroomName, message,[])
        //chatroomManager.notifyAllUsers(chatroomName, message)
        chatroomName.exit && chatroomName.type === 'single' ? callback({exit:false,message:y}):callback({message:y})
     }
    }else{
    const clientNumber = io.sockets.adapter.rooms[chatroomName._id];
    const activeUsers = clientManager.filterClients(Object.keys(clientNumber.sockets))
    console.log('pass',chatroomName._id,io.sockets.adapter.rooms);
    console.log('active Users',activeUsers)
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
      x && x.length > 0 && x.forEach((clientId)=>{
        const client =  clientManager.getClient(clientId)
       })
       y && y.length > 0 && y.forEach((clientId)=>{
         const client =  clientManager.getClient(clientId)
        })
        callback()
    } else{
      const z = await chatroomManager.makeTownTrue(game.game._id,game.town)
      
      callback(z)
    }
   
   
  }


  async function handleEventInvites(event,callback){ 
    if(event.ids.length > 0  || event.convo_ids.length > 0){
     let x = event.ids.length > 0 ? await chatroomManager.sendEventInvites(event.event._id,event.ids,event.user_id,event.town,client) : []
      let y = event.convo_ids.length > 0 ? await chatroomManager.sendConvoEventInvites(event.event._id,event.convo_ids,event.user_id,event.event.event.name,event.town,client) : []
      x && x.length > 0 && x.forEach((clientId)=>{
        const client =  clientManager.getClient(clientId)
       })
       y && y.length > 0 && y.forEach((clientId)=>{
         const client =  clientManager.getClient(clientId)
        })
        callback()
    } else{
      const z = await chatroomManager.makeTownTrue(game.game._id,game.town) 
      callback(z)
    } 
  }


  async function handleJoinGame(game,callback){
    const x = await chatroomManager.joinGame(game.game_id,game.id,io)
    x.forEach((clientId)=>{
     const client =  clientManager.getClient(clientId)
    })
    callback()
  }

  async function handleSendBroadcast(message,callback){
    
    const clientNumber = io.sockets.adapter.rooms[message.conversation];
    console.log(message,io.sockets.adapter.rooms);
    const activeUsers = clientManager.filterClients(Object.keys(clientNumber.sockets))
       io.in(message.conversation).emit('new',message)
        client.to(message.conversation).emit('unread',message)
        chatroomManager.saveMessage(message) 
       // chatroomManager.notifyAllUsersNotInTheChatroom(chatroomName, message,activeUsers)
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
  async function handleSendMultiple({ conversation_list, message,users } = {}, callback) {
    //client.to(chatroomName._id).emit('typing',message)
    const x = await chatroomManager.sendMessageOnetoMany(conversation_list,message,users,client)

    return callback()
  }

  return {handleSendBroadcast,handleSlotAvailabilityDueToCancellation,handleSlotAvailability,handleLeaveChatrooms,handleUpdateGroup,handleUpdateParams,handleUpdateImage,handleRegister, handleJoin, handleLeave, handleMessage, handleGetChatrooms, handleGetAvailableUsers, handleDisconnect, handleInvites, handleJoinGame,handleTyping,handleMessageGames,handleProfileAlerts,handleEventInvites,handleSendMultiple}
}
