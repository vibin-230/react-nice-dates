const Message = require('../models/message');
const verifyToken = require('../scripts/VerifySocket')
const members = new Map()
module.exports = function ({ _id, image }) {
  let chatHistory = []

   function broadcastMessage(message) {
     console.log('broadcast',members,members.size,message);
    
     if(members.size>0){
       const x = {conversation:message.chat,message:message.message,type:'text',author:message.user._id,name:message.user.name}
       Message.create(x).then(message=>{
          members.forEach(m =>{
            return m.emit('new', message)
         })
       }).catch((e)=>{console.log(e)});
  }else{
    
  }
  }

  function getId(){
    return _id
  }

  function addEntry(entry) {
    chatHistory = chatHistory.concat(entry)
  }

  async function getChatHistory(id,token) {
    console.log('getchat his',id,token)
    const user = await verifyToken(token) 
    console.log('user his',user)
    const x = await Conversation.findById({_id:id}).lean().then((conversation)=>{
                    console.log('get Chat history',user,conversation)
                    return Message.find({conversation:id}).lean().populate('author','name _id').populate({ path: 'game',populate: { path: 'conversation' }}).sort({$natural:1}).then(m=>{
                       
                    }).catch(err => console.log(err))
    }).catch(err => console.log(err))
    return x
  }


  function addUser(client) {
    members.set(client.id, client)

  }


  function removeUser(client) {
    members.delete(client.id)
  }

  

  function serialize() {
    return {
      _id,
      image,
      numMembers: members.size
    }
  }

  return {
    broadcastMessage,
    addEntry,
    getId,
    getChatHistory,
    addUser,
    removeUser,
    serialize
  }
}
