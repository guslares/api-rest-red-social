// Importar dependecias

const connection = require("./database/connection")
const express = require("express")
const cors = require("cors")

// Mensaje de bienvenida
console.log("Api NODE para red social iniciada")

// Conexión a bbdd
connection()

// Crear servidor node

const app = express()
const port = 3900

// Configurar cors

app.use(cors())

// Convertir los datos del body a objetos js

app.use(express.json())
app.use(express.urlencoded({extended:true}))    

// Cargar configuración de rutas

const UserRoutes = require("./routes/user")
const PublicationRoutes = require("./routes/publication")
const FollowRoutes = require("./routes/follow")

// ruta de prueba
app.use("/api/user",UserRoutes)
app.use("/api/publication",PublicationRoutes)
app.use("/api/follow",FollowRoutes)


app.get("/ruta-prueba", (req,res)=>{
    return res.status(200).json(
        {
            "id":1,
            "nombre": "Gustavo",
            "apellido":"Lares"
        }
    )
})

// Poner servidor a escuchar peticiones http

app.listen(port,()=>{
    console.log("Servidor escuchando en el puerto "+port)
})