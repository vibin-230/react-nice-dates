const User = require('../models/user');
const verifyToken = require('../scripts/VerifySocket')
module.exports = function () {
  // mapping of all connected clients
  const clients = new Map()

  async function addClient(client,token) {
    const user = await verifyToken(token)
    //if(user !== 'error')
    clients.set(user.id.toString(), { client })
    //User.findByIdAndUpdate({_id: user.id},{status:'online'}).then(user1=>{}).catch()

  }

  function registerClient(client, user) {
    clients.set(user._id.toString(), { client, user })
  }


  function filterClients(clients1){
    let x = []
    // clients.forEach( (value, key, map) => {
    //   if(clients1.indexOf(value.client.id) === -1)
    //      x.push(key)
    //      console.log('adadadadadadad',key);
    // });
  const a = Array.from(clients.keys()).filter(value => {
    console.log(clients1.indexOf(clients.get(value).client.id))
      if(clients1.indexOf(clients.get(value).client.id) !== -1){
        return value
      }})
    return a
  }

 async function removeClient(client,token) {
    const user = await verifyToken(token)

    console.log('asasasdadsasdasdassad',user)
    if(user !== 'error')
    clients.delete(user.id)
    User.findByIdAndUpdate({_id: user.id},{last_active:new Date(),online_status:'offline'}).then(user1=>{}).catch()

  }

  function getAvailableUsers(id) {
   const users  = User.find({login_type:'email'},{__v:0,token:0,otp:0,activity_log:0}).then(user1=>{
    const users_final =   User.findById({_id:id},{__v:0,token:0,otp:0,activity_log:0}).lean().then(user=>{
      let a = user.following
      let b = []
      let results = user1.filter((u)=>{
        if(a.some(person => person.toString() === u._id.toString())){
        }else{
          return u
        }
      })
      return results
    }).catch()
    return users_final
  }).catch()
    return users

  }

  async function isUserAvailable(userName) {
    const users = await User.find({name:userName,login_type:'email' },{__v:0,token:0,otp:0,activity_log:0}).then(user=>{
      return user
    }).catch()
    return users.some(u => u.name === userName)
  }

  async function getUserByName(userName) {
    const users = await User.find({login_type:'email'},{__v:0,token:0,otp:0,activity_log:0}).then(user=>{
      const usersTaken = new Set(
        Array.from(user).filter(c => c.user).map(c => c.user.name)
      )
      let final = user.filter(u => !usersTaken.has(u.name))
      return final
    }).catch()

    return users.find(u => u.name === userName)
  }

  function getUserByClientId(clientId) {
    const user  = (clients.get(clientId) || {})
    return (clients.get(clientId) || {}).user
  }

  function getClient(clientId) {
      //console.log('clients',clients);
      console.log(clientId);
      console.log('clients--------------',clients);
      const x  = clients.get(clientId.toString())
      console.log('gotclient---------------',x);
      //io.broadcast.to(x.id).emit('unread','pass')
      x && x.client && x.client.emit('unread','invites')
    return (x || {})
  }

  return {
    addClient,
    registerClient,
    removeClient,
    getAvailableUsers,
    isUserAvailable,
    getUserByName,
    getClient,
    filterClients,
    getUserByClientId
  }
}
