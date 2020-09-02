const Chatroom = require('./Chatroom')
const chatroomTemplates = require('./config/chatrooms')
const Conversation = require('../models/conversation');
const Alert = require('../models/alerts');
const Game = require('../models/game');
const Message = require('../models/message');
const User = require('../models/user');
const Venue = require('../models/venue');
const Booking  = require('./../models/booking')
const notify = require('../scripts/Notify')
const SlotsAvailable = require("../helper/slots_available")
const NotifyArray = require('../scripts/NotifyArray')
const NotifyArray1 = require('../scripts/NotifyArray1')
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
      const messages =  conversation1.members.map((user)=> ({conversation:convo._id,message:groupChatMessage(conversation1.members[0].name,user.name),name:conversation1.members[0].name,author:conversation1.members[0]._id,type:'bot',created_at:new Date()}))
      const messages1 =  conversation1.members.map((user)=> ({conversation:convo._id,message:groupChatMessage1(conversation1.members[0].name,user.name),name:conversation1.members[0].name,author:conversation1.members[0]._id,type:'bot',created_at:new Date(),user_name:user.name}))
      
      return Message.insertMany(messages).then(message1=>{
              return Conversation.findByIdAndUpdate({_id:message1[message1.length-1].conversation},{last_message:message1[message1.length-1]._id,last_updated:new Date()}).then(conversation=>{
                notifyParticularUsers(convo,messages1,client)
                return 'pass'
             }).catch((e)=>{console.log(e)});
             }).catch((e)=>{console.log(e)});
             }).catch((e)=>{console.log(e)});
     return x
  }


  async function checkIfUserExited(chatroomName){
    const filter  = chatroomName && chatroomName._id ? {_id:chatroomName._id,type:'single'} :{$or:[{members:chatroomName.members,type:'single'},{members:[chatroomName.members[1],chatroomName.members[0]],type:'single'}]}
    const s = await Conversation.find(filter).limit(1).lean().then(ec=>{
      console.log(ec[0]);
      if(ec && ec.length > 0){
        const existingConversation = ec[0]
        const exit_user_id = existingConversation && existingConversation.exit_list.length > 0 ? existingConversation.exit_list[existingConversation.exit_list.length-1].user_id : []
        if(  existingConversation.exit_list && existingConversation.exit_list.length>0 && existingConversation.members.some((m)=>m.toString() !== exit_user_id.toString())){
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

    function registerExitedUser(conversation,message) {
        conversation.join_date = conversation.join_date.map((c)=>{
          if(conversation.exit_list.some((a)=>a.user_id.toString() === c.user_id.toString())){
            c['join_date'] = message.created_at
            return c
          }else{
            return c
          }
        })

        Conversation.findByIdAndUpdate({_id:conversation._id},conversation).then(conversation=>{

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
                      return Message.find({_id: {$in : message_ids}}).lean().populate('author', 'name handle _id name_status').populate('user', 'name _id profile_picture phone handle name_status').populate({ path: 'game', populate: { path: 'conversation' , populate :{path:'last_message'} } }).sort({ $natural: 1 }).then(m => {
                        return m
        }).catch((e)=>{console.log(e)});
      }).catch((e)=>{console.log(e)});
        }).catch((e)=>{console.log(e)});

        return x

    }


    function notifyOtherUsers(chatroom,message){
      const filter = chatroom.members.filter((member)=> member.toString() !== message.author.toString())
      // console.log('filter',filter);
     User.findOne({_id: filter[0]},{activity_log:0}).then(user=> {
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
        const s = message && message.image && message.image.length > 1 ?'s':''
        const messages = message.type === 'image' ? `${message.image.length} image${s} has been shared`: `${message.message}`
          const messages1 = chatroom.type === 'single' ?  `${message.name} : ${messages}`:  `${message.name} @ ${chatroom.name} : ${messages}`
       NotifyArray(user.map((u)=>u.device_token),messages1,"Turf Town",chatroom)
      }).catch((e)=>console.log(e))
    }

    function notifyParticularUsers(chatroom,message1,client){
      const filter = chatroom.members.filter((member)=>{ 
        const string  = member && member._id ? member._id.toString() : member.toString()
        if(string !== message1[0].author.toString()){
          return member
        }
      })
       console.log('filter',filter,message1,chatroom.members);
       User.find({_id: {$in : filter}},{activity_log:0}).then(user=> {

        const x = user.map((u)=>{
                    message1.map((message)=>{
                        if(u.name === message.user_name){
                          const s = message && message.image && message.image.length > 1 ?'s':''
                          const messages = message.type === 'image' ? `${message.image.length} image${s} has been shared`: `${message.message}`
                          const messages1 = chatroom.type === 'single' ?  `${message.name} : ${messages}`:  `${message.name} @ ${chatroom.name} : ${messages}`
                          client.broadcast.emit('unread', {});
                          NotifyArray([u.device_token],messages1,"Turf Town",chatroom)
                        }
                    })
                 })
          
      }).catch((e)=>console.log(e))
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

       User.find({_id: {$in : filter}},{activity_log:0}).lean().then(user=> {
        const final_user  = user.filter((u)=> u.mute.filter((u)=>u.toString() === chatroom._id.toString()).length <= 0)
        console.log(final_user.length,chatroom._id.toString());
        if(Array.isArray(message)){
          const s = message.length > 1 ?'s':''
          const messages = message[0].type === 'image' ? `${message.length} image${s}` : message[0].type === 'game' ? `${message.length} game${s} has been shared`:`${message.length} townie${s} has been shared`
          const messages1 = chatroom.type === 'single' ?  `${message[0].name} : ${messages}`:  `${message[0].name} @ ${chatroom.name} : ${messages}`
          NotifyArray(final_user.map((u)=>u.device_token),messages1,'Turf Town',chatroom)
        }else{
          const s = message && message.image && message.image.length > 1 ?'s':''
          const messages = message.type === 'image' ? `${message.image.length} image${s} has been shared`: `${message.message}`
          const messages1 = chatroom.type === 'single' ?  `${message.name} : ${messages}`:  `${message.name} @ ${chatroom.name} : ${messages}`
          NotifyArray(final_user.map((u)=>u.device_token),messages1,'Turf Town',chatroom)

        }
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
          return Conversation.findById({_id:message1[message1.length-1].conversation}).populate('members','name _id profile_picture last_active online_status status handle name_status').populate('last_message').then(conversation=>{
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
        console.log('addMemberIntoTheClub',chatroomName._id,message,user_id,colors)
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
         return User.findById({_id:user_id}).then(user=>{
          client.in(conversation._id).emit('new',message)
           client.in(conversation._id).emit('unread',{})
           saveMessage(message)
           NotifyArray([user.device_token],message.message,'New Club Added',conversation)

           return conversation
        }).catch((e)=>{console.log(e)});
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
                    // const x = ids.map((id)=>{ return { members :{$in:[id,user_id]},type:'single'}})
                    // const members_list = ids.map((id)=>{ return {members :[id,user_id]} })
                    // return Conversation.find({$or:x}).then(conversation2=> {
                    //       const conversation_list = conversation2.reduce((z,c)=>{ 
                    //                 c.members.forEach((mem)=>{ 
                    //                 if(z.indexOf(mem.toString())=== -1)  
                    //                   z.push(mem.toString())
                    //                 })
                    //                 return z
                    //       },[])
                            const list_with_no_convos = ids.map((id)=>{
                             if(conversation_list.indexOf(id) === -1){
                               return {members:[id,user_id],type:'single',created_by:user_id,last_active:[{user_id:id, last_active : new Date()},{user_id:user_id, last_active:new Date()}],join_date:[{user_id:id, join_date : new Date()},{user_id:user_id, join_date:new Date()}]}
                             }
                            })
                             return  Conversation.insertMany(list_with_no_convos).then((new_convos)=>{
                               return   User.findOne({_id: user_id },{activity_log:0}).lean().then(sender=> {
                                 return   User.find({_id: { $in :ids } },{activity_log:0}).lean().then(user=> {

                                      let messages =  new_convos.map((nc)=>{ return {conversation:nc._id,game:game_id,message:'Game invite',name:sender.name,read_status:false,read_by:nc.members[0],author:user_id,type:'game',created_at:new Date()}}) 
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
                                                  return entry.conversation
                                                })

                                              return Conversation.updateMany({_id:{ $in: cids}},{$set:{last_message:message1[0]._id,last_updated:new Date()}}).then(message1=>{
                                                const device_token_list=user.map((e)=>e.device_token)
                                                console.log('onversation',message1);
                                                NotifyArray(device_token_list,`Game (${game1.name}) from ${sender.name}`,'Turftown Game Request')
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
    // }).catch((e)=>console.log(e));
    return x
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
        const result = flatten_ids.filter(word => word.toString() !== user_id.toString() || game_players.indexOf(word.toString()) === -1);
        return  Game.findByIdAndUpdate({_id: game_id},{ $addToSet: { invites: { $each: result } } ,$set:{town:town,town_date:new Date()} } ).then(game=> {
          return Conversation.findByIdAndUpdate({_id: convo},{ $addToSet: { invites: { $each: result } } }).then(conversation12=> {
            return   User.findOne({_id: user_id },{activity_log:0}).lean().then(sender=> {
              return   User.find({_id: { $in :result } },{activity_log:0}).lean().then(user=> {
                 let finalMessages = conversation1.map((nc)=>{ return {conversation:nc._id,game:game_id,message:` Game invite`,name:sender.name,read_status:false,read_by:group_ids[0],author:user_id,type:'game',created_at:new Date()}}) 
                 return Message.insertMany(finalMessages).then(message1=>{
                  const message_ids = message1.map((m)=>m._id)
                  return Message.find({_id:{$in:message_ids}}).populate('author', 'name _id handle name_status').populate('user', 'name _id profile_picture phone handle name_status').populate({ path: 'game', populate: { path: 'conversation' , populate :{path:'last_message'} } }).then(m => {
                  const cids = m.map((entry)=>{
                    const id = entry && entry.conversation && entry.conversation._id ? entry.conversation._id :entry.conversation
                    client.to(id).emit('new',entry)
                    return m.conversation
                  })
                  return Conversation.updateMany({_id:{ $in: group_ids}},{$set:{last_message:message1[0]._id,last_updated:new Date()}}).then(message1=>{
                    const device_token_list=user.map((e)=>e.device_token)
                                                  NotifyArray(device_token_list,`Game (${name}) from ${sender.name}`,'Turftown Game Request')
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
                let finalMessages = conversation1.map((nc) => { return { conversation: nc._id, event: event_id, message: `Event invite`, name: sender.name, read_status: false, read_by: group_ids[0], author: user_id, type: 'event', created_at: new Date() } })
                return Message.insertMany(finalMessages).then(message1 => {
                  const message_ids = message1.map((m) => m._id)
                  return Message.find({ _id: { $in: message_ids } }).populate('author', 'name _id handle name_status').populate('user', 'name _id profile_picture phone handle name_status').populate({path:"event"}).populate( { path: 'conversation', populate: { path: 'last_message' } }).then(m => {
                    const cids = m.map((entry) => {
                      const id = entry && entry.conversation && entry.conversation._id ? entry.conversation._id : entry.conversation
                      client.to(id).emit('new', entry)
                      return m.conversation
                    })
                    return Conversation.updateMany({ _id: { $in: group_ids } }, { $set: { last_message: message1[0]._id, last_updated: new Date() } }).then(message1 => {
                      const device_token_list = user.map((e) => e.device_token)
                      NotifyArray(device_token_list, `Event (${name}) from ${sender.name}`, 'Turftown Event')
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
          const list_with_no_convos = ids.map((id) => {
            if (conversation_list.indexOf(id) === -1) {
              return { members: [id, user_id], type: 'single', created_by: user_id, last_active: [{ user_id: id, last_active: new Date() }, { user_id: user_id, last_active: new Date() }], join_date: [{ user_id: id, join_date: new Date() }, { user_id: user_id, join_date: new Date() }] }
            }
          })
          return Conversation.insertMany(list_with_no_convos).then((new_convos) => {
            return User.findOne({ _id: user_id }, { activity_log: 0 }).lean().then(sender => {
              return User.find({ _id: { $in: ids } }, { activity_log: 0 }).lean().then(user => {

                let messages = new_convos.map((nc) => { return { conversation: nc._id,event: event_id, message: 'Event invite', name: sender.name, read_status: false, read_by: nc.members[0], author: user_id, type: 'event', created_at: new Date() } })
                let finalMessages = messages
                return Message.insertMany(finalMessages).then(message1 => {
                  const message_ids = message1.map((m) => m._id)
                  return Message.find({ _id: { $in: message_ids } }).populate('author', 'name _id handle name_status').populate('user', 'name _id profile_picture handle phone name_status').populate({ path: 'event', populate: { path: 'conversation', populate: { path: 'last_message' } } }).then(m => {
                    const cids = m.map((entry) => {
                      const id = entry && entry.conversation && entry.conversation._id ? entry.conversation._id : entry.conversation
                      client.to(id).emit('new', entry)
                      console.log(m, 'pass');
                      return entry.conversation
                    })

                    return Conversation.updateMany({ _id: { $in: cids } }, { $set: { last_message: message1[0]._id, last_updated: new Date() } }).then(message1 => {
                      const device_token_list = user.map((e) => e.device_token)
                      console.log('onversation', message1);
                      NotifyArray(device_token_list, `Event (${event.name}) from ${sender.name}`, 'Turftown Event Request')
                      return user.map((e) => e._id)
                    }).catch((e) => console.log(e));
                  }).catch((e) => console.log(e));
                }).catch((e) => console.log(e));
              }).catch((e) => console.log(e));
            }).catch((e) => console.log(e));
          }).catch((e) => console.log(e));
        }).catch((e) => console.log(e));
      // }).catch((e) => console.log(e));
    // }).catch((e) => console.log(e));
    return x
  }

  async function joinGame(game_id, userId,client) {
    let colors = getColors([userId])
    const x = await Game.findById({ _id: game_id }).lean().then(game1 => {
      return Conversation.findById({ _id: game1.conversation }).lean().then(conversation1 => {
        const conversation = Object.assign({}, conversation1)
        const game = Object.assign({}, game1)
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
          return Conversation.findByIdAndUpdate({ _id: game1.conversation }, { $set: conversation }).then(conversation2 => {
            return Conversation.findById({ _id: game.conversation }).lean().populate('members', '_id device_token handle name name_status').then(conversation2 => {
              const message_save ={ conversation: conversation2._id, message: `${user.name} has joined the game`, read_status: false, name: user.name, author: user._id, type: 'bot', created_at: new Date() }
              saveMessage(message_save)
                client.in(conversation2._id).emit('new',message_save)
                client.in(conversation2._id).emit('unread',message_save)
                const token_list  = conversation2.members.filter((key) => key._id.toString() !== userId.toString())
                const device_token_list = token_list.map((e) => e.device_token)
                NotifyArray(device_token_list, `${user.name} has joined ${game1.name}`, `Turf Town`,conversation2)
                return conversation2.members.map((e) => e._id)

                //res.send({status:"success", message:"invitation sent"})

              }).catch((e) => console.log(e));
            }).catch((e) => console.log(e));
          }).catch(error => console.log(error))
        }).catch(error => console.log(error))
      }).catch(error => console.log(error))
    }).catch(error => console.log(error))
    return x
  }

  async function leaveChatroom(game1,client) {
    const x = await Game.findById({ _id: game1.game_id }).lean().populate('conversation').then(game => {
      return User.findById({ _id: game1.user_id }, { activity_log: 0, }).lean().then(user => {
      const conversation = Object.assign({},game.conversation)
         game.users = game.users.filter((m)=> m.toString() !== game1.user_id.toString())
          conversation.members = conversation.members.filter((m)=> m.toString() !== game1.user_id.toString())
          conversation.host = conversation.members.filter((m)=> m.toString() !== game1.user_id.toString()).length > 0 ? conversation.members.filter((m)=> m.toString() !== game1.user_id.toString())[0] : []
          conversation.exit_list = conversation.exit_list.concat({user_id:game1.user_id,timeStamp:new Date(),message:{ conversation: conversation._id, message: `${user.name} has left the game`, read_status: false, name: user.name, author: user._id, type: 'bot', created_at: new Date() }})
          game.host = conversation.members.filter((m)=> m.toString() !== game1.user_id.toString()).length > 0 ? conversation.members.filter((m)=> m.toString() !== game1.user_id.toString())[0] : []
          console.log('conversation',conversation._id);
          return Game.findByIdAndUpdate({ _id: game1.game_id }, { $set: game }).then(game2 => {
             return Conversation.findByIdAndUpdate({ _id: conversation._id }, { $set: conversation }).then(conversation2 => {
              return Conversation.findById({ _id: conversation._id }).lean().populate('members', '_id device_token handle name name_status').then(conversation2 => {
                return User.findById({ _id: game1.user_id }, { activity_log: 0, }).lean().then(user => {
                  let message_formation = game1.type == "game" ? `${user.name} has left the game` : `${game1.host} has removed ${user.name}` 
                  const save_message = { conversation: conversation2._id, message: message_formation, read_status: false, name: user.name, author: user._id, type: 'bot', created_at: new Date() }
                  saveMessage(save_message)
                const token_list  = conversation2.members.filter((key) => key._id.toString() !== game1.user_id.toString())
                const device_token_list = token_list.map((e) => e.device_token)
                NotifyArray(device_token_list, message_formation, `Game Left`,conversation2)
                client.in(game1.convo_id).emit('new',save_message)
                client.in(game1.convo_id).emit('unread',{})
                console.log('conversation');

                return conversation2.members.map((e) => e._id)
       }).catch(error => console.log(error))
  }).catch(error => console.log(error))
}).catch(error => console.log(error))
}).catch(error => console.log(error))
}).catch(error => console.log(error))
}).catch(error => console.log(error))
    return x
  }


  async function kickPlayer(game1,client) {
    const x = await Game.findById({ _id: game1.game_id }).lean().populate('conversation').then(game => {
                 return User.findById({ _id: game1.user_id }, { activity_log: 0, }).lean().then(user => {
      const conversation = Object.assign({},game.conversation)
         game.users = game.users.filter((m)=> m.toString() !== game1.user_id.toString())
          conversation.members = conversation.members.filter((m)=> m.toString() !== game1.user_id.toString())
          conversation.host = conversation.members.filter((m)=> m.toString() !== game1.user_id.toString()).length > 0 ? conversation.members.filter((m)=> m.toString() !== game1.user_id.toString())[0] : []
      conversation.exit_list = conversation.exit_list.concat({user_id:game1.user_id,timeStamp:new Date(),message:{ conversation: conversation._id, message: `${user.name} has left the game`, read_status: false, name: user.name, author: user._id, type: 'bot', created_at: new Date() }})
          game.host = conversation.members.filter((m)=> m.toString() !== game1.user_id.toString()).length > 0 ? conversation.members.filter((m)=> m.toString() !== game1.user_id.toString())[0] : []
          console.log('conversation',conversation._id);
          return Game.findByIdAndUpdate({ _id: game1.game_id }, { $set: game }).then(game2 => {
             return Conversation.findByIdAndUpdate({ _id: conversation._id }, { $set: conversation }).then(conversation2 => {
              return Conversation.findById({ _id: conversation._id }).lean().populate('members', '_id device_token handle name name_status').then(conversation2 => {
                return User.findById({ _id: game1.user_id }, { activity_log: 0, }).lean().then(user => {
                  let message_formation = game1.type == "game" ? `${game1.host} has removed ${user.name}` : `${game1.host} has removed ${user.name}` 
                  const save_message = { conversation: conversation2._id, message: message_formation, read_status: false, name: user.name, author: game1.id, type: 'bot', created_at: new Date() }
                  saveMessage(save_message)
                 
                const token_list  = conversation2.members.filter((key) => key._id.toString() !== game1.id.toString())
                const device_token_list = token_list.map((e) => e.device_token)
                const user_device_token_list = [user.device_token]
                client.in(conversation2._id).emit('new',save_message)
                client.in(conversation2._id).emit('unread',{})
                NotifyArray(device_token_list, message_formation, `Game Left`,conversation2)
                NotifyArray(user_device_token_list, message_formation, `Game Left`,conversation2)
                return conversation2.members.map((e) => e._id)
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
            console.log('slot time selected',body.slot_time);
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
            console.log('slot time selected',body.slot_time);
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
                  console.log('game',game);
                  let messages =  game.map((nc)=>{ return {conversation:nc.conversation._id,game:nc._id,message:`Hey ! Game ${nc.name} is available again . Please book your slot to confirm the game`,name:'bot',read_status:false,read_by:nc.conversation.members[0],author:nc.conversation.members[0],type:'bot',created_at:new Date()}}) 
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
                                                    NotifyArray1(device_token_list,'Hey ! Game is available again . Please book your slot to confirm the game','Turftown Game Availability')
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
    const x = await Conversation.findById({ _id: convo_id }).populate('last_message').lean().then(conversation => {
         client.in(convo_id).emit('new',conversation.last_message)
          }).catch(error => console.log(error))
  }


  
  async function handleProfileAlerts(friend,client){
      // console.log("useree",user)
      // const device_token_list  = [user.device_token]
      console.log(friend,'freind id')
      const x = await  Alert.find({user: friend,status:true},{}).lean().populate('user','_id name device_token last_active email').then(alert=> {
       return User.findOne({_id: friend},{activity_log:0}).lean().then((user)=>{
        console.log('alerts',alert.length)
       console.log('0000032423423423423423423423423423432',user.last_active)
        const alerts1 = alert && alert.length > 0 ? alert.filter(a=>moment(a.created_at).isAfter(user.last_active)) : []   
        // client.to(friend).emit('profile_handlers',{alert_count:alerts1.length,friend:friend})
        client.emit('profile_handlers',{alert_count:alerts1.length,friend:friend})
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
      conversation.host = conversation.members.filter((m)=> m.toString() !== game1.user_id.toString()).length > 0 ? conversation.members.filter((m)=> m.toString() !== game1.user_id.toString())[0] : []
      conversation.exit_list = conversation.exit_list.concat({user_id:game1.user_id,timeStamp:new Date(),message:{ conversation: conversation._id, message: `${user.name} has left the game`, read_status: false, name: user.name, author: user._id, type: 'bot', created_at: new Date() }})
      
      console.log('leave chatroom',conversation);
      return Game.findOne({ conversation: game1.convo_id }).then(game => {
        game.users = game.users.filter((m)=> m.toString() !== game1.user_id.toString())
        game.host = conversation.members.filter((m)=> m.toString() !== game1.user_id.toString()).length > 0 ? conversation.members.filter((m)=> m.toString() !== game1.user_id.toString())[0] : []
        return Game.findOneAndUpdate({ conversation: game1.convo_id }, { $set: game }).then(conversation2 => {
         return Conversation.findByIdAndUpdate({ _id: game1.convo_id }, { $set: conversation }).then(conversation2 => {
          return Conversation.findById({ _id: game1.convo_id }).lean().populate('members', '_id device_token handle name name_status').then(conversation2 => {
            return User.findById({ _id: game1.user_id }, { activity_log: 0, }).lean().then(user => {
              const save_message = { conversation: conversation2._id, message: `${user.name} has left the game`, read_status: false, name: user.name, author: user._id, type: 'bot', created_at: new Date() }
              saveMessage(save_message)
              const token_list  = conversation2.members.filter((key) => key._id.toString() !== game1.user_id.toString())
              const device_token_list = token_list.map((e) => e.device_token)
              NotifyArray(device_token_list, `${user.name} has left the game`, `Game Left`,conversation2)
              client.in(game1.convo_id).emit('new',save_message)
              client.in(game1.convo_id).emit('unread',{})
            return conversation2.members.map((e) => e._id)
   }).catch(error => console.log(error))
}).catch(error => console.log(error))
}).catch(error => console.log(error))
}).catch(error => console.log(error))
}).catch(error => console.log(error))
}).catch(error => console.log(error))
}).catch(error => console.log(error))
return x
  }

  async function leaveChatroomGroup(game1,client) {
    const x = await Conversation.findById({ _id: game1.convo_id }).lean().then(conversation => {
      return User.findById({ _id: game1.user_id }, { activity_log: 0, }).lean().then(user => {
        const tot  = conversation.host.filter((m)=> m.toString() == game1.user_id.toString()).length > 0 ? true : false
        conversation.members = conversation.members.filter((m)=> m.toString() !== game1.user_id.toString())
        conversation.host = conversation.members.filter((m)=> m.toString() !== game1.user_id.toString()).length > 0 ? conversation.members.filter((m)=> m.toString() !== game1.user_id.toString())[0] : conversation.host
        console.log('status',game1.status)
        conversation.exit_list = conversation.exit_list.concat({user_id:game1.user_id,timeStamp:new Date(),message:{ conversation: conversation._id, message: `${user.name} ${game1 && game1.status && game1.status === 'terminate' ? 'has been removed':'has left the club'}`, read_status: false, name: user.name, author: user._id, type: 'bot', created_at: new Date() }})

          if((conversation.type === 'single' || conversation.type === 'group') && conversation.members.length <= 0){
            return Conversation.findByIdAndDelete({ _id: game1.convo_id }).then(conversation2 => {
              return Conversation.findById({ _id: game1.convo_id }).lean().populate('members', '_id device_token').then(conversation2 => {
                conversation.type !== 'single' && saveMessage({ conversation: conversation2._id,message: `${user.name} ${game1 && game1.status && game1.status === 'terminate' ? 'has been removed':'has left the club'}`, read_status: false, name: user.name, author: user._id, type: 'bot', created_at: new Date() })
                conversation.type !== 'single' && client.in(conversation2._id).emit('new',{ conversation: conversation2._id, message: `${user.name} has left the club`, read_status: false, name: user.name, author: user._id, type: 'bot', created_at: new Date() })
                const token_list  = conversation.members.filter((key) => key._id.toString() !== game1.user_id.toString())
                //const device_token_list = token_list.map((e) => e.device_token)
                //NotifyArray(device_token_list, `${user.name} has left the game`, `Game Left`)
                client.in(game1.convo_id).emit('unread',{})
                client.in(game1.convo_id).emit('new',{ conversation: conversation2._id,message: `${user.name} ${game1 && game1.status && game1.status === 'terminate' ? 'has been removed':'has left the club'}`, read_status: false, name: user.name, author: user._id, type: 'bot', created_at: new Date() })

                    return conversation2.members.map((e) => e._id)
                  }).catch(error => console.log(error))
                }).catch(error => console.log(error))
           }
           else{
             return Conversation.findByIdAndUpdate({ _id: game1.convo_id }, { $set: conversation }).then(conversation2 => {
                 return Conversation.findById({ _id: game1.convo_id }).lean().populate('members', '_id device_token handle name name_status').then(conversation2 => {
                   return User.findById({ _id: game1.user_id }, { activity_log: 0, }).lean().then(user => {
                   conversation2.type !== 'single' && saveMessage({ conversation: conversation2._id, message: `${user.name} ${game1 && game1.status && game1.status === 'terminate' ? 'has been removed':'has left the club'}`, read_status: false, name: user.name, author: user._id, type: 'bot', created_at: new Date() })
                   conversation2.type !== 'single' && client.to(conversation2._id).emit('new',{ conversation: conversation2._id, message: `${user.name} ${game1 && game1.status && game1.status === 'terminate' ? 'has been removed':'has left the club'}`, read_status: false, name: user.name, author: user._id, type: 'bot', created_at: new Date() })
                   const token_list  = conversation2.members.filter((key) => key._id.toString() !== game1.user_id.toString())
                   const device_token_list = token_list.map((e) => e.device_token)
                   client.in(conversation2._id).emit('unread',{})
                   //NotifyArray(device_token_list, `${user.name} has left the game`, `Game Left`)
                   return conversation2.members.map((e) => e._id)
          }).catch(error => console.log(error))
   }).catch(error => console.log(error))
   }).catch(error => console.log(error))
   

           }
          }).catch(error => console.log(error))
}).catch(error => console.log(error))
    return x
  }


    // async function joinConversation1


    // async function joinGame(game_id,userId){
    //   console.log(game_id,userId)
    //   const x = await Game.findByIdAndUpdate({_id: game_id},{ $pull: { invites: userId } }).then(game=> {
    //     return  Game.findByIdAndUpdate({_id: game_id},{ $addToSet: { users: { $each: [userId] } } }).then(game=> {
    //      return Conversation.findByIdAndUpdate({_id: game.conversation},{ $pull: { invites: userId } }).then(conversation1=> {
    //       return Conversation.findByIdAndUpdate({_id: game.conversation},{ $addToSet: { members: { $each: [userId] } } }).then(conversation1=> {
    //         return Conversation.findByIdAndUpdate({_id: game.conversation} ,{ $addToSet: { last_active: { $each: [{user_id:userId,last_active:new Date()}] } } }).then(conversation1=> {
    //           return Conversation.findByIdAndUpdate({_id: game.conversation} ,{ $addToSet: { join_date: { $each: [{user_id:userId,join_date:new Date()}] } } }).then(conversation1=> {
    //           console.log("convera",conversation1)
    //         //above to update below to show and save message
    //         return Conversation.findById({_id: game.conversation}).lean().populate('members','_id device_token').then(conversation2=> {
    //           return User.findById({_id: userId},{activity_log:0,}).lean().then(user=> {
    //               saveMessage({conversation:conversation2._id,message:`${user.name} has joined the game`,read_status:false,name:user.name,author:user._id,type:'bot',created_at:new Date()}) 
    //                              const device_token_list=conversation2.members.map((e)=>e.device_token)
    //                              NotifyArray(device_token_list,`${user.name} has joined the game`,`New Game Joined`)
    //                              return conversation2.members.map((e)=>e._id)
                                 
    //              //res.send({status:"success", message:"invitation sent"})
     
    //   }).catch((e)=>console.log(e));
    // }).catch((e)=>console.log(e));
    //   }).catch((e)=>console.log(e));
    //   }).catch((e)=>console.log(e));
    //     }).catch((e)=>console.log(e));
    //    }).catch((e)=>console.log(e));
    //    }).catch((e)=>console.log(e));
    //   }).catch((e)=>console.log(e));
    //    return x
    //    }

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
    registerExitedUser,
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
    sendGroupInvites,
    joinGame,
    updateImage,
    setTownTrue,
    updateGroup,
    updateParams,
    handleProfileAlerts,
    sendEventInvites,
    sendConvoEventInvites
  }
}
