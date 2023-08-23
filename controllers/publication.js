//Importar modelos|

const Publication = require("../models/publication")

// Importar módulos
const fs = require("fs")
const path = require("path")

const mongoosePaginate = require("mongoose-paginate-v2")
// Importar servicios
const followService = require("../services/followService")


// Acciones de prueba

const pruebaPublication = (req, res) => {
    return res.status(200).send({
        message: "Mensaje enviado desde: controller/publication.js"
    })
}


// Guardar publicación

const save = (req, res) => {
    //recoger datos del body
    const params = req.body
    //Si no llegan dar respuesta negativa 
    if (!params.text) return res.status(400).send({ status: "error", message: "debes enviar datos del texto" })
    // Crear y llenar el objeto del model publication

    let newPublication = new Publication(params)
    newPublication.user = req.user.id

    // Guardar objeto del modelo
    newPublication.save()
        .then((publicationStored) => {
            return res.status(200).send({
                status: "success",
                message: " Se ha guardado su publicación",
                publicationStored
            })
        })
        .catch((error) => {
            return res.status(400).send({
                status: "error",
                message: " Hubo un error al guardar"
            })
        })


}

// Sacar una publicación

const detail = async (req, res) => {

    // Sacar el id de la publicación de la URL
    const publicationId = req.params.id
    // Find con la condicion del id
    await Publication.findById(publicationId).then((publicationStored) => {

        if (publicationStored) {
            return res.status(200).send({
                status: "success",
                message: " Mostrar la publicación",
                publicationStored
            })
        }
        else {
            return res.status(404).send({
                status: "error",
                message: " No existe la publicación"
            })
        }

    })
        .catch((error) => {
            return res.status(404).send({
                status: "error",
                message: " No existe la publicación"
            })
        })

}
// ELiminar publiciaciones


const remove = async (req, res) => {
    // Scar el id de la publicación

    const publicationId = req.params.id

    // Find y remove
    await Publication.deleteOne({
        "user": req.user.id,
        "_id": publicationId
    })
        .then((publicationStored) => {

            if (publicationStored.deletedCount !== 0)
                return res.status(200).send({
                    status: "success",
                    message: "respuesta desde publication remove",
                    publication: publicationStored
                })
            else {
                return res.status(500).send({
                    status: "error",
                    message: "No se ha eliminado la publicacion",
                    publication: publicationStored
                })
            }
        })
        .catch((error) => {
            return res.status(500).send({
                status: "error",
                message: "No se ha eliminado la publicacion"
            })

        })
    //Devolver respuesta
}

// Listar publicaciones de un usuario
const user = (req, res) => {

    // Sacar el id del usuario
    const userId = req.params.id
    console.log(req.params)
    // control la página
    let page = 1
    const itemsPerPage = 5

    if (req.params.page) { page = req.params.page }


    const options = {
        page: page,
        populate: [{ path: "user", select: ["-password", "-role", "-__v"] }],
        limit: itemsPerPage,
        sort: { created_at: -1 }
    };
    // Find, populate, ordenar, paginar
    Publication.paginate({ "user": userId }, options, (error, publications) => {
        if (error || !publications || publications.length <= 0) return res.status(404)

            .json({ status: "Error", message: "Hubo un error al realizar la consulta o el usuario no tiene publicaciones" })

        // devolver el resultado 
        return res.status(200).send({
            status: "success",
            message: "respuesta desde publication user",
            publications

        })
    })
}




//Subir ficheros


const upload = async (req, res) => {

    // Sacar publication ID
    const publicationId = req.params.id
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
        let publicationUpdated = await Publication.findOneAndUpdate({ "user": req.user.id, "_id": publicationId }, { file: req.file.filename }, { new: true })

        if (publicationUpdated) {

            return res.status(200).send({
                status: "success",
                message: "Método para subir",
                publication: publicationId,
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

// Devolver archivos multimedia

const media = (req, res) => {

    // Sacar el parámetro de la url

    const file = req.params.file

    // Montar el path real de la imagen

    const filePath = "./uploads/publications/" + file

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

// Lista todas las publicaciones (FEED)

const feed = async (req, res) => {
    //Sacar la página actual

    let page = 1

    if (req.params.page) { page = req.params.page }

    //Establecer número de elementos por página

    let itemsPerPage = 5

    // Sacar un array de identificadores de usuarios que yo sigo como usuario identificado
    try {
        const myFollows = await followService.followUserIds(req.user.id)

        // Find a publication, in ordenar, popular y paginar
        const options = {
            page: page,
            populate: [{ path: "user", select: ["-password", "-role", "-__v","-email"] }],
            limit: itemsPerPage,
            sort: { created_at: -1 }
        };

        const publications = await Publication.paginate({ user: {$in: myFollows.following} }, options)

            if (!publications || publications.length <= 0) {
                return res.status(500).send({
                    status: "error",
                    message: "No se han listado las publicaciones del feed",

                })
            }
        
               
        //populate("user", "-password -role -email -__v").sort("-created_at")


        return res.status(200).send({
            status: "success",
            message: "Método publication feed",
            following: myFollows.following,
            publications

        })

    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "No se han listado las publicaciones del feed",

        })

    }


}


//Eportar acciones
module.exports = {
    pruebaPublication,
    save,
    detail,
    remove,
    user,
    upload,
    media,
    feed
}
