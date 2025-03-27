import express from 'express';
import jwt from 'jsonwebtoken';
import { connection } from './config/connect.js'
import * as dotenv from 'dotenv'
import dateFormat from "dateformat";
import userRoutes from "./routes/user.js"
import adminRoutes from "./routes/admin.js"
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';


dotenv.config();
const app = express()
const secret = process.env.ACCESS_TOKEN_SECRET;
const swaggerDocument = YAML.load('swagger.yml');

app.use(express.json())
app.use('/user', userRoutes);
app.use('/admin', adminRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

//UNDEFINED PURPOSE
//obtener salas guest
app.get('/cinema', (req, res) => {
    const token = req.header("Authorization")?.split(" ")[1];
    const decoded = validar_JWT(token, res);

    if (decoded.role == undefined) {
        return res.status(401).json({ "Go back": "You're not allowed to be here" })
    }

    var sql = "Select * from cinema WHERE final_date >= ?"
    try {
        connection.query(sql, [now()]).then(([rows]) => {
            return res.status(200).json(rows)
        })
    } catch (err) {
        res.status(400)
        return console.log(err)
    }
});

// Solo genera las siguientes 8 fechas
app.get('/dates', (req, res) => {
    var now = new Date();
    const list = []
    for (var i = 0; i < 9; i++) {

        list.push(now);
        now = now.addDays(1);
    }
    console.log(JSON.parse(JSON.stringify({ "dates": list })));
    return res.status(200).json({ "dates": list })
})

//FE mostrar card con {del 'dia_inicio' hasta el 'dia_final'} ?? 
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

    if (decoded.role == undefined) {
        return res.status(401).json({ "Go back": "You're not allowed to be here" })
    }

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
})


//9. LOGOUT desde BE solo necesita el timing
app.listen(3001, () => {
    console.log("Servidor corriendo en 3001")
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

//swagger

// Swagger setup
