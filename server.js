const Sequelize = require('sequelize-cockroachdb');
const Hapi = require('hapi');
const inert = require('inert');
const Path = require('path');
const Joi = require('joi');
const bcrypt = require('bcrypt');
const { rejects } = require('assert');
const saltRounds = 10;

async function encryptPass(password)
{
  return new Promise((resolve,reject)=>{
  bcrypt.hash(password,saltRounds,function(err,hash){
    if(err)
    reject(Error(err));
    console.log(hash);
    resolve(hash);
  })
})
}



let init = async function()
{
  const sequelize = new Sequelize('bank', 'maxroach', '', {
    dialect: 'postgres',
    port: 26257,
    logging: false
  });


 const server = new Hapi.Server({
   port:8080,
   host:'localhost',
   routes:{
     files:{
       relativeTo:Path.join(__dirname,'public')
     }
   }
  
 });


 let User = sequelize.define('users', {
  email: { type: Sequelize.STRING,primaryKey=true}, 
  name: { type: Sequelize.STRING}, 
  password: {type: Sequelize.STRING},
  phone:{type: Sequelize.INTEGER}
});

User.sync({
  force:true
}).then(function(){
  
})


await server.register([inert]);

server.route({
  method:'GET',
  path:'/',
  handler:function(req,h){
    return "Returning user or New user?"
  }
});

server.route({
  method:'GET',
  path:'/handleChoice',
  handler:function(req,h)
  {
      let choice = req.query.choice;
      if(choice=='New')
      {
        return "New User";
      } //route to registration page
      else
      if(choice=='Old')
        return "Old User"; //route to the login page
      else
        return "Invalid Option" //refresh the page
  }
});

 server.route({
   method:'POST',
   path:'/register',
   handler: async function(req,h){
      let payload = req.payload;
      //console.log(payload);
      let name = payload.name;
      let email = payload.email;
      let phoneNumber = payload.phone;
      let passwordUnencrypted = payload.password;
      let encrypted_password = "";
      try{
        encrypted_password = await encryptPass(passwordUnencrypted);
      }catch(err)
      {
        console.log(err);
      }
      // console.log(encrypted_password);
      const resp = {name:name,email:email,phone:phoneNumber,pass:encrypted_password};
      console.log(resp);
      return resp;
      
      //write code to insert record into cockroachdb



   }
 });


 server.route({
  method:'POST',
  path:'/login',
  handler:async function(req,h)
  {
    let payload = req.payload;
    let name = payload.name;
    let password = payload.password;
    //get record from db
    //verify password
    //create session for user
  }
 });

 

await server.start()
console.log("Server started at "+server.info.uri);

}


init();



// Define the Account model for the "accounts" table.
// var Account = sequelize.define('accounts', {
//   id: { type: Sequelize.INTEGER, primaryKey: true },
//   balance: { type: Sequelize.INTEGER }
// });



// // Create the "accounts" table.
// Account.sync({force: true}).then(function() {
//   // Insert two rows into the "accounts" table.
//   return Account.bulkCreate([
//     {id: 1, balance: 1000},
//     {id: 2, balance: 250}
//   ]);
// }).then(function() {
//   // Retrieve accounts.
//   return Account.findAll();
// }).then(function(accounts) {
//   // Print out the balances.
//   accounts.forEach(function(account) {
//     console.log(account.id + ' ' + account.balance);
//   });
//   process.exit(0);
// }).catch(function(err) {
//   console.error('error: ' + err.message);
//   process.exit(1);
// });