const { Pool } = require("pg");
const pool = new Pool({
    user: "chris",
    host: "localhost",
    database: "nasa",
    password: "chris1997",
    port: 5432,
});

async function nuevousuario(email, nombre, password) {
try {
const result = await pool.query(
`INSERT INTO usuarios (email, nombre, password, auth) values ('${email}', '${nombre}', '${password}', 'false') RETURNING *`
);
return result.rows;
} catch (e) {
console.log(e);
return e;
}
}

async function getusuarios() {
try {
const result = await pool.query(`SELECT * FROM usuarios ORDER BY id`);
return result.rows;
} catch (e) {
console.log(e);
return e;
}
}

async function editvalidor(id, auth) {
try {
const res = await pool.query(
`UPDATE usuarios SET auth = '${auth}' WHERE id = '${id}'
RETURNING *` 
);
return res.rows;
} catch (e) {
console.log(e);
return e;
}
} 

module.exports = {nuevousuario, getusuarios, editvalidor}