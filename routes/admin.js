import express from 'express';
import { connection, db } from '../config/connect.js'
import validar_JWT from '../config/validate.js';
import { newSchedule, reserved } from '../sql/extra_queries.js'
import dateFormat from "dateformat";

const router = express.Router();

//3. NUEVOS HORARIOS admin
router.post('/cinema', async (req, res) => {
  const token = req.header("Authorization")?.split(" ")[1];
  const decoded = validar_JWT(token, res);

  if (decoded && decoded.role == 'admin') {
    let sql = 'INSERT INTO ' + db + '.cinema (name, cinema.rows, cinema.columns, movie, img, init_date, final_date) VALUES (?,?,?,?,?,?,?)'

    if (req.body.name != null || req.body.rows != null, req.body.columns != null || req.body.movie != null || req.body.img != null) {
      try {
        var now = new Date();
        now = now.addDays(1)
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

  if (decoded && decoded.role == 'admin') {

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

    return res.status(403).json({ "message": "Hay reservaciones proximas, no se puede modificar" })
  }
  else {
    return res.status(401).json({ "Go back": "You're not allowed to be here" })
  }

})

//4. Admin Modificar datos de una pelicula
router.put('/movies/:id', (req, res) => {
  const token = req.header("Authorization")?.split(" ")[1];
  const decoded = validar_JWT(token, res);

  if (decoded && decoded.role == 'admin') {
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

  if (decoded && decoded.role == 'admin') {
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

  if (decoded && decoded.role == 'admin') {
    var sql = "Select * from user WHERE estado = 'active'"

    connection.query(sql).then(([rows]) => {
      return res.status(200).json(rows)
    })

  } else {
    return res.status(401).json({ "Go back": "You're not allowed to be here" })
  }
})

//Mostrar todas las salas al administrador
router.get('/cinema', (req, res) => {
  const token = req.header("Authorization")?.split(" ")[1];
  const decoded = validar_JWT(token, res);
  if (decoded && decoded.role == 'admin') {
    var sql = "Select * from cinema order by id DESC"
    try {
      connection.query(sql).then(([rows]) => {
        return res.status(200).json(rows)
      })
    } catch (err) {
      res.status(400)
      return console.log(err)
    }
  }
});

//Eliminar sala y funciones si no hay guardado
router.delete('/cinema/:id', (req, res) => {
  const token = req.header("Authorization")?.split(" ")[1];
  const decoded = validar_JWT(token, res);
  var del = false;
  var sql = '';

  try {
    const id = parseInt(req.params.id);

    if (decoded && decoded.role == 'admin') {
      //get all ids 
      sql = "Select Count(seats.id) as 'Reserved' from seats INNER JOIN " + db + ".schedule ON " + db + ".schedule.id = seats.id_schedule INNER JOIN " + db + ".cinema ON " + db + ".cinema.id = " + db + ".schedule.id_cinema WHERE " + db + ".schedule.id_cinema=?"

      connection.query(sql, [id])
        .then(([[rows]]) => {
          console.log(rows.Reserved)

          if (rows.Reserved == 0) {
            del = true
          }
        }).finally(() => {
          if (del) {
            sql = 'DELETE FROM schedule where id_cinema = ?'

            connection.query(sql, [id]).then(([rows]) => {
              console.log('DELETED SCHEDULES');
            }).finally(() => {

              sql = 'DELETE FROM cinema where id = ?'
              connection.query(sql, [id]).then(([rows]) => {
                console.log('DELETED FROM CINEMA')
              }).finally(() => {
                return res.status(200).json({ "message": "Todos los registros fueron eliminados" })
              })

            })

          } else {
            return res.status(403).json({ "message": "No se puede eliminar la sala, tiene registros en reservación" })
          }
        })


    }
  } catch (error) {
    res.status(400)
    return console.log(err)
  }
});



Date.prototype.addDays = function (days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
}

export default router;