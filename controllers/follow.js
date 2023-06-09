const mongoosePaginate = require("mongoose-paginate-v2")

// Importar modelo

const Follow = require("../models/follow")

// Importar servicios 

const followService = require("../services/followService")
// Acciones de prueba

const pruebaFollow = (req, res) => {
    return res.status(200).send({
        message: "Mensaje enviado desde: controller/follow.js"
    })
}

// Accion de guardar un follow (acción seguir)

const saveFollow = (req, res) => {

    // Conseguir datos del body
    const params = req.body

    // Sacar id del usuario identificado
    const identity = req.user

    // Crear objeto con modelo follow
    let userToFollow = new Follow({
        user: identity.id,
        followed: params.followed
    })
    // Guardar objeto en bbdd
    userToFollow.save().then((followStored) => {

        return res.status(200).send({
            status: "success",
            message: "Mensaje enviado desde saveFollow",
            identity: req.user,
            follow: followStored
        })

    }).catch((error) => {

        return res.status(500).send({
            status: "error",
            message: "No se ha podido seguir al usuario",

        })

    })

}



// Acción de borrar un follow (acción dejar de seguir)

const unFollow = async (req, res) => {

    // Recoger el id del usuario identificado

    const userId = req.user.id

    // Recoger el id del usuario que siglo y quiero dejar de seguir
    const followedId = req.params.id
    // Find de las coincidades y hacer remove

    await Follow.deleteOne({
        "user": userId,
        "followed": followedId
        // "_id":"6455abd7b0235eee9f06e3a7"
    })
        .then((followedStored) => {

            return res.status(200).send({
                status: "success",
                message: "Follow eliminado correctamente",

            })

        })
        .catch((error) => {

            return res.status(500).send({
                status: "error",
                message: "No dejado de seguir",

            })

        })
}

// Accion listado de usuarios que cualquier usuario está siguiendo

const following = (req, res) => {

    //Sacar el id del usuario identificado

    let userId = req.user.id

    //Comprobar si me llega el ud por parámetro en url
    if (req.params.id) userId = req.params.id

    // Comprobar si me llega la página. si no la página 1

    let page = 1
    if (req.params.page) page = req.params.page

    //Usuarios por página que quiero mostrar
    const itemsPerPage = 5

    const opciones = {
        page: page,
        populate: [{ path: "user", select: ["-password" ,"-role","-__v"]}, { path: "followed", select: ["-password" ,"-role","-__v"]}],
        limit: itemsPerPage,
        sort: { _id: -1 }
    };

    Follow.paginate({"user": userId}, opciones, async(error, users) => {
        if (error || !users) return res.status(404)
            .json({ status: "Error", message: "NO SE HA ENCONTRADO EL USUARIO" })
       

        //
        let followUserIds = await followService.followUserIds(req.user.id)
        //devolver resultado 
        return res.status(200).send({
            status: "success",
            message: "Listado de usuarios que estoy siguiendo",
            users,
            totalpages: users.totalPages,
            user_following: followUserIds.following,
            user_following_me: followUserIds.followers
            
        })
    })

    // Find a follow, popular datos de los usuarios y paginar


    // Listado de usuarios  

    //Sacar un arrar de ids de los usuarios que me siguen y los que sigo como victor


}

// Acción listado de usuarios que me siguen

const followers = (req, res) => {

    let userId = req.user.id

    //Comprobar si me llega el ud por parámetro en url
    if (req.params.id) userId = req.params.id

    // Comprobar si me llega la página. si no la página 1

    let page = 1
    if (req.params.page) page = req.params.page

    //Usuarios por página que quiero mostrar
    const itemsPerPage = 5

    const opciones = {
        page: page,
        populate: [{ path: "user", select: ["-password" ,"-role","-__v"]}, { path: "followed", select: ["-password" ,"-role","-__v"]}],
        limit: itemsPerPage,
        sort: { _id: -1 }
    };



    Follow.paginate({"followed": userId}, opciones, async(error, users) => {
        if (error || !users) return res.status(404)
            .json({ status: "Error", message: "NO SE HA ENCONTRADO EL USUARIO" })
       

        //
        let followUserIds = await followService.followUserIds(req.user.id)
        //devolver resultado 
        return res.status(200).send({
            status: "success",
            message: "Listado de usuarios que me siguen",
            users,
            totalpages: users.totalPages,
            user_following: followUserIds.following,
            user_following_me: followUserIds.followers
            
        })
    })

}

//Exportar acciones
module.exports = {
    pruebaFollow,
    saveFollow,
    unFollow,
    following,
    followers
}
