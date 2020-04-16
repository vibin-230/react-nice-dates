const User = require('../models/user');

module.exports = function () {
  // mapping of all connected clients
  const clients = new Map()

  function addClient(client) {
    clients.set(client.id, { client })
  }

  function registerClient(client, user) {
    clients.set(client.id, { client, user })
  }

  function removeClient(client) {
    clients.delete(client.id)
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
      let resultsq = user1.filter(({ _id: id1 }) => !a.some(({ user: id2 }) => id2 === id1));
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

  return {
    addClient,
    registerClient,
    removeClient,
    getAvailableUsers,
    isUserAvailable,
    getUserByName,
    getUserByClientId
  }
}
