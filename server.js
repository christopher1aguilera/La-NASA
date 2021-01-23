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
let secion = []
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
    res.render("Home", {
    layout: "Home"
    });
});
app.get("/login", function (req, res) {
    res.render("Login", {
    layout: "Login"
    });
});
app.get("/admin", function (req, res) {
    res.render("Admin", {
    layout: "Admin"
    });
});
app.get("/evidencias", async function (req, res) {
    res.render("Evidencias", {
    layout: "Evidencias",
    nombre: secion[0]
    });
});

app.post("/usuario", async (req, res) => {
    const { email, nombre, password } = req.body;
    const registros = await getusuarios();
    const usuario = registros.find((u) => u.email == email);
    if (usuario) {
        console.log("correo existe")
res.send("correo existe");
} else if(email && nombre && password){
    const respuesta = await nuevousuario(email, nombre, password);
    let mensaje = `Gracias por registrarte ${nombre}, te enviaremos un correo de confirmacion y autorizacion para subir fotos`
    enviar(email, mensaje)
    res.send(respuesta);
    res.redirect("/login")
} else {
    console.log("ingrese todos los datos para registrarse")
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
    console.log(email)
    if (validar == true) {
        validar = false
        let mensaje = `hola ${nombre}, te enviaremos este correo avisandote que te quitamos la autorizacion para subir fotos`
        enviar(email, mensaje)
    }
    else{
        validar = true
        let mensaje = `hola ${nombre}, te enviaremos este correo para confirmar y darte autorizacion para subir fotos`
        enviar(email, mensaje)
    }
    const respuesta = await editvalidor(id, validar);
    res.send(respuesta);
});

app.get("/token", async function (req, res) {
    const { email, password } = req.query;
    const registros = await getusuarios();
    const usuario = registros.find((u) => u.email == email && u.password ==
    password);
    if(usuario.auth == true){
    if (usuario) {
        const token = jwt.sign(usuario, secretKey)
secion.push(usuario.nombre)
res.send(token)
} else if(email == "" || password=="" ){
    console.log("ingrese todos los datos para iniciar secion")
    res.send("ingrese todos los datos para iniciar secion");
} else {
console.log("adios")
res.send("Usuario o contraseña incorrecta");
}
}
else{
    console.log("en validacion")
    res.send("en validacion")
}
});

app.post("/upload", (req, res) => {
    const { foto } = req.files;
    let ID = uuidv4().slice(0, 6)
    foto.mv(`${__dirname}/public/${ID}.jpg`, (err) => {
    res.send(`
    <h1>Muchas gracias por tu foto</h1>
    <form id="atras" action="/evidencias">
  <input type="submit" value="atras">
</form>
    `)
    });
});

app.get("/Dashboard", (req, res) => {
    let { token } = req.query;
    jwt.verify(token, secretKey, (err, decoded) => {
    err
    ? res.status(401).send(JSON.stringify({
    error: "401 Unauthorized",
    message: err.message,
    }))
    :
    res.send("autorizado")
    // res.send(`
    // Bienvenido al Dashboard ${decoded.data}
    // `);
    });
    });