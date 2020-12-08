const Chatroom = require('./Chatroom')
const chatroomTemplates = require('./config/chatrooms')
const Conversation = require('../models/conversation');
const Alert = require('../models/alerts');
const Post =  require('../models/post')
const Game = require('../models/game');
const Message = require('../models/message');
const User = require('../models/user');
const Venue = require('../models/venue');
const Booking  = require('./../models/booking')
const notify = require('../scripts/Notify')
const SlotsAvailable = require("../helper/slots_available")
const NotifyArray = require('../scripts/NotifyArray')
const NotifyArray1 = require('../scripts/NotifyArray1')
const Event = require('./../models/event')
const moment  = require('moment')
const _ = require('lodash')

module.exports = function () {
  // mapping of all available chatrooms
  const chatrooms = new Map(
    chatroomTemplates.map(c => [
      c._id,
      Chatroom(c)
    ])
  )

  function getRandomColor(){
    let colors = ["rgba(9,86,230,0.8)","#E76036","#D111BB","#3DAA1F","#27B5D1","#ff4c67","#9044F0"]
    return colors[Math.floor(Math.random() * colors.length)]
  }
  
  function getColors(members){
    let data = members.map((key,index)=>{
      let color = getRandomColor()
      return color
    })
    return data
  }
  function removeClient(client) {
    chatrooms.forEach(c => c.removeUser(client))
  }

  function groupChatMessage(admin,user){
    let message;
    if(admin == user){
      message = `${admin} created the club`
    }
    else{
      message = `${admin} added ${user} to the club`
    }
    return message
  }

  function groupChatMessage1(admin,user){
    let message;
    if(admin == user){
      message = `${admin} created the club`
    }
    else{
      message = `${admin} added you to the club`
    }
    return message
  }
  const saveConversation = async function(obj){
    const conversation = await Conversation.create(obj).then(convo=>{
     return User.find({_id: {$in : convo.members}},{activity_log:0,followers:0,following:0,}).then(users=> {
      const x = users.map((u)=>{ return ({user_id:u._id,last_active:u.last_active ? u.last_active : new Date()})})
       const y = users.map((u)=>{ return ({user_id:u._id,join_date:new Date()})})
       return Conversation.findByIdAndUpdate({_id:convo._id},{last_active:x,join_date:y}).then(conversation=>{
        return convo
       }).catch((e)=>console.log(e))
       }).catch((e)=>console.log(e))
       }).catch((err)=>{ console.log(err)})
       return conversation
  }

   async function saveConvo(obj) {
    const result = await saveConversation(obj);
    return result
  }

 async function getConversationAndSendBotMessage(convo,client){
 const x = await Conversation.findById({_id:convo._id}).populate('members','_id name device_token handle name_status').then((conversation1)=>{
      const messages =  conversation1.members.map((user)=> ({conversation:convo._id,message:groupChatMessage(conversation1.members[0].handle,user.handle),name:conversation1.members[0].handle,author:conversation1.members[0]._id,type:'bot',created_at:new Date()}))
      const messages1 =  conversation1.members.map((user)=> ({conversation:convo._id,message:groupChatMessage1(conversation1.members[0].handle,user.handle),name:conversation1.members[0].handle,author:conversation1.members[0]._id,type:'bot',created_at:new Date(),user_name:user.name}))
      
      return Message.insertMany(messages).then(message1=>{
              return Conversation.findByIdAndUpdate({_id:message1[message1.length-1].conversation},{last_message:message1[message1.length-1]._id,last_updated:new Date()}).then(conversation=>{
               return Conversation.findById({_id:message1[message1.length-1].conversation}).populate('members','_id name device_token profile_picture handle name_status').then((convo1)=>{
                console.log('hit asldkjasldkjalsdkajsldkaj')
                notifyParticularUsers(convo1,messages1,client)
                return 'pass'
             }).catch((e)=>{console.log(e)});
             }).catch((e)=>{console.log(e)});
             }).catch((e)=>{console.log(e)});
            }).catch((e)=>{console.log(e)});

     return x
  }


  async function checkIfUserExited(chatroomName){
    const filter  = chatroomName && chatroomName._id ? {_id:chatroomName._id,type:'single'} :{$or:[{members:chatroomName.members,type:'single'},{members:[chatroomName.members[1],chatroomName.members[0]],type:'single'}]}
    const s = await Conversation.find(filter).limit(1).lean().then(ec=>{
      if(ec && ec.length > 0){
        const existingConversation = ec[0]
        const exit_user_id = existingConversation && existingConversation.exit_list.length > 0 ? existingConversation.exit_list[existingConversation.exit_list.length-1].user_id : []
        if(  existingConversation.exit_list && existingConversation.exit_list.length>0){
          existingConversation.members =  existingConversation.members.concat(exit_user_id)
          existingConversation['exit'] = true
       
        }else{
          existingConversation['exit'] = false
        }
        return ([existingConversation]); 
      }else{
        let x = []
        return x
      }
     
      }).catch()
      return s
     // return []
  }
  

  async function getChatroomByName(chatroomName) {
      const s = await checkIfUserExited(chatroomName)
      if(s.length <= 0){
        const convo = await saveConvo({type:'single',members:chatroomName.members,created_by:chatroomName.members[0],to:chatroomName.members[1],invite_status:chatroomName.invite_status ?chatroomName.invite_status : false })
        chatrooms.set(convo._id,Chatroom(convo))
        return chatrooms.get(convo._id)
      }else{
        chatrooms.set(s[0]._id,Chatroom(s[0]))
        return chatrooms.get(s[0]._id)
      } 
  }

  async function getGroupOrGameName(chatroomName,client) {
      if(chatroomName._id.toString().length <= 0){
        const invites = chatroomName.invites ? chatroomName.invites : []
        const convo = await saveConvo({display_picture:chatroomName.image?chatroomName.image:'',colors:chatroomName.colors ? chatroomName.colors : [],type:chatroomName.type,name:chatroomName.name,members:chatroomName.members,created_by:chatroomName.members[0],host:[chatroomName.members[0]],invites:invites})
        chatrooms.set(convo._id,Chatroom(convo))
        const x = await getConversationAndSendBotMessage(convo,client)
        
        return chatrooms.get(convo._id)
      }else{
        chatrooms.set(chatroomName._id,Chatroom(chatroomName))
        return chatrooms.get(chatroomName._id)
      } 
  }

 async function serializeChatrooms(id) {

  const s = await Conversation.find({members:{$in:[id]}},{ name: 0, created_at: 0,last_updated:0,invites:0,host:0,last_active:0,members:0,last_message:0 }).lean().then(existingConversation=>{
    return (existingConversation); 
    }).catch()
    return s
  }

   function saveMessage(message) {
    Message.create(message).then(message1=>{
      Conversation.findByIdAndUpdate({_id:message1.conversation},{last_message:message1._id,last_updated:new Date()}).then(conversation=>{
      }).catch((e)=>{console.log(e)});
      }).catch((e)=>{console.log(e)});
    }

    async function saveAsyncMessage(message) {
      const x = await Message.create(message).then(message1=>{
       return Conversation.findByIdAndUpdate({_id:message1.conversation},{last_message:message1._id,last_updated:new Date()}).then(conversation=>{
        return message.type === 'game_request'? message:message1  
      }).catch((e)=>{console.log(e)});
        }).catch((e)=>{console.log(e)});
  
        return x
      }

    function registerExitedUser(conversation,message) {
      const x =  conversation.exit_list
      let user  =  x.length > 0 && x.filter((e)=>{ 
            if(e && e.user_id && e.user_id._id && e.user_id.toString() !== message.author.toString()){
              return e && e.user_id && e.user_id._id.toString() !== message.author.toString()
            }
            else if(e && e.user_id && e.user_id.toString() === message.author.toString()){
              return e && e.user_id && e.user_id.toString() == message.author.toString()
            }

          }).length > 0
          let user1  =  x.length > 0 && x.filter((e)=>{ 
            if(e && e.user_id && e.user_id._id && e.user_id.toString() !== message.author.toString()){
              return e && e.user_id && e.user_id._id.toString() !== message.author.toString()
            }
            else if(e && e.user_id && e.user_id.toString() === message.author.toString()){
              return e && e.user_id && e.user_id.toString() == message.author.toString()
            }

          })
        
      if(user && conversation.type === 'single'){
          conversation.members =  user && conversation.type==='single' ? conversation.members : conversation.members

        }
       // conversation.last_message = message._id
        Conversation.findById({_id:conversation._id}).then(conversation1=>{
          let id = conversation.hide_chat ? message.author.toString():user1[0].user_id._id 
          conversation.join_date =  user && conversation.type==='single' && conversation.exit_list.length > 0  ? conversation.join_date.concat([{user_id:id,join_date:conversation1.invite_status ? conversation.created_at:message.created_at}]) : conversation.join_date
          conversation.last_active =  user && conversation.type==='single' && conversation.exit_list.length > 0  ? conversation.last_active.concat([{user_id:id,last_active:conversation1.invite_status ? conversation.created_at:message.created_at}]) : conversation.last_active
          conversation.exit_list = []
         // conversation
          Conversation.findByIdAndUpdate({_id:conversation._id},conversation).then(conversation=>{

        }).catch((e)=>{console.log(e)})
      }).catch((e)=>{console.log(e)});

      }

    

    function saveMessages(message) {
      
      Message.insertMany(message).then(message1=>{
        Conversation.findByIdAndUpdate({_id:message1[message1.length-1].conversation},{last_message:message1[message1.length-1]._id,last_updated:new Date()}).then(conversation=>{
        }).catch((e)=>{console.log(e)});
        }).catch((e)=>{console.log(e)});
    }

    async function saveMessagesAndPopulate(message) {

     const x = await Message.insertMany(message).then(message1=>{
                   return Conversation.findByIdAndUpdate({_id:message1[message1.length-1].conversation},{last_message:message1[message1.length-1]._id,last_updated:new Date()}).then(conversation=>{
                      const message_ids = message1.map(m=>m._id)
                      return Message.find({_id: {$in : message_ids}}).lean().populate('author', 'name handle _id name_status').populate('user', 'name _id profile_picture phone handle name_status').populate({ path: 'game', populate:[ { path: 'conversation' , populate :{path:'last_message'} },{path:'venue', model:'venue',select:'venue'}] }).sort({ $natural: 1 }).then(m => {
                        return m
        }).catch((e)=>{console.log(e)});
      }).catch((e)=>{console.log(e)});
        }).catch((e)=>{console.log(e)});

        return x

    }


    function notifyOtherUsers(chatroom,message){
      const filter = chatroom.members.filter((member)=> member.toString() !== message.author.toString())
     User.findOne({_id: filter[0]},{activity_log:0}).then(user=> {
       notify(user,`${message.name}: ${message.message}`)
      }).catch((e)=>console.log(e))
    }

    function notifyAllUsers(chatroom,message,all_status){
      const filter = chatroom.members.filter((member)=>{ 
        const string  = member && member._id ? member._id.toString() : member.toString()
        if(!all_status){
          if(string !== message.author.toString()){
            return member
          }
        }else if(all_status){
          return member
        }
      })
       User.find({_id: {$in : filter}},{activity_log:0}).then(user=> {
        const s = message && message.image && message.image.length > 1 ?'s':''
        const messages = message.type === 'image' ? `${message.image.length} image${s} shared`: `${message.message}`
          // const messages1 = chatroom.type === 'single' ?  `${message.name}: ${messages}`:  `${message.name} @${chatroom.name}: ${messages}`
          // NotifyArray(user.map((u)=>u.device_token),messages1,"Turf Town",chatroom)

          const messages1 = chatroom.type === 'single' ?  `${messages}`:  `${messages}`
          const title = chatroom.type === 'single' ? `${message.name}` : `${chatroom.name}`
          NotifyArray(user.map((u)=>u.device_token),messages1,title,chatroom)
      }).catch((e)=>console.log(e))
    }

    function notifyParticularUsers(chatroom,message1,client){
      const filter = chatroom.members.filter((member)=>{ 
        const string  = member && member._id ? member._id.toString() : member.toString()
        if(string !== message1[0].author.toString()){
          return member
        }
      })
       User.find({_id: {$in : filter}},{activity_log:0}).then(user=> {

        const x = user.map((u)=>{
                    message1.map((message)=>{
                        if(u.name === message.user_name){
                          const s = message && message.image && message.image.length > 1 ?'s':''
                          const messages = message.type === 'image' ? `${message.image.length} image${s} has been shared`: `${message.message}`
                          const messages1 = chatroom.type === 'single' ?  `${messages}`:  `${messages}`
                          const title = chatroom.type === 'single' ? `${message.name}` : `${chatroom.name}`
                          client.broadcast.emit('unread', {});
                          NotifyArray([u.device_token],messages1,title,chatroom)
                        }
                    })
                 })
          
      }).catch((e)=>console.log(e))
    }


   async function notifyParticularUsersController(chatroom,message1,client){
        notifyAllUsers(chatroom,message1,false)
    }
    async function notifyParticularUsersController2(chatroom,message1,client){
      notifyAllUsers(chatroom,message1,true)
  }

   


    function notifyAllUsersNotInTheChatroom(chatroom,message,users){
      const x = Array.isArray(message)
      const filter = chatroom.members.filter((member)=>{ 
        const string  = member && member._id ? member._id.toString() : member.toString()
        const user_id = x? message[0].author : message.author
        users = users.concat([user_id])
        if(!users.includes(string)){
          return member
        }
      })
      if(filter.length > 0){

       User.find({_id: {$in : filter}},{activity_log:0}).lean().then(user=> {
          const final_user  = user.filter((u)=> u.mute.filter((u)=>u.toString() === chatroom._id.toString()).length <= 0)
        if(Array.isArray(message)){
          const s = message.length > 1 ?'s':''
          const messages = message[0].type === 'image' ? `${message.length} image${s}` : message[0].type === 'game' ? `${message.length} game${s} shared`:`${message.length} townie${s} shared`
          // const messages1 = chatroom.type === 'single' ?  `${message[0].name}: ${messages}`:  `${message[0].name} @${chatroom.name}: ${messages}`
          const messages1 = chatroom.type === 'single' ?  `${messages}`:  `${message[0].name}: ${messages}`
          const title = chatroom.type === 'single' ? `${message[0].name}` : `${chatroom.name}`
          let chatroom1 = Object.assign({},chatroom)
          chatroom1['exit_list'] = []
          chatroom1['join_date'] = []
          chatroom1['last_active'] = []
          chatroom1['last_message'] = {}
          NotifyArray(final_user.map((u)=>u.device_token),messages1,title,chatroom1)
        }else{
          const s = message && message.image && message.image.length > 1 ?'s':''
          const messages = message.type === 'image' ? `${message.image.length} image${s} shared`: `${message.message}`
          // const messages1 = chatroom.type === 'single' ?  `${message.name}: ${messages}`:  `${message.name} @${chatroom.name}: ${messages}`

          const messages1 = chatroom.type === 'single' ?  `${messages}`:  `${message.name}: ${messages}`
          const title = chatroom.type === 'single' ? `${message.name}` : `${chatroom.name}`          
         let chatroom1 = Object.assign({},chatroom)
         chatroom1['exit_list'] = []
         chatroom1['join_date'] = []
         chatroom1['last_active'] = []
         chatroom1['last_message'] = {}

          NotifyArray(final_user.map((u)=>u.device_token),messages1,title,chatroom1)

        }
      }).catch((e)=>console.log(e))
      }else{
        console.log('all active');
      }

    }

    function notifyAllUsersNotInTheChatroom1(chatroom2,message,users){
      console.log(chatroom2);
      const x = Array.isArray(message)
      Conversation.findById({_id:chatroom2}).lean().then((chatroom)=>{
        console.log('chatroom',chatroom);
      const filter = chatroom.members.filter((member)=>{ 
        const string  = member && member._id ? member._id.toString() : member.toString()
        const user_id = x? message[0].author : message.author
        users = users.concat([user_id])
        if(!users.includes(string)){
          return member
        }
      })
       User.find({_id: {$in : filter}},{activity_log:0}).lean().then(user=> {
          const final_user  = user.filter((u)=> u.mute.filter((u)=>u.toString() === chatroom._id.toString()).length <= 0)
        if(Array.isArray(message)){
          const s = message.length > 1 ?'s':''
          const messages = message[0].type === 'image' ? `${message.length} image${s}` : message[0].type === 'game' ? `${message.length} game${s} shared`:`${message.length} townie${s} shared`
          // const messages1 = chatroom.type === 'single' ?  `${message[0].name}: ${messages}`:  `${message[0].name} @${chatroom.name}: ${messages}`
          
          const messages1 = chatroom.type === 'single' ?  `${messages}`:  `${message[0].name}: ${messages}`
          const title = chatroom.type === 'single' ? `${message[0].name}` : `${chatroom.name}`
          let chatroom1 = Object.assign({},chatroom)
          chatroom1['exit_list'] = []
          chatroom1['join_date'] = []
          chatroom1['last_active'] = []
          chatroom1['last_message'] = {}
          NotifyArray(final_user.map((u)=>u.device_token),messages1,title,chatroom1)
        }else{
          const s = message && message.image && message.image.length > 1 ?'s':''
          const messages = message.type === 'image' ? `${message.image.length} image${s} shared`: `${message.message}`
          // const messages1 = chatroom.type === 'single' ?  `${message.name}: ${messages}`:  `${message.name} @${chatroom.name}: ${messages}`
          const messages1 = chatroom.type === 'single' ?  `${messages}`:  `${messages}`
          const title = chatroom.type === 'single' ? `${message.name}` : `${chatroom.name}`
          let chatroom1 = Object.assign({},chatroom)
          chatroom1['exit_list'] = []
          chatroom1['join_date'] = []
          chatroom1['last_active'] = []
          chatroom1['last_message'] = {}
          NotifyArray(final_user.map((u)=>u.device_token),messages1,title,chatroom1)

        }
      }).catch((e)=>console.log(e))
    }).catch((e)=>console.log(e))

    

    }

    function updateImage(message){
      Message.insertMany(message).then(message1=>{
        Conversation.findByIdAndUpdate({_id:message1[message1.length-1].conversation},{last_message:message1[message1.length-1]._id,last_updated:new Date(),display_picture:message.image}).then(conversation=>{
        }).catch((e)=>{console.log(e)});
        }).catch((e)=>{console.log(e)});
    }

    async function updateParams(message,params){
      let object_key = Object.keys(params)[0]
      let value = Object.values(params)[0]
     const x = Message.insertMany(message).then(message1=>{
        return Conversation.findByIdAndUpdate({_id:message1[message1.length-1].conversation},{last_message:message1[message1.length-1]._id,last_updated:new Date(),[object_key]:value}).then(conversation=>{
          return Conversation.findById({_id:message1[message1.length-1].conversation}).populate('host','name _id profile_picture last_active online_status status handle name_status visibility').populate('members','name _id profile_picture last_active online_status status handle name_status visibility').populate('last_message').then(conversation=>{
            return {conversation:conversation,message:message1}
          }).catch((e)=>{console.log(e)});
        }).catch((e)=>{console.log(e)});
        }).catch((e)=>{console.log(e)});
        return x
    }

    
    async function makeTownTrue(game_id,town){
     const x = await  Game.findByIdAndUpdate({_id:game_id},{town:town,town_date:new Date()}).then(game=>{

      return game
    }).catch((e)=>{console.log(e)});
    return x
    }

    

 async function updateGroup(message,members,client,chatroomName,colors){
   const x = await  Message.insertMany(message).then(message1=>{    
      return  Conversation.findById({_id:message.conversation}).then(conversation=>{
         
        conversation.members = conversation.members.length > 0 ?  conversation.members.concat(members) : members
          const new_join_date = members.map(m => {
            return {user_id:m.toString(),join_date:message1[0].created_at}
          })
          const new_last_active = members.map(m => {
            return {user_id:m.toString(),last_active:message1[0].created_at}
          })

          conversation.join_date = conversation.join_date.concat(new_join_date)
          conversation.last_active = conversation.last_active.concat(new_last_active)
          conversation.last_message = message1[message1.length-1]._id
          conversation.colors = conversation.colors.length > 0 ?  conversation.colors.concat(colors) : colors

          return Conversation.findByIdAndUpdate({_id:message1[message1.length-1].conversation},conversation ).then(conversation=>{
            return Conversation.findById({_id:message1[message1.length-1].conversation}).populate('members','name _id profile_picture last_active online_status status handle name_status').populate('last_message').then(conversation=>{
              client.to(chatroomName._id).emit('new',message)
              //client.emit('unread',message)
              //io.emit('unread', 'hello friends!');
              client.to(chatroomName._id).emit('unread',message)
              return {conversation:conversation,message:message1}
            }).catch((e)=>{console.log(e)});
      }).catch((e)=>{console.log(e)});

        }).catch((e)=>{console.log(e)});
      }).catch((e)=>{console.log(e)});
      return x
    }



    async function addMemberIntoTheClub(chatroomName,message,user_id,colors,client){
      const x = await Conversation.findById({_id:chatroomName._id}).lean().then((conversation)=>{
          let last_active_list = conversation.last_active.filter((a)=>a.user_id.toString() !== user_id.toString())
          let join_date_list = conversation.join_date.filter((a)=>a.user_id.toString() !== user_id.toString())
          last_active_list.push({user_id:user_id,last_active:message.created_at})
          join_date_list.push({user_id:user_id,join_date:message.created_at})
          conversation.members = conversation.members.concat(user_id)
          conversation.last_active = last_active_list
          conversation.join_date = join_date_list
          conversation.last_message = message._id
          //kumar ji line
          conversation.colors = conversation.colors.length > 0 ?  conversation.colors.concat(colors) : colors
         conversation.exit_list = conversation.exit_list.filter((a)=>a.user_id.toString() !== user_id.toString())
         return Conversation.findByIdAndUpdate({_id:message.conversation},conversation ).then(conversation=>{
        return Conversation.findById({_id:chatroomName._id}).lean().populate('members','name _id handle profile_picture name_status device_token').then((conversation)=>{
         return User.findById({_id:user_id}).then(user=>{
          client.in(conversation._id).emit('new',message)
           client.in(conversation._id).emit('unread',{})
           saveMessage(message)
           const token_list  = conversation.members.filter((a => a._id.toString() !==conversation.host[0].toString() ))
           const device_token_list = token_list.map((e) => e.device_token)
           console.log('conversation',conversation.host[0],token_list);
           
           NotifyArray(device_token_list,message.message,`${conversation.name}`,conversation)

           return conversation
        }).catch((e)=>{console.log(e)});
      }).catch((e)=>{console.log(e)});

      }).catch((e)=>{console.log(e)});
      }).catch((e)=>{console.log(e)});

         return x
       }


       async function deleteChatroom(chatroomName,client){
      const x = await Conversation.findByIdAndDelete({_id:chatroomName.convo_id._id}).lean().then((conversation)=>{
        return Game.findByIdAndDelete({_id:chatroomName.game_id},conversation ).then(conversation=>{
          
        return 'deleted'
      }).catch((e)=>{console.log(e)});
    }).catch((e)=>{console.log(e)});

         return x
       }
   

    async function setTownTrue(id){
             return Game.findByIdAndUpdate({_id:id},{town:true,town_date:new Date()} ).then(game=>{
              return game
                 }).catch((e)=>{console.log(e)});
       }

   async function sendInvites(game_id,conversation,ids,user_id,town,client){
    const convo = typeof(conversation) == "string" ? conversation : conversation._id
   const x = await  Game.findByIdAndUpdate({_id: game_id},{ $addToSet: { invites: { $each: ids } } ,$set:{town:town,town_date:new Date()} } ).then(game=> {
                return Conversation.findByIdAndUpdate({_id: convo},{ $addToSet: { invites: { $each: ids } } }).then(conversation1=> {
                  return Game.findById({_id: game_id}).then(game1=> {
                    const x = ids.map((id)=>{ return {"$or": [{members: [id,user_id]}, {members: [user_id,id]}],type:"single"}})
                    const members_list = ids.map((id)=>{ return {members :[id,user_id]} })
                    return Conversation.find({$or:x}).then(conversation2=> {
                          const conversation_list = conversation2.reduce((z,c)=>{ 
                                    c.members.forEach((mem)=>{ 
                                    if(z.indexOf(mem.toString())=== -1)  
                                      z.push(mem.toString())
                                    })
                                    return z
                          },[])
                            const list_with_no_convos = ids.map((id)=>{
                             if(conversation_list.indexOf(id) === -1){
                               return {members:[id,user_id],type:'single',created_by:user_id,last_active:[{user_id:id, last_active : new Date()},{user_id:user_id, last_active:new Date()}],join_date:[{user_id:id, join_date : new Date()},{user_id:user_id, join_date:new Date()}]}
                             }
                            })
                             return  Conversation.insertMany(list_with_no_convos).then((new_convos)=>{
                               return   User.findOne({_id: user_id },{activity_log:0}).lean().then(sender=> {
                                 return   User.find({_id: { $in :ids } },{activity_log:0}).lean().then(user=> {

                                      let messages =  new_convos.map((nc)=>{ return {conversation:nc._id,game:game_id,message:'Game invite',name:sender.handle,read_status:false,read_by:nc.members[0],author:user_id,type:'game',created_at:new Date()}}) 
                                        // let messages1 = conversation2.map((nc)=>{ 
                                           // client.to(nc._id.toString()).emit('new',{conversation:nc._id,game:game_id,message:`Game (${game1.name}) invite`,name:sender.name,read_status:false,read_by:nc.members[0],author:user_id,type:'game',created_at:new Date()})
                                          // return {conversation:nc._id,game:game_id,message:'Game invite',name:sender.name,read_status:false,read_by:nc.members[0],author:user_id,type:'game',created_at:new Date()}}) 
                                          let finalMessages = messages
                                          // .concat(messages1)
                                            return Message.insertMany(finalMessages).then(message1=>{
                                              const message_ids = message1.map((m)=>m._id)
                                              return Message.find({_id:{$in:message_ids}}).populate('author', 'name _id handle name_status').populate('user', 'name _id profile_picture handle phone name_status').populate({ path: 'game', populate:[ { path: 'conversation' , populate :{path:'last_message'} },{path:'venue', model:'venue',select:'venue'}] }).then(m => {
                                                const cids = m.map((entry)=>{
                                                  const id = entry && entry.conversation && entry.conversation._id ? entry.conversation._id :entry.conversation
                                                  client.to(id).emit('new',entry)
                                                  client.to(id).emit('unread',{})
                                                  return entry.conversation
                                                })

                                              return Conversation.updateMany({_id:{ $in: cids}},{$set:{last_message:message1[0]._id,last_updated:new Date()}}).then(message1=>{
                                                const device_token_list=user.map((e)=>e.device_token)
                                                NotifyArray1(device_token_list,`${sender.handle} invited you to join "${game1.name}"`,'Game Invite')
                                                    return user.map((e)=>e._id)
              //res.send({status:"success", message:"invitation sent"})
    }).catch((e)=>console.log(e));
  }).catch((e)=>console.log(e));
    }).catch((e)=>console.log(e));
   }).catch((e)=>console.log(e));
    }).catch((e)=>console.log(e));
     }).catch((e)=>console.log(e));
    }).catch((e)=>console.log(e));
    }).catch((e)=>console.log(e));
    }).catch((e)=>console.log(e));
    }).catch((e)=>console.log(e));
    return x
    }


    async function sendMessageOnetoMany(conversation_filter,ids,message,user_id,client){
      //const convo = typeof(conversation) == "string" ? conversation : conversation._id
     console.log(conversation_filter);
      const x = await Conversation.find({$or:conversation_filter}).then(conversation2=> {
      const conversation_list = conversation2.reduce((z,c)=>{ 
                c.members.forEach((mem)=>{ 
                if(z.indexOf(mem.toString())=== -1)  
                  z.push(mem.toString())
                })
                return z
      },[])
        const list_with_no_convos = ids.map((id)=>{
         if(conversation_list.indexOf(id) === -1){
           return {members:[id,user_id],type:'single',created_by:user_id,last_active:[{user_id:id, last_active : new Date()},{user_id:user_id, last_active:new Date()}],join_date:[{user_id:id, join_date : new Date()},{user_id:user_id, join_date:new Date()}]}
         }
        })
         return  Conversation.insertMany(list_with_no_convos).then((new_convos)=>{
           return   User.findOne({_id: user_id },{activity_log:0}).lean().then(sender=> {
             return   User.find({_id: { $in :ids } },{activity_log:0}).lean().then(user=> {

                  let messages =  new_convos.map((nc)=>{ return {conversation:nc._id,user:user_id,message:'Profile',name:sender.handle,read_status:false,read_by:nc.members[0],author:user_id,type:'profile',created_at:new Date()}}) 
                    // let messages1 = conversation2.map((nc)=>{ 
                       // client.to(nc._id.toString()).emit('new',{conversation:nc._id,game:game_id,message:`Game (${game1.name}) invite`,name:sender.name,read_status:false,read_by:nc.members[0],author:user_id,type:'game',created_at:new Date()})
                      // return {conversation:nc._id,game:game_id,message:'Game invite',name:sender.name,read_status:false,read_by:nc.members[0],author:user_id,type:'game',created_at:new Date()}}) 
                      let finalMessages = messages
                      // .concat(messages1)
                        return Message.insertMany(finalMessages).then(message1=>{
                          const message_ids = message1.map((m)=>m._id)
                          return Message.find({_id:{$in:message_ids}}).populate('author', 'name _id handle name_status').populate('user', 'name _id profile_picture handle phone name_status').populate({ path: 'game', populate: { path: 'conversation' , populate :{path:'last_message'} } }).then(m => {
                            const cids = m.map((entry)=>{
                              const id = entry && entry.conversation && entry.conversation._id ? entry.conversation._id :entry.conversation
                              client.to(id).emit('new',entry)
                              client.to(id).emit('unread',{})
                              return entry.conversation
                            })

                          return Conversation.updateMany({_id:{ $in: cids}},{$set:{last_message:message1[0]._id,last_updated:new Date()}}).then(message1=>{
                            const device_token_list=user.map((e)=>e.device_token)
                            NotifyArray(device_token_list,`Profile from ${sender.handle}`,'Turf Town')
                                return user.map((e)=>e._id)
//res.send({status:"success", message:"invitation sent"})
}).catch((e)=>console.log(e));
}).catch((e)=>console.log(e));
}).catch((e)=>console.log(e));
}).catch((e)=>console.log(e));
}).catch((e)=>console.log(e));
}).catch((e)=>console.log(e));
}).catch((e)=>console.log(e));
      // }).catch((e)=>console.log(e));
      return 'pass'
      }


    async function sendGroupInvites(game_id,conversation,group_ids,user_id,name,town,client){
      const convo = typeof(conversation) == "string" ? conversation : conversation._id
    const x = await Conversation.find({_id: {$in : group_ids}}).populate('members','_id name device_token handle name_status').lean().then(conversation1=> {
      return  Game.findById({_id: game_id}).then(ac_game=> {
      
      const c = conversation1.reduce((acc,l)=>{
            const x = l.members.map((c)=>c._id.toString())
          acc.push(x)
         return acc
        },[])
        const flatten_ids = _.flatten(c)
        const game_players = ac_game.users.length > 0 && ac_game.users.map((g)=>g._id.toString())
        const result1 = flatten_ids.filter(word => word.toString() !== user_id.toString() || game_players.indexOf(word.toString()) === -1);
        const result = result1.filter((a) => a.toString() !== user_id.toString())
        return  Game.findByIdAndUpdate({_id: game_id},{ $addToSet: { invites: { $each: result } } ,$set:{town:town,town_date:new Date()} } ).then(game=> {
          return Conversation.findByIdAndUpdate({_id: convo},{ $addToSet: { invites: { $each: result } } }).then(conversation12=> {
            return   User.findOne({_id: user_id },{activity_log:0}).lean().then(sender=> {
              return   User.find({_id: { $in :result } },{activity_log:0}).lean().then(user=> {
                 let finalMessages = conversation1.map((nc)=>{ 
                  return {conversation:nc._id,game:game_id,message:` Game invite`,name:sender.handle,read_status:false,read_by:group_ids[0],author:user_id,type:'game',created_at:new Date()}
                  }) 
                 return Message.insertMany(finalMessages).then(message1=>{
                  const message_ids = message1.map((m)=>m._id)
                  return Message.find({_id:{$in:message_ids}}).populate('author', 'name _id handle name_status').populate('user', 'name _id profile_picture phone handle name_status').populate({ path: 'game', populate: { path: 'conversation' , populate :{path:'last_message'} } }).then(m => {
                  const cids = m.map((entry)=>{
                    const id = entry && entry.conversation && entry.conversation._id ? entry.conversation._id :entry.conversation
                    client.to(id).emit('new',entry)
                    client.to(id).emit('unread',entry)

                    return m.conversation
                  })
                  return Conversation.updateMany({_id:{ $in: group_ids}},{$set:{last_message:message1[0]._id,last_updated:new Date()}}).then(message1=>{
                    const device_token_list=user.map((e)=>e.device_token)
                                                  NotifyArray1(device_token_list,`${sender.handle} invited you to join '${name}'`,'Game Invite')
                                                    return user.map((e)=>e._id)
                 // const x = await  Game.findByIdAndUpdate({_id: game_id},{ $addToSet: { invites: { $each: ids } } }).then(game=> {
      //  }).catch((e)=>console.log(e));
       }).catch((e)=>console.log(e));
      }).catch((e)=>console.log(e));
       }).catch((e)=>console.log(e));
      }).catch((e)=>console.log(e));
      }).catch((e)=>console.log(e));
      }).catch((e)=>console.log(e));
    }).catch((e)=>console.log(e));
  }).catch((e)=>console.log(e));
      }).catch((e)=>console.log(e));
       return x
       }

  async function sendConvoEventInvites(event_id, group_ids, user_id, name, town, client) {
    // const convo = typeof (conversation) == "string" ? conversation : conversation._id
    const x = await Conversation.find({ _id: { $in: group_ids } }).populate('members', '_id name device_token handle name_status').lean().then(conversation1 => {
      // return Game.findById({ _id: game_id }).then(ac_game => {

        const c = conversation1.reduce((acc, l) => {
          const x = l.members.map((c) => c._id.toString())
          acc.push(x)
          return acc
        }, [])
        const flatten_ids = _.flatten(c)
        // const game_players = ac_game.users.length > 0 && ac_game.users.map((g) => g._id.toString())
        const result = flatten_ids.filter(word => word.toString() !== user_id.toString());
        // return Game.findByIdAndUpdate({ _id: game_id }, { $addToSet: { invites: { $each: result } }, $set: { town: town, town_date: new Date() } }).then(game => {
          // return Conversation.findByIdAndUpdate({ _id: convo }, { $addToSet: { invites: { $each: result } } }).then(conversation12 => {
            return User.findOne({ _id: user_id }, { activity_log: 0 }).lean().then(sender => {
              return User.find({ _id: { $in: result } }, { activity_log: 0 }).lean().then(user => {
                let finalMessages = conversation1.map((nc) => { return { conversation: nc._id, event: event_id, message: `Event invite`, name: sender.handle, read_status: false, read_by: group_ids[0], author: user_id, type: 'event', created_at: new Date() } })
                return Message.insertMany(finalMessages).then(message1 => {
                  const message_ids = message1.map((m) => m._id)
                  return Message.find({ _id: { $in: message_ids } }).populate('author', 'name _id handle name_status').populate('user', 'name _id profile_picture phone handle name_status').populate({ path: 'event', populate:[ { path: 'conversation' , populate :{path:'last_message'} },{path:'venue', model:'venue',select:'venue'}]}).then(m => {
                    const cids = m.map((entry) => {
                      const id = entry && entry.conversation && entry.conversation._id ? entry.conversation._id : entry.conversation
                      client.to(id).emit('new', entry)
                      client.to(id).emit('unread', entry)

                      return m.conversation
                    })
                    return Conversation.updateMany({ _id: { $in: group_ids } }, { $set: { last_message: message1[0]._id, last_updated: new Date() } }).then(message1 => {
                      const device_token_list = user.map((e) => e.device_token)
                      NotifyArray1(device_token_list, `Event (${name}) from ${sender.handle}`, 'Event Invite')
                      return user.map((e) => e._id)
                    }).catch((e) => console.log(e));
                  }).catch((e) => console.log(e));
                }).catch((e) => console.log(e));
              }).catch((e) => console.log(e));
            }).catch((e) => console.log(e));
          }).catch((e) => console.log(e));
        // }).catch((e) => console.log(e));
      // }).catch((e) => console.log(e));
    // }).catch((e) => console.log(e));
    return x
  }

  async function sendEventInvites(event_id, ids, user_id, town, client) {
    // const convo = typeof (conversation) == "string" ? conversation : conversation._id
    const x = await Event.findByIdAndUpdate({ _id: event_id }).then(event => {
      // return Conversation.findByIdAndUpdate({ _id: convo }, { $addToSet: { invites: { $each: ids } } }).then(conversation1 => {
        // return Game.findById({ _id: game_id }).then(game1 => {

          const x = ids.map((id)=>{ return {"$or": [{members: [id,user_id]}, {members: [user_id,id]}],type:"single"}})
          // const members_list = ids.map((id)=>{ return {members :[id,user_id]} })
          return Conversation.find({$or:x}).then(conversation2=> {
                const conversation_list = conversation2.reduce((z,c)=>{ 
                          c.members.forEach((mem)=>{ 
                          if(z.indexOf(mem.toString())=== -1)  
                            z.push(mem.toString())
                          })
                          return z
                },[])

          const list_with_no_convos = ids.map((id) => {
            if (conversation_list.indexOf(id) === -1) {
              return { members: [id, user_id], type: 'single', created_by: user_id, last_active: [{ user_id: id, last_active: new Date() }, { user_id: user_id, last_active: new Date() }], join_date: [{ user_id: id, join_date: new Date() }, { user_id: user_id, join_date: new Date() }] }
            }
          })
          return Conversation.insertMany(list_with_no_convos).then((new_convos) => {
            return User.findOne({ _id: user_id }, { activity_log: 0 }).lean().then(sender => {
              return User.find({ _id: { $in: ids } }, { activity_log: 0 }).lean().then(user => {

                let messages = new_convos.map((nc) => { return { conversation: nc._id,event: event_id, message: 'Event invite', name: sender.handle, read_status: false, read_by: nc.members[0], author: user_id, type: 'event', created_at: new Date() } })
                let finalMessages = messages
                return Message.insertMany(finalMessages).then(message1 => {
                  const message_ids = message1.map((m) => m._id)
                  return Message.find({ _id: { $in: message_ids } }).populate('author', 'name _id handle name_status').populate('user', 'name _id profile_picture handle phone name_status').populate({ path: 'event', populate:[ { path: 'conversation' , populate :{path:'last_message'} },{path:'venue', model:'venue',select:'venue'}]}).then(m => {
                    const cids = m.map((entry) => {
                      const id = entry && entry.conversation && entry.conversation._id ? entry.conversation._id : entry.conversation
                      client.to(id).emit('new', entry)
                      client.to(id).emit('unread', entry)

                      return entry.conversation
                    })

                    return Conversation.updateMany({ _id: { $in: cids } }, { $set: { last_message: message1[0]._id, last_updated: new Date() } }).then(message1 => {
                      const device_token_list = user.map((e) => e.device_token)
                      NotifyArray1(device_token_list, `Event ${event.name} from ${sender.handle}`, 'Event Invite')
                      return user.map((e) => e._id)
                    }).catch((e) => console.log(e));
                  }).catch((e) => console.log(e));
                }).catch((e) => console.log(e));
              }).catch((e) => console.log(e));
            }).catch((e) => console.log(e));
          }).catch((e) => console.log(e));
        }).catch((e) => console.log(e));
      // }).catch((e) => console.log(e));
    }).catch((e) => console.log(e));
    return x
  }

  async function joinGame(game_id, userId,client) {
    let colors = getColors([userId])
    const x = await Game.findById({ _id: game_id }).lean().then(game1 => {
      return Conversation.findById({ _id: game1.conversation }).lean().then(conversation1 => {
        const conversation = Object.assign({}, conversation1)
        const game = Object.assign({}, game1)
        if(game && game.users &&  game.users.length > 0 && game.users.length < game.limit){
          if(!game.users.some((key) => key.toString() == userId.toString())){
        game.invites = game.invites.filter((key) => key.toString() !== userId.toString())
        game.users = game.users.some((key) => key.toString() == userId.toString()) ? game.users : game.users.concat(userId)
        conversation.invites = conversation.invites.filter((key) => key.toString() !== userId.toString())
        conversation.colors = conversation.members.some((key) => key.toString() == userId.toString()) ? conversation.colors : conversation.colors.concat(colors)
        conversation.members = conversation.members.some((key) => key.toString() == userId.toString()) ? conversation.members : conversation.members.concat(userId)
        conversation.last_active = conversation.last_active.some((key) => key.user_id.toString() == userId.toString()) ? conversation.last_active : conversation.last_active.concat({ "user_id": userId, last_active: new Date() })
        conversation.join_date = conversation.join_date.some((key) => key.user_id.toString() == userId.toString()) ? conversation.join_date.concat({ "user_id": userId, join_date: new Date() }) : conversation.join_date.concat({ "user_id": userId, join_date: new Date() })
        conversation.exit_list = conversation.exit_list && conversation.exit_list.length > 0 ?conversation.exit_list.filter((key) => key.user_id.toString() !== userId.toString()) : []
        return Game.findByIdAndUpdate({ _id: game_id }, { $set: game }).then(game2 => {
          return User.findById({ _id: userId }, { activity_log: 0, }).lean().then(user => {
          return Conversation.findByIdAndUpdate({ _id: game1.conversation }, { $set: conversation }).then(conversation3 => {
            return Conversation.findById({ _id: game.conversation }).lean().populate('members', '_id device_token handle name name_status').then(conversation2 => {
              const message_save ={ conversation: conversation2._id, message: `${user.handle} has joined the game`, read_status: false, name: user.handle, author: user._id, type: 'bot', created_at: new Date() }
              saveMessage(message_save)
                client.in(conversation2._id).emit('new',message_save)
                client.in(conversation2._id).emit('unread',message_save)
                
                const token_list  = conversation2.members.filter((a)=>a._id.toString() !== userId.toString())
                const device_token_list = token_list.map((e) => e.device_token)
                NotifyArray(device_token_list, `${user.handle} has joined the game`, `${game1.name}`,conversation1)
                return conversation2.members.map((e) => e._id)

                //res.send({status:"success", message:"invitation sent"})

              }).catch((e) => console.log(e));
            }).catch((e) => console.log(e));
          }).catch(error => console.log(error))
        }).catch(error => console.log(error))
     }else{
       return 'error_user_already_exists'
     }
    }else{
        return 'error_by_limit'
      }
      }).catch(error => console.log(error))
      
    }).catch(error => console.log(error))
    return x
  }

  async function joinGame1(game_id, userId,client) {
    let colors = getColors([userId])
    const x = await Game.findById({ _id: game_id }).lean().then(game1 => {
      return Conversation.findById({ _id: game1.conversation }).lean().then(conversation1 => {
        const conversation = Object.assign({}, conversation1)
        const game = Object.assign({}, game1)
        if(game && game.users &&  game.users.length > 0 && game.users.length < game.limit){
          if(!game.users.some((key) => key.toString() == userId.toString())){
        game.invites = game.invites.filter((key) => key.toString() !== userId.toString())
        game.users = game.users.some((key) => key.toString() == userId.toString()) ? game.users : game.users.concat(userId)
        conversation.invites = conversation.invites.filter((key) => key.toString() !== userId.toString())
        conversation.colors = conversation.members.some((key) => key.toString() == userId.toString()) ? conversation.colors : conversation.colors.concat(colors)
        conversation.members = conversation.members.some((key) => key.toString() == userId.toString()) ? conversation.members : conversation.members.concat(userId)
        conversation.last_active = conversation.last_active.some((key) => key.user_id.toString() == userId.toString()) ? conversation.last_active : conversation.last_active.concat({ "user_id": userId, last_active: new Date() })
        conversation.join_date = conversation.join_date.some((key) => key.user_id.toString() == userId.toString()) ? conversation.join_date : conversation.join_date.concat({ "user_id": userId, join_date: new Date() })
        conversation.exit_list = conversation.exit_list && conversation.exit_list.length > 0 ?conversation.exit_list.filter((key) => key.user_id.toString() !== userId.toString()) : []
        return Game.findByIdAndUpdate({ _id: game_id }, { $set: game }).then(game2 => {
          return User.findById({ _id: userId }, { activity_log: 0, }).lean().then(user => {
          return Conversation.findByIdAndUpdate({ _id: game1.conversation }, { $set: conversation }).then(conversation3 => {
            return Conversation.findById({ _id: game.conversation }).lean().populate('members', '_id device_token handle name name_status').then(conversation2 => {
              const message_save ={ conversation: conversation2._id, message: `${user.handle} has joined the game`, read_status: false, name: conversation2.members[0].handle, author: conversation2.members[0]._id, type: 'bot', created_at: new Date() }
                 saveMessage(message_save)
                client.in(conversation2._id).emit('new',message_save)
                client.in(conversation2._id).emit('unread',message_save)
                const token_list  = conversation2.members.filter((a)=>a._id.toString() == userId.toString())
                const token_list1  = conversation2.members.filter((a)=>a._id.toString() !== userId.toString()).map((e) => e.device_token)
                const device_token_list = token_list.map((e) => e.device_token)
                NotifyArray(device_token_list, `${conversation2.members[0].handle} has accepted your game request`, `${game1.name}`)
                NotifyArray(token_list1, `${user.handle} has joined the game`, `${game1.name}`)

                
                return conversation2.members.map((e) => e._id)

                //res.send({status:"success", message:"invitation sent"})

              }).catch((e) => console.log(e));
            }).catch((e) => console.log(e));
          }).catch(error => console.log(error))
        }).catch(error => console.log(error))
     }else{
       return 'error_user_already_exists'
     }
    }else{
        return 'error_by_limit'
      }
      }).catch(error => console.log(error))
      
    }).catch(error => console.log(error))
    return x
  }

  async function leaveChatroom(game1,client,client1) {
    const x = await Game.findById({ _id: game1.game_id }).lean().populate('conversation').then(game => {
      return User.findById({ _id: game1.user_id }, { activity_log: 0, }).lean().then(user => {
        const conversation = Object.assign({},game.conversation)
        const users_filter = game.users.filter((m)=> m.toString() !== game1.user_id.toString())
        const conversation_filter = conversation.members.filter((m)=> m.toString() !== game1.user_id.toString())
        const game_host_filter =  game.host.filter((m)=> m.toString() !== game1.user_id.toString())
        const conversation_host_filter =  conversation.host.filter((m)=> m.toString() !== game1.user_id.toString())
          game.users = users_filter
          conversation.members = conversation_filter
          conversation.host = conversation_host_filter.length > 0 ? conversation_host_filter : [conversation_filter[0]]
          game.host = game_host_filter.length > 0 ? game_host_filter : [users_filter[0]]
          conversation.exit_list = conversation.exit_list.concat({user_id:game1.user_id,timeStamp:new Date(),message:{ conversation: conversation._id, message: `${user.handle} has left the game`, read_status: false, name: user.handle, author: user._id, type: 'bot', created_at: new Date() }})
          return Game.findByIdAndUpdate({ _id: game1.game_id }, { $set: game }).then(game2 => {
            return  Post.deleteMany({created_by:game1.user_id,game:game1.game_id}).then(posts=> {
            return Conversation.findByIdAndUpdate({ _id: conversation._id }, { $set: conversation }).then(conversation2 => {
              return Conversation.findById({ _id: conversation._id }).lean().populate('members', '_id device_token handle name name_status').then(conversation2 => {
                return User.findById({ _id: game1.user_id }, { activity_log: 0, }).lean().then(user => {
                  let message_formation = game1.type == "game" ? `${user.handle} has left the game` : `${game1.host} has removed ${user.handle}` 
                  const save_message = { conversation: conversation2._id, message: message_formation, read_status: false, name: user.handle, author: user._id, type: 'bot', created_at: new Date() }
                  saveMessage(save_message)
                const token_list  = conversation2.members.filter((key) => key._id.toString() !== game1.user_id.toString())
                const device_token_list = token_list.map((e) => e.device_token)
                NotifyArray(device_token_list, message_formation, `${game.name}`,conversation2)
                client.in(conversation2._id).emit('unread',{})
                client.in(conversation2._id).emit('new',save_message)
                client1.to(game.conversation._id).emit('unread',{message:game1.type == "game" ? `${game1.host} has removed ${user.handle}` : `${game1.host} has removed ${user.handle}`,type:"delete" })
                return {message : save_message , type : conversation2.type,conversation:game.conversation}
       }).catch(error => console.log(error))
  }).catch(error => console.log(error))
}).catch(error => console.log(error))
}).catch(error => console.log(error))
}).catch(error => console.log(error))

}).catch(error => console.log(error))
}).catch(error => console.log(error))
    return x
  }


//   async function leaveChatroomAndUpdate(game1,client) {
//     const x = await Game.findById({ _id: game1.game_id }).lean().populate('conversation').then(game => {
//       return User.findById({ _id: game1.user_id }, { activity_log: 0, }).lean().then(user => {
//       const conversation = Object.assign({},game.conversation)
//          game.users = game.users.filter((m)=> m.toString() !== game1.user_id.toString())
//           conversation.members = conversation.members.filter((m)=> m.toString() !== game1.user_id.toString())
//           conversation.host = conversation.members.filter((m)=> m.toString() !== game1.user_id.toString()).length > 0 ? conversation.members.filter((m)=> m.toString() !== game1.user_id.toString())[0] : []
//           conversation.exit_list = conversation.exit_list.concat({user_id:game1.user_id,timeStamp:new Date(),message:{ conversation: conversation._id, message: `${user.name} has left the game`, read_status: false, name: user.name, author: user._id, type: 'bot', created_at: new Date() }})
//           game.host = game.users.filter((m)=> m.toString() !== game1.user_id.toString())
//           return Game.findByIdAndUpdate({ _id: game1.game_id }, { $set: game }).then(game2 => {
//              return Conversation.findByIdAndUpdate({ _id: conversation._id }, { $set: conversation }).then(conversation2 => {
//               return Conversation.findById({ _id: conversation._id }).lean().populate('members', '_id device_token handle name name_status').then(conversation2 => {
//                 return User.findById({ _id: game1.user_id }, { activity_log: 0, }).lean().then(user => {
//                   let message_formation = game1.type == "game" ? `${user.name} has left the game` : `${game1.host} has removed ${user.name}` 
//                   const save_message = { conversation: conversation2._id, message: message_formation, read_status: false, name: user.name, author: user._id, type: 'bot', created_at: new Date() }
//                   saveMessage(save_message)
//                 const token_list  = conversation2.members.filter((key) => key._id.toString() !== game1.user_id.toString())
//                 const device_token_list = token_list.map((e) => e.device_token)
//                 NotifyArray(device_token_list, message_formation, `Game Left`,conversation2)
//                 client.in(game1.convo_id).emit('new',save_message)
//                 client.in(game1.convo_id).emit('unread',{})

//                 return conversation2.members.map((e) => e._id)
//        }).catch(error => console.log(error))
//   }).catch(error => console.log(error))
// }).catch(error => console.log(error))
// }).catch(error => console.log(error))
// }).catch(error => console.log(error))
// }).catch(error => console.log(error))
//     return x
//   }


  async function kickPlayer(game1,client,client1) {
    const x = await Game.findById({ _id: game1.game_id }).lean().populate('conversation').then(game => {
                 return User.findById({ _id: game1.user_id }, { activity_log: 0, }).lean().then(user => {
                  return  Post.deleteMany({created_by:game1.user_id,game:game1.game_id}).then(posts=> {
                  const conversation = Object.assign({},game.conversation)
      const users_filter = game.users.filter((m)=> m.toString() !== game1.user_id.toString())
      const conversation_filter = conversation.members.filter((m)=> m.toString() !== game1.user_id.toString())
      const game_host_filter =  game.host.filter((m)=> m.toString() !== game1.user_id.toString())
      const conversation_host_filter =  conversation.host.filter((m)=> m.toString() !== game1.user_id.toString())
        game.users = users_filter
        conversation.members = conversation_filter
        conversation.host = conversation_host_filter.length > 0 ? conversation_host_filter : [conversation_filter[0]]
        game.host = game_host_filter.length > 0 ? game_host_filter : [users_filter[0]]
        conversation.exit_list = conversation.exit_list.concat({user_id:game1.user_id,timeStamp:new Date(),message:{ conversation: conversation._id, message: `${user.handle} has left the game`, read_status: false, name: user.handle, author: user._id, type: 'bot', created_at: new Date() }})
        return Game.findByIdAndUpdate({ _id: game1.game_id },{$set:game}).then(game2 => {
          return Conversation.findByIdAndUpdate({ _id: conversation._id }, { $set: conversation }).then(conversation2 => {
            return Conversation.findById({ _id: conversation._id }).lean().populate('members', '_id device_token handle name name_status').then(conversation2 => {
              return User.findById({ _id: game1.user_id }, { activity_log: 0, }).lean().then(user => {
                let message_formation = game1.type == "game" ? `${game1.host} has removed ${user.handle}` : `${game1.host} has removed ${user.handle}` 
                const save_message = { conversation: conversation2._id, message: message_formation, read_status: false, name: game1.host, author: game1.id, type: 'bot', created_at: new Date() }
                saveMessage(save_message)
                
                const token_list  = conversation2.members.filter((key) => key._id.toString() !== game1.id.toString())
                const device_token_list = token_list.map((e) => e.device_token)
                const user_device_token_list = [user.device_token]
                client.in(conversation2._id).emit('new',save_message)
                client1.to(game.conversation._id).emit('unread',{message:game1.type == "game" ? `${game1.host} @${game.name}:${game1.host} has removed ${user.handle}` : `${game1.host} @${game.name}:${game1.host} has removed ${user.handle}`,type:"delete",user_id:user._id,created_at:new Date() })
                // client1.to(conversation2._id).emit('unread',{})
                //notifyAllUsersNotInTheChatroom(conversation2, message_formation, `Game Left`,[game1.id.toString()])
                //NotifyArray(device_token_list, message_formation, `${game2.name}`,conversation2)
                 return{ message : save_message ,type:conversation2.type , conversation:game.conversation}
       }).catch(error => console.log(error))
  }).catch(error => console.log(error))
}).catch(error => console.log(error))
}).catch(error => console.log(error))
}).catch(error => console.log(error))
}).catch(error => console.log(error))
}).catch(error => console.log(error))

    return x
  }

  function SlotsCheck(body,id){
    return new Promise((resolve,reject)=>{
      Venue.findById({_id:id},{bank:0,access:0}).lean().then(venue=>{
        let venue_id;
        if(venue.secondary_venue){
          venue_id = [venue._id.toString(),venue.secondary_venue_id.toString()]
        }else{
          venue_id = [venue._id.toString()]
        }
        Booking.find({ venue:body.venue, venue_id:{$in:venue_id}, booking_date:body.booking_date, slot_time:body.slot_time,booking_status:{$in:["blocked","booked","completed"]}}).then(booking_history=>{
        // Booking.find({$and:[{venue:body.venue, venue_id:id, booking_date:{$gte:body.booking_date,$lt:moment(body.booking_date).add(1,"days")}}],booking_status:{$in:["booked","blocked","completed"]}}).then(booking_history=>{
          let slots_available = SlotsAvailable(venue,booking_history)
          if(slots_available.slots_available[body.slot_time][body.venue_type]>0){
            reject()
          }else{
            resolve(body.booking_id)
          }
        }).catch(error => console.log(error))
      }).catch(error => console.log(error))
    })
  }

  function SlotsCheckReverse(body,id){
    return new Promise((resolve,reject)=>{
      Venue.findById({_id:id},{bank:0,access:0}).lean().then(venue=>{
        let venue_id;
        if(venue.secondary_venue){
          venue_id = [venue._id.toString(),venue.secondary_venue_id.toString()]
        }else{
          venue_id = [venue._id.toString()]
        }
        Booking.find({ venue:body.venue, venue_id:{$in:venue_id}, booking_date:body.booking_date, slot_time:body.slot_time,booking_status:{$in:["blocked","booked","completed"]}}).then(booking_history=>{
        // Booking.find({$and:[{venue:body.venue, venue_id:id, booking_date:{$gte:body.booking_date,$lt:moment(body.booking_date).add(1,"days")}}],booking_status:{$in:["booked","blocked","completed"]}}).then(booking_history=>{
          let slots_available = SlotsAvailable(venue,booking_history)
          if(slots_available.slots_available[body.slot_time][body.venue_type]>0){
            resolve(body.booking_id)
          }else{
            reject()
          }
        }).catch(error => console.log(error))
      }).catch(error => console.log(error))
    })
  }


  async function handleSlotAvailabilityWithCancellation(booking1,client){
    let booking = booking1[0]
    const slot_time = { $in: booking1.map((b)=>b.slot_time) }
    const x =  await  Booking.find({  venue_id:booking.venue_id, booking_date:booking.booking_date,slot_time:slot_time,booking_status:{$in:["blocked","booked","completed"]}}).lean().then(booking_history=>{
      let promisesToRun = [];
          for(let i=0;i<booking_history.length;i++){
                promisesToRun.push(SlotsCheckReverse(booking_history[i],booking.venue_id))
              }
             return Promise.all(promisesToRun).then((values) => {
               return Game.updateMany({"bookings.booking_date":booking.booking_date,"bookings.booking_status":'blocked',"bookings.venue_id":booking.venue_id,"bookings.slot_time":slot_time },{$set:{status:true,status_description:''}}).lean().then(game1=>{
                 return Game.find({"bookings.booking_date":booking.booking_date,"bookings.booking_status":'blocked',"bookings.venue_id":booking.venue_id,"bookings.slot_time":slot_time }).lean().populate('conversation').then(game=>{
                  let messages =  game.map((nc)=>{ return {conversation:nc.conversation._id,game:nc._id,message:`Hey! Game ${nc.name} is available again. Please book your slot to confirm the game`,name:'bot',read_status:false,read_by:nc.conversation.members[0],author:nc.conversation.members[0],type:'bot',created_at:new Date()}}) 
                  const members = _.flatten(game.map((g)=>g.conversation.members))
                  return   User.find({_id: { $in :members } },{activity_log:0}).lean().then(user=> {
                  return Message.insertMany(messages).then(message1=>{
                    const message_ids = message1.map((m)=>m._id)
                    return Message.find({_id:{$in:message_ids}}).populate('author', 'name _id handle name_status').populate('user', 'name _id profile_picture phone handle name_status').populate({ path: 'game', populate: { path: 'conversation' , populate :{path:'last_message'} } }).then(m => {
                    const cids = m.map((entry)=>{
                      const id = entry && entry.conversation && entry.conversation._id ? entry.conversation._id :entry.conversation
                      Conversation.findByIdAndUpdate({_id:id},{$set:{last_message:entry._id, last_updated:new Date()}}).then((m)=>console.log('pass'))
                      client.to(id).emit('new',entry)
                      client.to(id).emit('unread','invites')
                      return id
                    })
                      const device_token_list=user.map((e)=>e.device_token)
                                                    NotifyArray1(device_token_list,'Hey! This game is available again. Please book your slot to confirm the game.','Game Availability')
                                                      return user.map((e)=>e._id)
                   }).catch((e)=>console.log(e));
                }).catch(error => console.log(error))
              }).catch(error => console.log(error))
            }).catch(error => console.log(error))
              }).catch(error => console.log(error))
            }).catch(error=>{
              console.log('hit error',error);
              return 'available'
              //res.send({status:"failed", message:"slots not available"})
            })
          }).catch(error => console.log(error))
  }


  async function handleSlotAvailability(convo_id,client){
    const string  = convo_id && convo_id._id ? convo_id._id.toString() : convo_id.toString()
    const x = await Conversation.findById({ _id: string }).populate('last_message').lean().then(conversation => {
      client.in(string).emit('new',conversation.last_message)
         client.in(string).emit('unread',conversation.last_message)
         //const io = client
         //const clientNumber = io.sockets.adapter.rooms[message.conversation];
    //const activeUsers = clientManager.filterClients(Object.keys(clientNumber.sockets))
         notifyAllUsers(conversation, conversation.last_message,true)
          }).catch(error => console.log(error))
  }


  async function getChatroomAndNotify(convo_id,message){
    
    const string  = convo_id && convo_id._id ? convo_id._id.toString() : convo_id.toString()
    const x = await Conversation.findById({ _id: string }).populate('last_message').lean().then(conversation => {
      // client.in(string).emit('new',conversation.last_message)
      //    client.in(string).emit('unread',conversation.last_message)
         notifyAllUsers(conversation, message,false)
         return 'pass'
          }).catch(error => console.log(error))
          return x
  }

  
  async function handleProfileAlerts(friend,client,y){
      // console.log("useree",user)
      // const device_token_list  = [user.device_token]
      const x = await  Alert.find({user: friend,status:true},{}).lean().populate('user','_id name device_token last_active email').then(alert=> {
       return User.findOne({_id: friend},{activity_log:0}).lean().then((user)=>{
        const alerts1 = alert && alert.length > 0 ? alert.filter(a=>moment(a.created_at).isAfter(user.last_active)) : []   
        // client.to(friend).emit('profile_handlers',{alert_count:alerts1.length,friend:friend})
        if(y.length > 0){
        client.to(y[y.length-1].client_id).emit('profile_handlers',{alert_count:alerts1.length,friend:friend})
        }
        return alerts1.length
      }).catch(error => console.log(error))
      }).catch(error => console.log(error))
      // NotifyArray(device_token_list, `following you`, `Turf Town`)
  return x
  }

  async function handleProfileAccepted(friend,client){
    // const device_token_list  = [user.device_token]
    const x = await  Alert.find({user: friend,status:true},{}).lean().populate('user','_id name device_token last_active email').then(alert=> {
     return User.findOne({_id: friend},{activity_log:0}).lean().then((user)=>{
      const alerts1 = alert && alert.length > 0 ? alert.filter(a=>moment(a.created_at).isAfter(user.last_active)) : []   
      // client.to(friend).emit('profile_handlers',{alert_count:alerts1.length,friend:friend})
      client.emit('profile_accepted_friend',{alert_count:alerts1.length,friend:friend})
      return alerts1.length
    }).catch(error => console.log(error))
    }).catch(error => console.log(error))
    // NotifyArray(device_token_list, `following you`, `Turf Town`)
return x
}

  async function leaveChatroomWithConversationId(game1,client) {
    const x = await Conversation.findById({ _id: game1.convo_id }).lean().then(conversation => {
      return User.findById({ _id: game1.user_id }, { activity_log: 0, }).lean().then(user => {
      conversation.members = conversation.members.filter((m)=> m.toString() !== game1.user_id.toString())
      conversation.host = conversation.host.filter((m)=> m.toString() !== game1.user_id.toString()).length > 0 ? conversation.host.filter((m)=> m.toString() !== game1.user_id.toString()) : [conversation.members[0]]
      conversation.exit_list = conversation.exit_list.concat({user_id:game1.user_id,timeStamp:new Date(),message:{ conversation: conversation._id, message: `${user.handle} has left the game`, read_status: false, name: user.handle, author: user._id, type: 'bot', created_at: new Date() }})
      
      return Game.findOne({ conversation: game1.convo_id }).then(game => {
        game.users = game.users.filter((m)=> m.toString() !== game1.user_id.toString())
        game.host = conversation.host
       return  Post.deleteMany({created_by:game1.user_id,game:game._id}).then(posts=> {
        return Game.findOneAndUpdate({ conversation: game1.convo_id }, { $set: game }).then(conversation2 => {
         return Conversation.findByIdAndUpdate({ _id: game1.convo_id }, { $set: conversation }).then(conversation2 => {
          return Conversation.findById({ _id: game1.convo_id }).lean().populate('members', '_id device_token handle name name_status').then(conversation2 => {
            return User.findById({ _id: game1.user_id }, { activity_log: 0, }).lean().then(user => {
              const save_message = { conversation: conversation2._id, message: `${user.handle} has left the game`, read_status: false, name: user.handle, author: user._id, type: 'bot', created_at: new Date() }
              saveMessage(save_message)
              const token_list  = conversation2.members.filter((key) => key._id.toString() !== game1.user_id.toString())
              const device_token_list = token_list.map((e) => e.device_token)
              NotifyArray(device_token_list, `${user.handle} has left the game`, `${game.name}`,conversation2)
              client.in(game1.convo_id).emit('new',save_message)
              client.in(game1.convo_id).emit('unread',{})
            return {message : save_message , type : conversation2.type,conversation:conversation2 }
   }).catch(error => console.log(error))
}).catch(error => console.log(error))
}).catch(error => console.log(error))
}).catch(error => console.log(error))
}).catch(error => console.log(error))
}).catch(error => console.log(error))
}).catch(error => console.log(error))
}).catch(error => console.log(error))
return x
  }

  async function leaveChatroomGroup(game1,client,client1) {
    const x = await Conversation.findById({ _id: game1.convo_id }).lean().then(conversation => {
      return User.findById({ _id: game1.user_id }, { activity_log: 0, }).lean().then(user => {
        const tot  = conversation.host.filter((m)=> m.toString() == game1.user_id.toString()).length > 0 ? true : false
        conversation.members = conversation.members.filter((m)=> m.toString() !== game1.user_id.toString())
        conversation.host = conversation.host.filter((m)=> m.toString() !== game1.user_id.toString()).length > 0 ? conversation.host.filter((m)=> m.toString() !== game1.user_id.toString()) : [conversation.members[0]]
        conversation.exit_list = conversation && conversation.exit_list ?  conversation.exit_list.concat({user_id:game1.user_id,timeStamp:new Date(),message:{ conversation: conversation._id, message:  `${user.handle} ${game1 && game1.status && game1.status === 'terminate' ? 'has been removed':'has left the club'}`, read_status: false, name: user.handle, author: user._id, type: 'bot', created_at: new Date() }}) :[{user_id:game1.user_id,timeStamp:new Date(),message:{ conversation: conversation._id, message: `${user.handle} ${game1 && game1.status && game1.status === 'terminate' ? 'has been removed':'has left the club'}`, read_status: false, name: user.handle, author: user._id, type: 'bot', created_at: new Date() }}]
        if((conversation.type === 'single' || conversation.type === 'group') && conversation.members.length <= 0){
          return Conversation.findById({ _id: game1.convo_id }).lean().populate('members', '_id device_token').then(conversation2 => {
            return Conversation.findByIdAndDelete({ _id: game1.convo_id }).then(conversation2 => {
                const message = { conversation: conversation2._id,message: `${user.handle} ${game1 && game1.status && game1.status === 'terminate' ? 'has been removed':'has left the club'}`, read_status: false, name: user.handle, author: user._id, type: 'bot', created_at: new Date() }
                
                conversation.type !== 'single' && saveMessage(message)
                conversation.type !== 'single' && client.in(conversation2._id).emit('new',{ conversation: conversation2._id, message: `${user.handle} has left the club`, read_status: false, name: user.handle, author: user._id, type: 'bot', created_at: new Date() })
                client.in(game1.convo_id).emit('unread',{})
                client.in(game1.convo_id).emit('new',{ conversation: conversation2._id,message: `${user.handle} ${game1 && game1.status && game1.status === 'terminate' ? 'has been removed':'has left the club'}`, read_status: false, name: user.handle, author: user._id, type: 'bot', created_at: new Date() })
                    return{ message : message ,type:conversation.type,conversation:conversation}
                  }).catch(error => console.log(error))
                }).catch(error => console.log(error))
           }
           else{
             return Conversation.findByIdAndUpdate({ _id: game1.convo_id }, { $set: {members:conversation.members,host:conversation.host,exit_list:conversation.exit_list} }).then(conversation2 => {
                 return Conversation.findById({ _id: game1.convo_id }).lean().populate('members', '_id device_token handle name name_status').populate('host', '_id device_token handle name name_status').then(conversation2 => {
                   return User.findById({ _id: game1.user_id }, { activity_log: 0, }).lean().then(user => {
                     const past_convos = conversation2 && conversation2.type === 'single' && user && user.convos ? user.convos : []
                     const final_cov =   past_convos.length > 0 ? past_convos.filter(a=>(a.conversation_id.toString() !== conversation2._id.toString()) && (a.user_id.toString() === game1.user_id.toString())) : []
                    const past_convos1 = final_cov.length > 0 ? final_cov.push({conversation_id:conversation2._id,user_id:conversation.members.filter((m)=> m.toString() !== game1.user_id.toString())[0]}) :[{conversation_id:conversation2._id,user_id:conversation.members.filter((m)=> m.toString() !== game1.user_id.toString())[0]}]
                     return User.findByIdAndUpdate({ _id: game1.user_id },{$set:{past_convos:past_convos1}}).lean().then(user => {
                      const x = { conversation: conversation2._id, message: `${user.handle} ${game1 && game1.status && game1.status === 'terminate' ? 'has been removed':'has left the club'+''}`, read_status: false, name: user.handle, author: user._id, type: 'bot', created_at: new Date() }
                      const message = { conversation: conversation2._id, message: `${user.handle} ${game1 && game1.status && game1.status === 'terminate' ? 'has been removed':'has left the club'+''}`, read_status: false, name: user.handle, author: user._id, type: 'bot', created_at: new Date() }
                      conversation2.type !== 'single' && saveMessage(message)
                   conversation2.type !== 'single' && client.to(conversation2._id).emit('new',{ conversation: conversation2._id, message: `${user.handle} ${game1 && game1.status && game1.status === 'terminate' ? 'has been removed':conversation2.type === 'single'? '':'has left the club'}`, read_status: false, name: user.handle, author: user._id, type: 'bot', created_at: new Date() })
                   const token_list  = conversation2.members.filter((key) => key._id.toString() !== conversation2.host[0]._id.toString())
                   let device_token_list = token_list.map((e) => e.device_token)
                  user && user.device_token && device_token_list.push(user.device_token)
                   client.in(conversation2._id).emit('unread',{})
                   conversation2.type !== 'single'  ? client.in(conversation2._id).emit('new',{type:'',exit:true,conversation:conversation2._id}) : client.in(conversation2._id).emit('new',x)
                   conversation2.type == 'single'  ?  client1.leave(conversation2._id) : null
                   conversation2.type !== 'single' && NotifyArray(device_token_list, `${user.handle} has left the club`, `${conversation2.name}`)
                   return { message : message ,type:conversation.type,conversation:conversation2}
          }).catch(error => console.log(error))
   }).catch(error => console.log(error))
   }).catch(error => console.log(error))
  }).catch(error => console.log(error))
           }
          }).catch(error => console.log(error))
}).catch(error => console.log(error))
    return x
  }


  async function leaveChatroomSingle(game1,client) {
    const x = await Conversation.findByIdAndDelete({ _id: game1.convo_id }).lean().then(conversation => {
      return User.findById({ _id: game1.user_id }, { activity_log: 0, }).lean().then(user => {
          const x = user && user.past_convos.length > 0 ? user.past_convos.filter((c)=> c.conversation_id && c.conversation_id !== game1.convo_id) : []
     if(user){
      return User.findByIdAndUpdate({ _id: game1.user_id }, {$set:{past_convos:x}}).lean().then(user => {
        //client.in(game1.convo_id).emit('unread',{})
        return 'pass'
      }).catch(error => console.log(error))
     }else{
      return 'no user'
     }
         
  }).catch(error => console.log(error))
    }).catch(error => console.log(error))
    return x
  }

  return {
    removeClient,
    getChatroomByName,
    getGroupOrGameName,
    leaveChatroom,
    checkIfUserExited,
    serializeChatrooms,
    leaveChatroomGroup,
    notifyOtherUsers,
    notifyAllUsers,
    sendMessageOnetoMany,
    registerExitedUser,
    saveAsyncMessage,
    saveMessage,
    saveMessages,
    sendInvites,
    kickPlayer,
    addMemberIntoTheClub,
    makeTownTrue,
    handleSlotAvailabilityWithCancellation,
    handleSlotAvailability,
    leaveChatroomWithConversationId,
    saveMessagesAndPopulate,
    notifyAllUsersNotInTheChatroom,
    notifyAllUsersNotInTheChatroom1,
    sendGroupInvites,
    joinGame,
    joinGame1,
    updateImage,
    setTownTrue,
    updateGroup,
    leaveChatroomSingle,
    updateParams,
    getChatroomAndNotify,
    deleteChatroom,
    handleProfileAlerts,
    sendEventInvites,
    notifyParticularUsersController2,
    notifyParticularUsersController,
    sendConvoEventInvites,
    handleProfileAccepted
  }
}
