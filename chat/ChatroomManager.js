const Chatroom = require('./Chatroom')
const chatroomTemplates = require('./config/chatrooms')
const Conversation = require('../models/conversation');



module.exports = function () {
  // mapping of all available chatrooms
  const chatrooms = new Map(
    chatroomTemplates.map(c => [
      c._id,
      Chatroom(c)
    ])
  )
  function removeClient(client) {
    chatrooms.forEach(c => c.removeUser(client))
  }


  const myfunction = async function(obj){
    const conversation = await Conversation.create(obj).then(convo=>{
      return convo
       }).catch((err)=>{
         console.log(err.response);
       })
       return conversation
  }

   async function start(obj) {
    const result = await myfunction(obj);
    return result
  }
  

  async function getChatroomByName(chatroomName) {
      console.log('ME',chatroomName[0]);
      console.log('FRIEND',chatroomName[1]);
    const s = await Conversation.find({members:chatroomName}).limit(1).lean().then(existingConversation=>{
      return (existingConversation); 
      }).catch()
      if(s.length <= 0){
        const convo = await start({type:'single',members:chatroomName,created_by:chatroomName[0],to:chatroomName[1]})
        chatrooms.set(convo._id,Chatroom(convo))
        return chatrooms.get(convo._id)
      }else{
        console.log('hit',s[0]);
        chatrooms.set(s[0]._id,Chatroom(s[0]))
        return chatrooms.get(s[0]._id)
      } 
  }

 async function serializeChatrooms(id) {

  const s = await Conversation.find({members:{$in:[id]}}).lean().populate('to',' name _id profile_picture').populate('created_by',' name _id profile_picture').then(existingConversation=>{
    return (existingConversation); 
    }).catch()

    return s
  }

  return {
    removeClient,
    getChatroomByName,
    serializeChatrooms
  }
}
