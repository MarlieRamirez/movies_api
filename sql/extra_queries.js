import { connection, db } from '../config/connect.js'
import dateFormat from "dateformat";

export const reserved = (id) => {

    const sql = "Select Count(seats.id) as 'Reserved' from seats INNER JOIN "+db+".schedule ON "+db+".schedule.id = seats.id_schedule INNER JOIN "+db+".cinema ON "+db+".cinema.id = "+db+".schedule.id_cinema WHERE "+db+".schedule.id_cinema=? AND "+db+".schedule.date between ? AND ?"
    const unformatted = new Date();

    const today = dateFormat(unformatted, "yyyy-mm-dd");
    const after = dateFormat(unformatted.addDays(8), "yyyy-mm-dd")


    const reservations = connection.query(sql, [id, today, after]).then(([[response]]) => {
        console.log(response.Reserved)
        return response.Reserved
    })

    return reservations
}

export const newSchedule = (date, id)=>{
    const sql = "INSERT INTO "+db+".schedule ( date, time, id_cinema) VALUES (?,'10:00 am',?)"
    connection.query(sql, [date, id]).then(()=>{
        return true
    });
    return false
}

//Operations
Date.prototype.addDays = function (days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}