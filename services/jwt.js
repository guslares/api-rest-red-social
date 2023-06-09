// Importar dependencias
const jwt = require("jwt-simple")
const moment = require("moment")

// Clave secreta
const secret = "CL4V35ECR3T4_150520"

// Crear una función para generar tokens

const createToken = (user) =>{
    const payload ={
        id: user._id,
        name: user.name,
        username: user.username,
        nick: user.nick,
        email: user.email,
        role: user.role,
        image: user.image,
        iat: moment().unix(),
        exp: moment().add(30,"days").unix()
    }
// Devolver jwt token codificado

return jwt.encode(payload,secret)

}


module.exports ={
    secret,
    createToken
}