const express = require("express");
const app = express();
const exphbs = require("express-handlebars");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const expressFileUpload = require('express-fileupload');
const { v4: uuidv4 } = require('uuid')

const enviar = require('./mailer')
const { nuevousuario, getusuarios, editvalidor} = require("./consultas");

app.listen(3003, () => {
    console.log("El servidor está inicializado en el puerto 3003");
});

const secretKey = 'Mi Llave Ultra Secreta'
const jwt = require('jsonwebtoken')
app.use( expressFileUpload({
    limits: { fileSize: 5000000 },
    abortOnLimit: true,
    responseOnLimit: "El peso del archivo que intentas subir supera el limite permitido",
    })
);
app.engine(
    "handlebars",
    exphbs({
        layoutsDir: __dirname + "/views",
        partialsDir: __dirname + "/views/componentes/",
    })
);
app.set("view engine", "handlebars");

app.use("/css", express.static(__dirname +
    "/node_modules/bootstrap/dist/css"));
app.use('/jquery', express.static(__dirname +
    '/node_modules/jquery/dist'))
app.use('/axios', express.static(__dirname +
    '/node_modules/axios/dist'))

app.get("/", function (req, res) {
    res.render("Inicio", {
        layout: "Inicio",
        urlhome: req.route.path
    });
});
app.get("/login", function (req, res) {
    res.render("Inicio", {
        layout: "Inicio",
        urllogin: req.route.path
    });
});
app.get("/admin", function (req, res) {
    res.render("Inicio", {
        layout: "Inicio",
        urladmin: req.route.path
    });
});
app.get("/evidencias/:correo", async function(req,res){
    const { correo } = req.params;
    let seccion = ""
    let url = ""
    const registros = await getusuarios();
    const usuario = registros.find((u) => u.email == correo);
    if(usuario){
        seccion = usuario.nombre
        url = usuario.email
    }
    if(url != correo){
        res.send("url incorrecto")
    }
    else{
    res.render("Inicio", {
            layout: "Inicio",
            nombre: seccion,
            urlevidencias: req.route.path
        });
    }
});

app.post("/usuario", async (req, res) => {
    const { email, nombre, password } = req.body;
    const registros = await getusuarios();
    const usuario = registros.find((u) => u.email == email);
    if (usuario) {
        res.send("correo existe");
    }
    else if(email && nombre && password){
        const respuesta = await nuevousuario(email, nombre, password);
        let mensaje = `Gracias por registrarte ${nombre}, te enviaremos un correo de confirmacion y autorizacion para subir fotos`
        enviar(email, mensaje)
        res.send(respuesta);
    }
    else {
        res.send("ingrese todos los datos para registrarse");
    }
});

app.get("/usuarios", async (req, res) => {
    const respuesta = await getusuarios();
    res.send(respuesta);
});

app.put("/usuario/:id", async (req, res) => {
    const { id } = req.params;
    const { auth, email, nombre } = req.body;
    let validar = auth
    let mensaje;
    if (validar == true) {
        validar = false
        mensaje = `hola ${nombre}, te enviaremos este correo avisandote que te quitamos la autorizacion para subir fotos`
    }
    else{
        validar = true
        mensaje = `hola ${nombre}, te enviaremos este correo para confirmar y darte autorizacion para subir fotos`
    }
    enviar(email, mensaje)
    const respuesta = await editvalidor(id, validar);
    res.send(respuesta);
});

app.post("/upload", (req, res) => {
    const { foto } = req.files;
    let ID = uuidv4().slice(0, 6)
    foto.mv(`${__dirname}/public/${ID}.jpg`, (err) => {
        res.send(`
            <h1>Muchas gracias por tu foto</h1>
            <input type="submit" value="atras" onclick="atras()">
            <script>
            const secion = localStorage.getItem('email')

            function atras() {
            location.href = "http://localhost:3003/evidencias/"+ secion
            }
            </script>
        `)
    });
});

app.get("/token", async function (req, res) {
    const { email, password } = req.query;
    const registros = await getusuarios();
    const usuario = registros.find((u) => u.email == email)
if(usuario){
    if(usuario.password == password){
        if(usuario.auth == true){
            const token = jwt.sign(usuario, secretKey)
            res.send(token)
            }
            else{
                res.send("en validacion")
            }
    }
    else if (email == "" || password=="" ){
        res.send("ingrese todos los datos para iniciar secion");
    }
    else{
        res.send("contraseña incorrecta")
    }
}
else if (email == "" || password=="" ){
    res.send("ingrese todos los datos para iniciar secion");
}
else{
    res.send("Usuario no existe");
}
});

app.get("/Dashboard", (req, res) => {
    let { token, email } = req.query;
    jwt.verify(token, secretKey, (err, decoded) => {
        if(decoded){
        if(decoded.email == email){
            if(decoded.auth == true){
                res.send("autorizado")
            }
            else{
                console.log("no estas autorizado por auth")
                res.status(401).send(JSON.stringify({
                    error: "401 Unauthorized",
                    message: "no estas autorizado para ingresar",
                }))
            }
        }
        else{
            console.log("no estas autorizado por url")
            res.send("no estas autorizado por url")
        }
    }
    else{
        res.status(401).send(JSON.stringify({
            error: "401 Unauthorized",
            message: err.message,
        }))
    }
    })

});