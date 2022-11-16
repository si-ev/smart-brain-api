const redisClient = require('./signin').redisClient;


const requireAuth = (req, res, next) =>  {
    const { authorization } = req.headers;
    if (!authorization){
        return res.status(401).json('Unauthorized');
    }
    console.log("Hi! It's require auth");
    console.log(redisClient);
    redisClient.get(authorization)
    .then(reply => {
        console.log('you shall pass');
        console.log(reply);
        return next();
    })
    .catch(err => console.log(err));
    //return redisClient.get(authorization, (err, reply) => {
    //    if (err || !reply) {
    //        return res.status(401).json('Unauthorized');
    //    }
    //    console.log('you shall pass');
    //    return next();
    //});
};

module.exports = {
    requireAuth: requireAuth,
}
