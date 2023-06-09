const express = require("express")
const router = express.Router()
const PublicationController = require("../controllers/publication")
const chck = require("../middlewares/auth")
const multer = require("multer")

// Configuraración de subida

const storage = multer.diskStorage({
    destination: (req, file,cb)=>{
        cb(null,"./uploads/publications")
    },
    filename: (req,file,cb)=>{
        cb(null,"pub-"+ Date.now()+"-"+file.originalname)

    }
})

const uploads = multer({storage})

// Definir rutas

router.get("/prueba-publication", PublicationController.pruebaPublication)
router.post("/save", chck.auth,PublicationController.save)
router.get("/detail/:id", chck.auth,PublicationController.detail)
router.delete("/remove/:id", chck.auth,PublicationController.remove)
router.get("/user/:id/:page?", chck.auth,PublicationController.user)
router.post("/upload/:id", [chck.auth, uploads.single("file0")],PublicationController.upload)
router.get("/media/:file?",PublicationController.media)
router.get("/feed/:page?", chck.auth,PublicationController.feed)

// Exportar router

module.exports = router