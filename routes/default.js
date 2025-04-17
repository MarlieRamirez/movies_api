import express from 'express';
import validar_JWT from '../config/validate.js';
import { connection } from '../config/connect.js';
import dateFormat from "dateformat";

const router = express.Router();

//obtener salas que todavia no han vencido
router.get('/cinema', (req, res) => {
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

router.get('/cinema/:id', (req, res) => {
  var sql = "Select * from cinema WHERE id >= ?"
  try {
      connection.query(sql, [req.params.id]).then(([rows]) => {
          return res.status(200).json(rows[0])
      })
  } catch (err) {
      res.status(400)
      return console.log(err)
  }
});


router.get('/schedule', (req, res) => {
    const sql = "SELECT * FROM movie_theather.schedule WHERE date >= ? AND id_cinema = ?"

    const unformatted = new Date();

    const today = dateFormat(unformatted, "yyyy-mm-dd");

    try {
        if(req.query.id == null){
            return res.status(400).json({ "message": "Bad request" })
        }
        
        connection.query(sql, [today, parseInt(req.query.id)]).then(([rows]) => {
            return res.status(200).json(rows)
        })
    } catch (err) {
        res.status(400)
        return console.log(err)
    }
})

// 7. GET SEATS
router.get('/seats', (req, res) => {
    var sql = "SELECT * FROM movie_theather.seats WHERE id_schedule = ?"

    try {
        if (req.query.id != null) {
            connection.query(sql, [parseInt(req.query.id)]).then(([rows]) => {
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
router.post('/seats', (req, res) => {
    const token = req.header("Authorization")?.split(" ")[1];
    const decoded = validar_JWT(token, res);

    if (decoded.role == undefined) {
        return res.status(401).json({ "Go back": "You're not allowed to be here" })
    }

    const sql = 'INSERT INTO movie_theather.seats (full_name, seats.column, seats.row, id_user, id_schedule) VALUES (?,?,?,?,?)'

    try {
        if (req.body.full_name != null || req.body.column != null || req.body.rows != null || req.body.id_schedule) {
            connection.query(sql, [req.body.full_name, req.body.column, req.body.rows, decoded.id, req.body.id_schedule]).then(() => {
                return res.status(200).json({ "message": "Reservación completada" });
            })
        }

    } catch (err) {
        return console.log(err)
    }
})

// Obtener todas las reservaciones del usuario
router.get('/reservations', (req, res) => {
  const token = req.header("Authorization")?.split(" ")[1];
  const decoded = validar_JWT(token, res);

  if (decoded.role == undefined) {
      return res.status(401).json({ "Go back": "You're not allowed to be here" })
  }

  const sql = 'SELECT * FROM seats WHERE id_user = ?'
  
  try {
    connection.query(sql, [decoded.id]).then(([rows]) => {
      return res.status(200).json(rows);
    })
  } catch (err) {
      return console.log(err)
  }
});


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
    return dateFormat(new Date(), "yyyy-mm-dd")
}
//LOGOUT DESDE FE
export default router;