const jwt = require('jsonwebtoken')

const authenticateToken = (req,res,next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if(!token) return res.sendStatus(401)
    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,email) => {
        if(err) return res.sendStatus(403)
        res.authenticatedEmail = email
        next()
    })
}
const generateAccessToken = email => {
    return jwt.sign(email,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'10m'})
}

const generateRefreshToken = email => {
    return jwt.sign(email,process.env.REFRESH_TOKEN)
}


module.exports={authenticateToken,generateAccessToken,generateRefreshToken}