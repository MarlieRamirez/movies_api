import {connection} from '../connect.js'
import dateFormat from "dateformat";

export const reserved = (id)=>{

    const sql = "Select Count(seats.id) as 'Reserved' from seats INNER JOIN movie_theather.schedule ON movie_theather.schedule.id = seats.id_schedule INNER JOIN movie_theather.cinema ON movie_theather.cinema.id = movie_theather.schedule.id_cinema WHERE movie_theather.schedule.id_cinema=? AND movie_theather.schedule.date between ? AND ?"
    const unformatted = new Date();
    
    const today = dateFormat(unformatted,"yyyy-mm-dd");
    const after = dateFormat(unformatted.addDays(8),"yyyy-mm-dd")
    
    
    const reservations = connection.query(sql, [id, today, after]).then(([[response]])=>{
        console.log(response.Reserved)
        return response.Reserved
    })
    
    return reservations
}

// export const updated = async (cinema) => {
//     try {
//         const sql = "UPDATE movie_theather.cinema SET name = ?, rows = ?, columns = ? WHERE `id` = ?;"

//         const result = await connection.query(sql, [cinema.name, cinema.rows, cinema.columns, cinema.id]).then(([response])=>{
//             return response
//         })
//     } catch (error) {
//         console.log(error)
//         return 0
//     }
// }

//Operations
Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}