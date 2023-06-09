// Importar dependencias y módulos
const bcrypt = require("bcrypt")
const User = require("../models/user")
const Follow = require("../models/follow")
const Publication = require("../models/publication")

const mongoosePaginate = require("mongoose-paginate-v2")
const fs = require("fs")
const path = require("path")


//Importar servicios =
const FollowService = require("../services/followService")
const jwt = require("../services/jwt")


// Acciones de prueba

const pruebaUser = (req, res) => {


    return res.status(200).send({
        message: "Mensaje enviado desde: controller/user.js",
        usuario: req.user
    })
}
// Método de registro usuarios

const register = (req, res) => {
    // Recoger datos de la petición
    let params = req.body

    // Comprobar que llegan bien (+ validación)

    if (!params.name || !params.email || !params.surname || !params.nick || !params.password) {
        return res.status(400).json({
            status: "error",
            message: "Faltan datos por enviar"
        })
    }


    // Control de usuarios duplicados
    User.find({
        $or: [
            { email: params.email.toLowerCase() },
            { nick: params.nick.toLowerCase() },
        ],
    }).then(async (users) => {
        if (users && users.length >= 1) {
            return res.status(200).send({
                status: "success",
                message: "El usuario ya existe",
            });
        }

        //Cifrar la contraseña
        let pwd = await bcrypt.hash(params.password, 10);
        params.password = pwd;

        //Crear objeto  de usuario
        let user_to_save = new User(params);
        //Guardar usuario en la bdd
        user_to_save.save().then((userStored) => {

            //Devolver el resultado
            return res.status(200).json({
                status: "success",
                message: "Usuario registrado correctamente",
                user: userStored,
            });
        }).catch((error) => {
            return res.status(500).json({ status: "error", message: "Error al guardar el usuario" })
        });
    })

}
//Eportar acciones
// Autenticación

const login = (req, res) => {

    // Recoger parámetros body

    let params = req.body

    if (!params.email || !params.password) {
        return res.status(400).send({
            status: "error",
            message: "Faltan datos por enviar"
        })
    }

    // Buscar en la bbdd si existe
    User.findOne({ email: params.email })
        //.select({"password":0})
        .then(async (user) => {
            if (!user) {
                return res.status(404).send({ status: "error", message: "No existe el usuario" })
            }

            // Comprobar contraseña
            let pwd = bcrypt.compareSync(params.password, user.password)
            if (!pwd) {
                return res.status(400).send({
                    status: "error",
                    message: "No te has identificado correctamente"
                })
            }
            // Conseguir Token
            const token = jwt.createToken(user)

            //Eliminar password del objeto


            // Devolver datos de usuario

            return res.status(200).send({
                status: "success",
                messaje: "Acción de login",
                user: {
                    id: user._id,
                    name: user.name,
                    nick: user.nick
                },
                token

            })

        })
        .catch((error) => {
            return res.status(500).json({ status: "error", message: "Hubo un error al autenticar" })
        })


}

const profile = (req, res) => {
    // Recibir el parámetro del id de usuario por la url
    const id = req.params.id;
    // Consulta para sacar los datos del usuario

    //const userProfile = await User.findById(id)

    User.findById(id)
        .then(
            async (userProfile) => {


                if (!userProfile) {
                    return res.status(404).send({

                        status: "error",
                        message: "El usuario no existe o hay un error"
                    })
                }
                //Info de seguimiento
                const followInfo = await FollowService.followThisUser(req.user.id, id)
                //Devolver resultado


                return res.status(200).send({
                    status: "success",
                    message: userProfile,
                    following: followInfo.following,
                    follower: followInfo.follower
                })
            })
        .catch((error) => {
            return res.status(404).json({ status: "error", message: "El usuario no existe o hay un error" })
        })
}


const list = (req, res) => {
    let page = 1

    if (req.params.page) {
        page = parseInt(req.params.page)
    }


    let itemPerPage = 3

    const opciones = {
        page: page,
        limit: itemPerPage,
        sort: { _id: -1 }
    };

    //para acceder a los usuarios del UserSchema

    User.paginate({}, opciones, async (error, users) => {
        if (error || !users) return res.status(404)
            .json({ status: "Error", message: "NO SE HA ENCONTRADO EL USUARIO" })


        let followUserIds = await FollowService.followUserIds(req.user.id)

        //devolver resultado 
        return res.status(200).send({
            status: "success",
            message: "listado de usuarios",
            users,
            page,
            itemPerPage,
            user_following: followUserIds.following,
            user_following_me: followUserIds.followers

        })
    })
}


const update = (req, res) => {

    // Recoger info del usuario a actualizar
    let userIdentity = req.user
    let userToUpdate = req.body

    // console.log(userIdentity)
    // console.log(req.body)


    delete userToUpdate.iat
    delete userToUpdate.exp
    delete userToUpdate.role;
    delete userToUpdate.image;

    // Comprobar si el usuario ya existe

    User.find({
        $or: [
            { email: userToUpdate.email.toLowerCase() },
            { nick: userToUpdate.nick.toLowerCase() },
        ],
    }).then(async (users) => {

        let userIsset = false

        users.forEach(user => {
            if (user && user._id != userIdentity.id) userIsset = true

        })

        if (userIsset) {
            return res.status(200).send({
                status: "success",
                message: "El usuario ya existe",
            });
        }

        // Si me llega la pwd cifrarla
        //Cifrar la contraseña
        if (userToUpdate.password) {

            let pwd = await bcrypt.hash(userToUpdate.password, 10);
            userToUpdate.password = pwd;
        }
        else{
            delete userToUpdate.password
        }

        //buscar y actualizar

        try {
            let userUpdated = await User.findByIdAndUpdate({ _id: userIdentity.id }, userToUpdate, { new: true })


            if (!userUpdated) {
                return res.status(500).json({ status: "error", message: "Error al actualizar el usuario", error })

            }
            return res.status(200).send({
                status: "success",
                message: "Método para actualizar usuario",
                userUpdated

            })

        } catch (error) {
            return res.status(404).send({
                status: "error",
                message: "Error al actualizar",
            })
        }



    })

}

const upload = async (req, res) => {

    // Recoger el fichero de imagen y comprobar que existe

    if (!req.file) {
        return res.status(404).send({
            status: "error",
            message: "Petición no incluye imagen"
        })
    }

    // Conseguir el nombre del archivo
    let image = req.file.originalname

    // Sacar la extensión del archivo
    const imageSplit = image.split("\.")
    const extension = imageSplit[1]

    // Comprobar extensión
    if (extension != "png" && extension != "jpg" && extension != "jpeg" && extension != "gif") {
        // Si no es correcta, borrar el archivo       

        //ruta fisica del fichero
        const filePath = req.file.path
        const fileDeleted = fs.unlinkSync(filePath)
        // Devolver respuesta

        return res.status(400).send({
            status: "error",
            message: "Extensión del fichero inválida"
        })
    }


    // Si es correcta, guardar imagen en bbdd
    // se busca con id y se pasa un objeto para actualizar carateristica en este image y atributo y el filename
    try {
        let userUpdated = await User.findOneAndUpdate({ _id: req.user.id }, { image: req.file.filename }, { new: true })

        if (userUpdated) {

            return res.status(200).send({
                status: "success",
                message: "Método para subir",
                user: req.user,
                image
            })

        }

    } catch (error) {

        return res.status(500).send({
            status: "error",
            message: "Método para subir",
            error
        })
    }
}

const avatar = (req, res) => {

    // Sacar el parámetro de la url

    const file = req.params.file

    // Montar el path real de la imagen

    const filePath = "./uploads/avatars/" + file

    // Comprobar que el archivo existe 
    fs.stat(filePath, (error, exists) => {
        if (!exists) {
            return res.status(400)
                .send({
                    status: "error",
                    message: "No existe la imagen"
                })
        }

        // Si existe devolver el file 
        return res.sendFile(path.resolve(filePath))

    })

}

const counters = async (req,res)=>{ 
    let userId = req.user.id;

    if (req.params.id) {
        userId = req.params.id;
    }
    
    try {
        const following = await Follow.count({"user":userId})
        const followed = await Follow.count({"followed":userId})
        const publications = await Publication.count({"user":userId})

        return res.status(200).send({
            userId,
            following,
            followed,
            publications
        })
        
    } catch (error) {
        return res.status(500).send({
            status:"error",
            message: "Error en los contadores",
            error
        })
    }

}


module.exports = {
    pruebaUser,
    register,
    login,
    profile,
    list,
    update,
    upload,
    avatar,
    counters
}
