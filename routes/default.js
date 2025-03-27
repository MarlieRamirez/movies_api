import express from 'express';
import validar_JWT from '../config/validate';
import { connection } from '../config/connect';
import dateFormat from "dateformat";

const router = express.Router();

//obtener salas que todavia no han vencido
router.get('/cinema', (req, res) => {
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

router.get('/schedule', (req, res) => {
    const token = req.header("Authorization")?.split(" ")[1];
    const decoded = validar_JWT(token, res);

    if (decoded.role == undefined) {
        res.status(401)
        res.json({ "Go back": "You're not allowed to be here" })
        return
    }
    var sql = "SELECT * FROM movie_theather.schedule WHERE date >= ? AND cinema_id = ?"

    const unformatted = new Date();

    const today = dateFormat(unformatted, "yyyy-mm-dd");

    try {
        if(req.body.id == null){
            return res.status(400).json({ "message": "Bad request" })
        }
        
        connection.query(sql, [today, after]).then(([rows]) => {
            return res.status(200).json(rows)
        })
    } catch (err) {
        res.status(400)
        return console.log(err)
    }
})

// 7. GET SEATS
router.get('/seats', (req, res) => {
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
        }else{
            return res.status(400).json({ "message": "Bad request" })
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

// Solo genera las siguientes 8 fechas (puede ser inutil)
router.get('/dates', (req, res) => {
    var now = new Date();
    const list = []
    for (var i = 0; i < 9; i++) {

        list.push(now);
        now = now.addDays(1);
    }
    console.log(JSON.parse(JSON.stringify({ "dates": list })));
    return res.status(200).json({ "dates": list })
})

//Operations
Date.prototype.addDays = function (days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

function now() {
    return dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss")
}
//LOGOUT DESDE FE
export default router;