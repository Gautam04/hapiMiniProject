const Sequelize = require('sequelize-cockroachdb');
const Hapi = require('hapi');
const inert = require('inert');
const Path = require('path');
const Joi = require('joi');
const bcrypt = require('bcrypt');
// const { rejects } = require('assert');
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


async function comparePassword(password,encrypted_password)
{
  return new Promise(function(resolve,reject){
    bcrypt.compare(password,encrypted_password,function(err,flag){
        if(err)
        reject(Error(err));
        else
        resolve(flag);
    });
  });
}


let init = async function()
{
  const sequelize = new Sequelize('testdb', 'maxroach', '', {
    dialect: 'postgres',
    port: 26257,
    logging: false
  });


 const server = new Hapi.Server({
   port:5050,
   host:'localhost',
   routes:{
     files:{
       relativeTo:Path.join(__dirname,'public')
     }
   }
  
 });


 let User = sequelize.define('users', {
  email: { type: Sequelize.STRING,primaryKey:true}, 
  name: { type: Sequelize.STRING}, 
  password: {type: Sequelize.STRING},
  phone:{type: Sequelize.INTEGER}
});

User.sync({
  force:false
})


await server.register([inert]);


server.route({
  method:'GET',
  path:'/js/{param}',
  handler:function(req,h){
    return h.file('js/'+req.params.param);
  }
});

server.route({
  method:'GET',
  path:'/css/{param}',
  handler:function(req,h){
    return h.file('css/'+req.params.param);
  }
});

server.route({
  method:'GET',
  path:'/',
  handler:function(req,h){
    return h.file("choice.html");
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
      User.create({name:name,email:email,phone:phoneNumber,password:encrypted_password}) 
      console.log("Successfully inserted new record in Users table");           
      //write code to insert record into cockroachd
      return "Success";
    
   }
 });


 server.route({
  method:'POST',
  path:'/login',
  handler:async function(req,h)
  {
    let payload = req.payload;
    let email = payload.email;
    let password = payload.password;
    //get record from db
    let returned_record = await User.findAll({
      where:{
        email:email

      }
    })
    console.log(returned_record);
    try{
      password_flag = await comparePassword(password,returned_record[0].dataValues.password);
      if(password_flag)
        return returned_record;
      else
        return "Wrong Password, Please try again";
    }catch(err){
      console.log(err);
      return "Error has occured";
    }
    // console.log(returned_record);
    
    //verify password
    //create session for user
  }
 });

 

await server.start()
console.log("Server started at "+server.info.uri);

}


init();

