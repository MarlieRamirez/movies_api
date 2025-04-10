// routes.js
import express from 'express';
import { new_token, checked } from '../config/token.js'
import jwt from 'jsonwebtoken';
import { connection } from '../config/connect.js'
import * as dotenv from 'dotenv'
import validar_JWT from '../config/validate.js';
import dateFormat from "dateformat";


dotenv.config();
const router = express.Router();
const secret = process.env.ACCESS_TOKEN_SECRET;

router.post('/login', (req, res) => {
    const sql = "Select * from user where user_name = ? AND estado ='active'";

    try {
        connection.query(sql, [req.body.user_name]).then(([rows]) => {

            if (rows.length == 0) {
                return res.status(404).json({ "message": "Usuario no encontrado" })
            }

            const user = rows[0]
            if (checked(req.body.pwd, user.token)) {
                const accessToken = jwt.sign(user, secret,{expiresIn: '15min'})
                res.json({ accessToken: accessToken })

            } else {
                return res.status(404).json({ "message": "Usuario no encontrado" })
            }
        })
    } catch (error) {
        console.log(error)
    }


});

router.get('/', (req, res) => {
    const token = req.header("Authorization")?.split(" ")[1];
    const decoded = validar_JWT(token, res);
    res.json(decoded)
})

router.post('/new', (req, res) => {
    const generated_token = new_token(req.body.pwd);

    var sql = "Insert into user (user_name, email, token, created_at, role)values(?,?, ?, ?, 'guest')";

    try {
        connection.query(sql, [req.body.user_name, req.body.email, generated_token, now()]).then(() => {
            return res.status(200).json({ "message": "Usuario creado" })
        }).catch((error)=>{
          if(error.errno	=='1062'){
            return res.status(500).json({"message": "Base de datos"})  
          }
          return error
        })
    } catch (err) {
        res.status(400).json({ "message": err.code })
        return console.log(err)
    }
})

function now() {
    return dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss")
}

export default router;

