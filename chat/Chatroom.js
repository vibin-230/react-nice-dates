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

  function parseDate(title){
    //.format('dddd, Do MMMM')
    const date = moment(title, "MM-DD-YYYY").format('ddd, Do MMM')
    const date1 = moment(title, "MM-DD-YYYY")
    const date_diff = moment().startOf('days').diff(date1,'days')
    if(date_diff === 0){
      return 'Today'
    }
    else if(date_diff === -1){
      return 'Tomorrow'
    }
    else if(date_diff === 1){
        return 'Yesterday'
      }
    else{
      return date

    }

  }

  async function getChatHistory(id, token) {
    const user = await verifyToken(token)
    const x = await Conversation.findById({ _id: id }).populate("members","name profile_picture handle name_status").populate("host","name profile_picture handle name_status").lean().then((conversation) => {
      let date = conversation.join_date.length > 0 ? conversation.join_date.filter((jd) => jd.user_id.toString() === user.id.toString()) : []
      const x = conversation.members.filter((a)=>a._id.toString() === user.id.toString())
      const user1 =   conversation.exit_list && conversation.exit_list.length > 0 && conversation.exit_list.filter((a)=> a && a.user_id && a.user_id._id.toString() === user.id.toString())
      console.log(user,x,user1,x.length);
      const filter  = x.length > 0 ?  date && date.length > 0 ? { conversation: id, created_at: { $gte: date[date.length-1].join_date } } : { conversation: id} :{ conversation: id, created_at: { $lte: moment(user1[user1.length-1].timeStamp).add(10,'seconds') } }
      conversation['exit'] = x.length > 0 ? false:true
      console.log(filter,conversation);
      return Message.find(filter).lean().populate('author', 'name _id handle').populate('user', 'name _id profile_picture phone handle').populate({path:"event",populate:{path:"venue",select:"venue"}}).populate({ path: 'game', populate: { path: 'conversation' , populate :{path:'last_message'} } }).sort({_id:-1}).limit(20).then(m => {
        for(let i = 1 ;i <m.length; i++){
          console.log('date ',moment(m[i].created_at).utc().format('MM-DD-YYYY'),'date 2',moment(m[i-1].created_at).utc().format('MM-DD-YYYY'));
          if( moment(m[i].created_at).utc().format('MM-DD-YYYY') !== moment(m[i-1].created_at).utc().format('MM-DD-YYYY')){
              m.splice(i,0,{conversation:conversation._id,message:parseDate(moment(m[i-1].created_at).utc().format('MM-DD-YYYY')),name:'bot',read_status:false,read_by:user.id,author:user.id,type:'bot',created_at:m[i].created_at})
          }

        }
       
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
