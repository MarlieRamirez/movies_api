import express, { json } from 'express';
import jwt from 'jsonwebtoken';
import { new_token, checked } from './encrypt/token.js'
import { connection } from './connect.js'
import {  newSchedule, reserved } from './sql/extra_queries.js'
import * as dotenv from 'dotenv'
import dateFormat from "dateformat";

dotenv.config();

const app = express()
app.use(express.json())
const secret = process.env.ACCESS_TOKEN_SECRET;
//1. LOGIN
app.post('/login', (req, res) => {
    const sql = "Select * from user where user_name = ? AND estado ='active'";

    try {
        connection.query(sql, [req.body.user_name]).then(([rows]) => {

            if (rows.length == 0) {
                return res.status(404).json({ "message": "Usuario no encontrado" })
            }

            const user = rows[0]
            if (checked(req.body.pwd, user.token)) {
                const accessToken = jwt.sign(user, secret, { expiresIn: '15min' })
                res.json({ accessToken: accessToken })

            } else {
                return res.status(404).json({ "message": "Usuario no encontrado" })
            }
        })
    } catch (error) {
        console.log(error)
    }


});

//info del user
app.get('/user', (req, res) => {
    const token = req.header("Authorization")?.split(" ")[1];
    const decoded = validar_JWT(token, res);
    res.json(decoded)
})

//2.NUEVA CUENTA Cliente o guest
app.post('/user', (req, res) => {
    const generated_token = new_token(req.body.pwd);

    var sql = "Insert into user (user_name, email, token, created_at, role)values(?,?, ?, ?, 'guest')";

    try {
        connection.query(sql, [req.body.user_name, req.body.email, generated_token, now()]).then(() => {
            return res.status(200).json({ "message": "Usuario creado" })
        })
    } catch (err) {
        return console.log(err)
    }
})

//3. NUEVOS HORARIOS
app.post('/cinema', async (req, res) => {
    const token = req.header("Authorization")?.split(" ")[1];
    const decoded = validar_JWT(token, res);

    if (decoded.role == 'admin') {
        let sql = 'INSERT INTO movie_theather.cinema (name, cinema.rows, cinema.columns, movie, img) VALUES (?,?,?,?,?)'

        if (req.body.name != null || req.body.rows != null, req.body.columns != null || req.body.movie != null || req.body.img != null) {
            try {
                connection.query(sql, [req.body.name, req.body.rows, req.body.columns, req.body.movie, req.body.img]).then(async ([result]) => {
                    const id = result['insertId'];
                    var now = new Date();

                    for (var i = 0; i < 9; i++) {
                        newSchedule(now, id);
                        now = now.addDays(1);
                    }

                })
                return res.status(200).json({ "message": "Sala y funciones creadas" })

            } catch (err) {
                return console.log(err)
            }
        } else {
            return res.status(400).json({ "message": "Bad request" })
        }
    }
    else {
        return res.status(401).json({ "Go back": "You're not allowed to be here" })

    }
})

//4. Admin Modificar datos de una pelicula
app.put('/movies/:id', (req, res) => {
    const token = req.header("Authorization")?.split(" ")[1];
    const decoded = validar_JWT(token, res);

    if (decoded.role == 'admin') {
        var sql = "UPDATE cinema SET `movie`=? ,`img`=? WHERE id=?"

        try {
            const id = parseInt(req.params.id);
            if (req.body.movie != null || req.body.img != null || id != null) {
                connection.query(sql, [req.body.movie, req.body.img, id]).then(([rows]) => {
                    return res.status(200).json({ "message": "Película modificada de la sala" });
                })
            } else {
                return res.status(400).json({ "message": "Bad request" })
            }

        } catch (err) {
            res.status(400)
            return console.log(err)
        }
    }
    else {
        return res.status(401).json({ "Go back": "You're not allowed to be here" })
    }
})

//obtener salas
app.get('/cinema', (req, res) => {
    const token = req.header("Authorization")?.split(" ")[1];
    const decoded = validar_JWT(token, res);

    if (decoded.role == undefined) {
        return res.status(401).json({ "Go back": "You're not allowed to be here" })
    }

    var sql = "Select * from cinema"
    try {
        connection.query(sql).then(([rows]) => {
            return res.status(200).json(rows)
        })
    } catch (err) {
        res.status(400)
        return console.log(err)
    }
});

//5. Modificar capacidad de una sala
app.put('/cinema/:id', async (req, res) => {
    const token = req.header("Authorization")?.split(" ")[1];
    const decoded = validar_JWT(token, res);

    const id = parseInt(req.params.id);
    const reservations = 0;

    if (decoded.role == 'admin') {

        if (typeof id == 'number') {
            reservations = await reserved(id)
        } else {
            return res.status(400).json({ "message": "Bad request" })
        }

        if (typeof reservations != 'number') {
            return res.status(400)
        }

        if (reservations == 0) {
            try {
                var sql = "Update cinema set cinema.rows = ?, cinema.columns=? where id=?"

                if (req.body.rows != null || req.body.columns != null) {
                    await connection.query(sql, [req.body.rows, req.body.columns, id]).then(([rows]) => {
                        console.log(rows)
                        // return res.status(200).send("Todo bien"); 
                    })
                } else {
                    return res.status(400).json({ "message": "Bad request" })
                }
            } catch (error) {
                console.log(error)
                return res.status(400)

            }
            return res.status(200).json({ "message": "Se ha modificado la capacidad" });
        }

        return res.json({ "message": "Hay reservaciones proximas, no se puede modificar" })
    }
    else {
        return res.status(401).json({ "Go back": "You're not allowed to be here" })
    }

})

//6. Cartelera siguientes 8 dias
app.get('/dates', (req, res) => {
    var now = new Date();
    const list = []
    for (var i = 0; i < 9; i++) {
        
        list.push(now);
        now = now.addDays(1);
    }
    console.log(JSON.parse(JSON.stringify({"dates": list})));
    return res.status(200).json({"dates": list})
})
//FE mostrar card con {del 'dia_inicio' hasta el 'dia_final'}
//BE recolecta todos dentro de 8 dias a futuro
app.get('/schedule', (req, res) => {
    const token = req.header("Authorization")?.split(" ")[1];
    const decoded = validar_JWT(token, res);

    if (decoded.role == undefined) {
        res.status(401)
        res.json({ "Go back": "You're not allowed to be here" })
        return
    }
    var sql = "SELECT * FROM movie_theather.schedule WHERE date BETWEEN ? AND ?"

    const unformatted = new Date();

    const today = dateFormat(unformatted, "yyyy-mm-dd");
    const after = dateFormat(unformatted.addDays(8), "yyyy-mm-dd")

    try {
        connection.query(sql, [today, after]).then(([rows]) => {
            return res.status(200).json(rows)
        })
    } catch (err) {
        res.status(400)
        return console.log(err)
    }
})

//7.
/*
1. Mostrar la cartelera de horarios
2. Butacas de cine (get seats where schedule)
3. Seleccionar butaca vacia (frontend)
4. Cambiar color de los asientos seleccionados (Frontend)
5. Simular compra (no necesito guardar la compra FE)
6. Al final de compra se ingresa las butacas (post seat)
7. Generar QR de info de butacas, fecha y sala (FE)
*/

// 7. GET SEATS
app.get('/seats', (req, res) => {
    const token = req.header("Authorization")?.split(" ")[1];
    const decoded = validar_JWT(token, res);

    if (decoded.role == undefined) {
        return res.status(401).json({ "Go back": "You're not allowed to be here" })
    }
    var sql = "SELECT * FROM movie_theather.seats WHERE id_schedule = ?"

    try {
        if (req.body.id != null) {
            connection.query(sql, [req.body.id]).then(([rows]) => {
                return res.status(200).json(rows)
            })
        }
    } catch (err) {
        res.status(400)
        return console.log(err)
    }
})

// 7. POST SEATS
// full name se genera desde FE 
app.post('/seats', (req, res) => {
    const token = req.header("Authorization")?.split(" ")[1];
    const decoded = validar_JWT(token, res);

    if (decoded.role == 'admin') {
        const sql = 'INSERT INTO movie_theather.seats (full_name, seats.columns, seats.rows, id_user, id_schedule) VALUES (?,?,?,?,?)'

        try {
            if (req.body.full_name != null || req.body.columns != null || req.body.rows != null || req.body.id_schedule) {
                connection.query(sql, [req.body.full_name, req.body.columns, req.body.rows, decoded.id, req.body.id_schedule]).then(() => {
                    return res.status(200).json({ "message": "Reservación completada" });
                })
            }

        } catch (err) {
            return console.log(err)
        }
    }
    else {
        return res.status(401).json({ "Go back": "You're not allowed to be here" })

    }
})

//8. Dar de baja a usuario (borrado logico)
app.delete('/user/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const token = req.header("Authorization")?.split(" ")[1];
    const decoded = validar_JWT(token, res);

    if (decoded.role == 'admin') {
        var sql = "UPDATE user set estado='inactive' where id = ?"

        connection.query(sql, [id]).then(([rows]) => {
            return res.status(200).json({ "message": "Usuario desactivado" });
        })

    } else {
        return res.status(401).json({ "Go back": "You're not allowed to be here" })
    }
})
//9. LOGOUT desde BE solo necesita el timing

app.listen(3000, () => {
    console.log("Servidor corriendo en 3000")
})

//Operations
Date.prototype.addDays = function (days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

function validar_JWT(token, res) {
    if (!token) return res.status(401).json({ error: "Acceso Denegado" });

    try {
        const decoded = jwt.verify(token, secret)

        //Validar tiempo de expiración
        if (decoded.exp < Math.floor(Date.now() / 1000)) {
            console.log("Ya expiro", decoded.exp)
            return res.status(401).json({ error: "Este token ha expirado" })
        }

        return decoded;

    } catch (error) {
        console.log("error catch", error.message);

        //Wrong secret
        if (error.message == 'invalid signature') {
            return res.status(401).json({ error: "Decodification gone wrong" })
        }
        //Regular error
        res.status(401).json({ error: "Token invalido" })
    }
}

function now() {
    return dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss")
}