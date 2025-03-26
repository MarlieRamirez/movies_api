
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

export default validar_JWT;