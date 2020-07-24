const Message = require('../models/message');
const Conversation = require('../models/conversation');

const verifyToken = require('../scripts/VerifySocket')
const moment = require('moment')
const members = new Map()
module.exports = function ({ _id, image }) {
  let chatHistory = []

   function broadcastMessage(message) {
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

  async function getChatHistory(id, token) {
    const user = await verifyToken(token)
    const x = await Conversation.findById({ _id: id }).lean().then((conversation) => {
      let date = conversation.join_date.length > 0 ? conversation.join_date.filter((jd) => jd.user_id.toString() === user.id.toString()) : []
      const x = conversation.members.filter((a)=>a.toString() === user.id.toString())
      const user1 =   conversation.exit_list && conversation.exit_list.length > 0 && conversation.exit_list.filter((a)=> a && a.user_id && a.user_id._id.toString() === user.id.toString())
      console.log(user,x,user1,x.length);
      const filter  = x.length > 0 ?  date && date.length > 0 ? { conversation: id, created_at: { $gte: date[date.length-1].join_date } } : { conversation: id} :{ conversation: id, created_at: { $lte: moment(user1[user1.length-1].timeStamp).add(10,'seconds') } }
      conversation['exit'] = x.length > 0 ? false:true
      console.log(filter,conversation);
      return Message.find(filter).lean().populate('author', 'name _id').populate('user', 'name _id profile_picture phone handle').populate({ path: 'game', populate: { path: 'conversation' , populate :{path:'last_message'} } }).sort({_id:-1}).limit(20).then(m => {
        return {messages:m.reverse(),conversation:conversation}
      }).catch((e) => console.log(e))
    }).catch((e) => console.log(e))

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
