const express = require("express")
const router = express.Router()
const FollowController = require("../controllers/follow")
const chck = require("../middlewares/auth")

// Definir rutas

router.get("/prueba-follow", FollowController.pruebaFollow)

router.post("/save",chck.auth,FollowController.saveFollow)
router.delete("/unfollow/:id",chck.auth,FollowController.unFollow)
router.get("/following/:id?/:page?", chck.auth,FollowController.following)
router.get("/followers/:id?/:page?",chck.auth, FollowController.followers)

// Exportar router

module.exports = router