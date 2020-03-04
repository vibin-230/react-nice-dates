const userTemplates = require('./config/users')
const mongoose = require('mongoose');
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

  function getAvailableUsers() {

   const users  = User.find({},{__v:0,token:0,otp:0,activity_log:0}).then(user=>{
      const usersTaken = new Set(
        Array.from(user).filter(c => c.user).map(c => c.user.name)
      )
      let final = user.filter(u => !usersTaken.has(u.name))
      return final
    }).catch()
    return users

  }

  function isUserAvailable(userName) {
    return getAvailableUsers().some(u => u.name === userName)
  }

  function getUserByName(userName) {
    return userTemplates.find(u => u.name === userName)
  }

  function getUserByClientId(clientId) {
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
