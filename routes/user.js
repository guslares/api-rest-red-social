const express = require("express")
const router = express.Router()
const UserController = require("../controllers/user")
const chck = require("../middlewares/auth")
const multer = require("multer")

// Configuraración de subida

const storage = multer.diskStorage({
    destination: (req, file,cb)=>{
        cb(null,"./uploads/avatars")
    },
    filename: (req,file,cb)=>{
        cb(null,"avatar-"+Date.now()+"-"+file.originalname)

    }
})

const uploads =multer({storage})

// Definir rutas

router.get("/prueba-usuario", chck.auth, UserController.pruebaUser)

router.post("/register", UserController.register)
router.post("/login", UserController.login)
router.get("/profile/:id", chck.auth, UserController.profile)
router.get("/list/:page?", chck.auth, UserController.list)
router.put("/update", chck.auth, UserController.update)
router.post("/upload", [chck.auth, uploads.single("file0")],UserController.upload)
router.get("/avatar/:file", UserController.avatar)
router.get("/counters/:id",chck.auth, UserController.counters)
// Exportar router

module.exports = router