import * as db from './dbLogic.js';

const login = (req,res,next)=>{
    db.verifyUserLogin(req,res,next);
}



const register = (req,res,next)=>{
    console.log('test');
    db.registerNewUser(req,res,next);
}

export {login,register};