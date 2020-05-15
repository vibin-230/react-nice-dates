const Chatroom = require('./Chatroom')
const chatroomTemplates = require('./config/chatrooms')
const Conversation = require('../models/conversation');
const Game = require('../models/game');
const Message = require('../models/message');
const User = require('../models/user');
const notify = require('../scripts/Notify')
const NotifyArray = require('../scripts/NotifyArray')
const _ = require('lodash')

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

  function groupChatMessage(admin,user){
    let message;
    if(admin == user){
      message = `${admin} created the group`
    }
    else{
      message = `${admin} added ${user}`
    }
    return message
  }
  const saveConversation = async function(obj){
    const conversation = await Conversation.create(obj).then(convo=>{
     return User.find({_id: {$in : convo.members}},{activity_log:0,followers:0,following:0,}).then(users=> {
       const x = users.map((u)=>{ return ({user_id:u._id,last_active:u.last_active ? u.last_active : new Date()})})
       const y = users.map((u)=>{ return ({user_id:u._id,join_date:u.join_date ? u.join_date : new Date()})})
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

 async function getConversationAndSendBotMessage(convo){
 const x = await Conversation.findById({_id:convo._id}).populate('members','_id name device_token').then((conversation1)=>{
      const messages =  conversation1.members.map((user)=> ({conversation:convo._id,message:groupChatMessage(conversation1.members[0].name,user.name),name:conversation1.members[0].name,author:conversation1.members[0]._id,type:'bot',created_at:new Date()}))
            return Message.insertMany(messages).then(message1=>{
              return Conversation.findByIdAndUpdate({_id:message1[message1.length-1].conversation},{last_message:message1[message1.length-1]._id,last_updated:new Date()}).then(conversation=>{
                notifyAllUsers(convo,messages[0])
                return 'pass'
             }).catch((e)=>{console.log(e)});
             }).catch((e)=>{console.log(e)});
             }).catch((e)=>{console.log(e)});
     return x
  }
  

  async function getChatroomByName(chatroomName) {
    console.log('hit','pass')
    const s = await Conversation.find({members:chatroomName.members,type:'single'}).limit(1).lean().then(existingConversation=>{
      return (existingConversation); 
      }).catch()
      console.log(s)
      if(s.length <= 0){
        const convo = await saveConvo({type:'single',members:chatroomName.members,created_by:chatroomName.members[0],to:chatroomName.members[1]})
        chatrooms.set(convo._id,Chatroom(convo))
        return chatrooms.get(convo._id)
      }else{
        chatrooms.set(s[0]._id,Chatroom(s[0]))
        return chatrooms.get(s[0]._id)
      } 
  }

  async function getGroupOrGameName(chatroomName) {
       console.log('passkdljfs',chatroomName)
      if(chatroomName._id.toString().length <= 0){
        const convo = await saveConvo({display_picture:chatroomName.image?chatroomName.image:'',type:chatroomName.type,name:chatroomName.name,members:chatroomName.members,created_by:chatroomName.members[0],host:[chatroomName.members[0]]})
        chatrooms.set(convo._id,Chatroom(convo))
        console.log('hit new',convo);
        const x = await getConversationAndSendBotMessage(convo)
        
        return chatrooms.get(convo._id)
      }else{
        console.log('hit',chatroomName);
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
        console.log(conversation)
      }).catch((e)=>{console.log(e)});
      }).catch((e)=>{console.log(e)});
    }

    function saveMessages(message) {
      Message.insertMany(message).then(message1=>{
        Conversation.findByIdAndUpdate({_id:message1[message1.length-1].conversation},{last_message:message1[message1.length-1]._id,last_updated:new Date()}).then(conversation=>{
          console.log('save messages',conversation)
        }).catch((e)=>{console.log(e)});
        }).catch((e)=>{console.log(e)});
      }


    function notifyOtherUsers(chatroom,message){
      const filter = chatroom.members.filter((member)=> member.toString() !== message.author.toString())
      // console.log('filter',filter);
     User.findOne({_id: filter[0]},{activity_log:0}).then(user=> {
        console.log(user)
       notify(user,`${message.name} : ${message.message}`)
      }).catch((e)=>console.log(e))
    }

    function notifyAllUsers(chatroom,message){
      const filter = chatroom.members.filter((member)=>{ 
        const string  = member && member._id ? member._id.toString() : member.toString()
        if(string !== message.author.toString()){
          return member
        }
      })
      // console.log('filter',filter,message);
       User.find({_id: {$in : filter}},{activity_log:0}).then(user=> {
       const messages1 = chatroom.type === 'single' ?  `${message.name} : ${message.message}`:  `${message.name} @ ${chatroom.name} : ${message.message}`
       NotifyArray(user.map((u)=>u.device_token),messages1,"Turf Town")
      }).catch((e)=>console.log(e))
    }

    function notifyAllUsersNotInTheChatroom(chatroom,message,users){
      console.log('chatroom members =>>>>>',chatroom.members,users.length)
      const filter = chatroom.members.filter((member)=>{ 
        const string  = member && member._id ? member._id.toString() : member.toString()
        console.log('string', string,'\t status',users.includes(string));
        if(!users.includes(string) ){
          return member
        }
      })

       console.log('filter',filter);
       User.find({_id: {$in : filter}},{activity_log:0}).then(user=> {
       const messages1 = chatroom.type === 'single' ?  `${message.name} : ${message.message}`:  `${message.name} @ ${chatroom.name} : ${message.message}`
       NotifyArray(user.map((u)=>u.device_token),messages1,'Turf Town')
      }).catch((e)=>console.log(e))
    }


   async function sendInvites(game_id,conversation,ids,user_id,town){
   const x = await  Game.findByIdAndUpdate({_id: game_id},{ $addToSet: { invites: { $each: ids } } ,$set:{town:town} } ).then(game=> {
                return Conversation.findByIdAndUpdate({_id: conversation},{ $addToSet: { invites: { $each: ids } } }).then(conversation1=> {
                  return Game.findById({_id: game_id}).then(game1=> {
                    const x = ids.map((id)=>{ return { members :{$all:[id,user_id]},type:'single'}})
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
                               return {members:[id,user_id],type:'single',created_by:user_id,last_active:[{user_id:id, last_active : new Date()},{user_id:user_id, last_active:new Date()}]}
                             }
                            })
                            console.log('list with no convos',list_with_no_convos);
                             console.log('list with convos',conversation_list)
                             return  Conversation.insertMany(list_with_no_convos).then((new_convos)=>{
                               return   User.findOne({_id: user_id },{activity_log:0}).lean().then(sender=> {
                                 return   User.find({_id: { $in :ids } },{activity_log:0}).lean().then(user=> {
                                   console.log('new_conversations',new_convos);

                                      let messages =  new_convos.map((nc)=>{ return {conversation:nc._id,game:game_id,message:`New Game (${game1.name}) invitation from ${sender.name}`,name:sender.name,read_status:false,read_by:nc.members[0],author:user_id,type:'game',created_at:new Date()}}) 
                                        let messages1 = conversation2.map((nc)=>{ return {conversation:nc._id,game:game_id,message:`New Game (${game1.name}) invitation from ${sender.name}`,name:sender.name,read_status:false,read_by:nc.members[0],author:user_id,type:'game',created_at:new Date()}}) 
                                          let finalMessages = messages.concat(messages1)
                                            return Message.insertMany(finalMessages).then(message1=>{
                                              const cids = message1.map((m)=>m.conversation)
                                              return Conversation.updateMany({_id:{ $in: cids}},{$set:{last_message:message1[0]._id,last_updated:new Date()}}).then(message1=>{
                                                const device_token_list=user.map((e)=>e.device_token)
                                                  NotifyArray(device_token_list,`New Game (${game1.name}) invitation from ${sender.name}`,'Turftown Game Request')
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
    return x
    }


    async function sendGroupInvites(game_id,conversation,group_ids,user_id,name,town){
    const x = await Conversation.find({_id: {$in : group_ids}}).lean().populate('members','_id name device_token').then(conversation1=> {
         return  Game.findById({_id: game_id}).then(ac_game=> {
      
      const c = conversation1.reduce((acc,l)=>{
            const x = l.members.map((c)=>c._id.toString())
          acc.push(x)
         return acc
        },[])
        const flatten_ids = _.flatten(c)
        const game_players = ac_game.users.length > 0 && ac_game.users.map((g)=>g._id.toString())
        const result = flatten_ids.filter(word => word.toString() !== user_id.toString() || game_players.indexOf(word.toString()) === -1);
        return  Game.findByIdAndUpdate({_id: game_id},{ $addToSet: { invites: { $each: result } } ,$set:{town:town} } ).then(game=> {
          return Conversation.findByIdAndUpdate({_id: conversation},{ $addToSet: { invites: { $each: result } } }).then(conversation12=> {
            return   User.findOne({_id: user_id },{activity_log:0}).lean().then(sender=> {
              return   User.find({_id: { $in :flatten_ids } },{activity_log:0}).lean().then(user=> {
                 let finalMessages = conversation1.map((nc)=>{ return {conversation:nc._id,game:game_id,message:`New Game (${name}) invitation from ${sender.name}`,name:sender.name,read_status:false,read_by:group_ids[0],author:user_id,type:'game',created_at:new Date()}}) 
                 return Message.insertMany(finalMessages).then(message1=>{
                  const cids = message1.map((m)=>m.conversation)
                  return Conversation.updateMany({_id:{ $in: cids}},{$set:{last_message:message1[0]._id,last_updated:new Date()}}).then(message1=>{
                    const device_token_list=user.map((e)=>e.device_token)
                                                  NotifyArray(device_token_list,`New Game (${name}) invitation from ${sender.name}`,'Turftown Game Request')
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
       return x
       }

    


    async function joinGame(game_id,userId){
      console.log(game_id,userId)
      const x = await  Game.findByIdAndUpdate({_id: game_id},{ $pull: { invites: userId } }).then(game=> {
        return  Game.findByIdAndUpdate({_id: game_id},{ $addToSet: { users: { $each: [userId] } } }).then(game=> {
         return Conversation.findByIdAndUpdate({_id: game.conversation},{ $pull: { invites: userId } }).then(conversation1=> {
          return Conversation.findByIdAndUpdate({_id: game.conversation},{ $addToSet: { members: { $each: [userId] } } }).then(conversation1=> {
            return Conversation.findByIdAndUpdate({_id: game.conversation},{ $addToSet: { join_date: { $each: [{user_id:userId,join_date:new Date()}] } } },{ $addToSet: { last_active: { $each: [{user_id:userId,last_active:new Date()}] } } }).then(conversation1=> {
              console.log("convera",conversation1)
            //above to update below to show and save message
            return Conversation.findById({_id: game.conversation}).lean().populate('members','_id device_token').then(conversation2=> {
              return User.findById({_id: userId},{activity_log:0,}).lean().then(user=> {
                  saveMessage({conversation:conversation2._id,message:`${user.name} has joined the game`,read_status:false,name:user.name,author:user._id,type:'bot',created_at:new Date()}) 
                                 const device_token_list=conversation2.members.map((e)=>e.device_token)
                                 NotifyArray(device_token_list,`${user.name} has joined the game`,`New Game Joined`)
                                 return conversation2.members.map((e)=>e._id)
                                 
                 //res.send({status:"success", message:"invitation sent"})
     
      }).catch((e)=>console.log(e));
    }).catch((e)=>console.log(e));
      }).catch((e)=>console.log(e));
      }).catch((e)=>console.log(e));
        }).catch((e)=>console.log(e));
       }).catch((e)=>console.log(e));
       }).catch((e)=>console.log(e));
       return x
       }

  return {
    removeClient,
    getChatroomByName,
    getGroupOrGameName,
    serializeChatrooms,
    notifyOtherUsers,
    notifyAllUsers,
    saveMessage,
    sendInvites,
    notifyAllUsersNotInTheChatroom,
    sendGroupInvites,
    joinGame
  }
}
