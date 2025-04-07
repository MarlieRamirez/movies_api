import express from 'express';
import { connection } from '../config/connect.js'
import validar_JWT from '../config/validate.js';
import { newSchedule, reserved } from '../sql/extra_queries.js'
import dateFormat from "dateformat";

const router = express.Router();

//3. NUEVOS HORARIOS admin
router.post('/cinema', async (req, res) => {
  const token = req.header("Authorization")?.split(" ")[1];
  const decoded = validar_JWT(token, res);

  if (decoded.role == 'admin') {
    let sql = 'INSERT INTO movie_theather.cinema (name, cinema.rows, cinema.columns, movie, img, init_date, final_date) VALUES (?,?,?,?,?,?,?)'

    if (req.body.name != null || req.body.rows != null, req.body.columns != null || req.body.movie != null || req.body.img != null) {
      try {
        var now = new Date();
        connection.query(sql, [req.body.name, req.body.rows, req.body.columns, req.body.movie, req.body.img, dateFormat(now, "yyyy-mm-dd"), dateFormat(now.addDays(8), "yyyy-mm-dd")]).then(async ([result]) => {
          const id = result['insertId'];


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
//5. Modificar capacidad de una sala
router.put('/cinema/:id', async (req, res) => {
  const token = req.header("Authorization")?.split(" ")[1];
  const decoded = validar_JWT(token, res);

  const id = parseInt(req.params.id);
  var reservations = 0;

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

//4. Admin Modificar datos de una pelicula
router.put('/movies/:id', (req, res) => {
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

//8. Dar de baja a usuario (borrado logico)
router.delete('/user/:id', (req, res) => {
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

router.get('/users', (req, res) => {
  const token = req.header("Authorization")?.split(" ")[1];
  const decoded = validar_JWT(token, res);

  if (decoded.role == 'admin') {
    var sql = "Select * from user WHERE estado = 'active'"

    connection.query(sql).then(([rows]) => {
      return res.status(200).json(rows)
    })

  } else {
    return res.status(401).json({ "Go back": "You're not allowed to be here" })
  }
})

Date.prototype.addDays = function (days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
}

export default router;