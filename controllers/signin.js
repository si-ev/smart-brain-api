const jwt = require('jsonwebtoken');
const redis = require('redis');

// setup Redis;

const redisClient = redis.createClient({
    url: 'redis://redis:6379'
});


(async () => {
    try{
        await redisClient.connect();
        console.log('connected');
   } catch (err) {
        console.error(err);
   }
})();


const handleSignin = (db, bcrypt, req, res) => {
  const { email, password } = req.body;
  console.log('handleSignin');
  if (!email || !password) {
    return Promise.reject('incorrect form submission');
  }
  return db.select('email', 'hash').from('login')
    .where('email', '=', email)
    .then(data => {
      console.log('data recieved ', data);
      const isValid = bcrypt.compareSync(password, data[0].hash);
      if (isValid) {
        console.log('isValid');
        return db.select('*').from('users')
          .where('email', '=', email)
          .then(user =>  user[0])
          .catch(err => res.status(400).json('unable to get user'))
      } else {
        console.log('WRONG CREDENTIALS');
        return Promise.reject('wrong credentials');
      }
    })
    .catch(err =>  {
        console.log('HandleSignin external catch', err);
        return Promise.reject(err)
    }) //DB Error
}

const getAuthTokenId = (req, res) => {
    const { authorization } = req.headers;
    return redisClient.get(authorization, (err, reply) => {
        if (err || !reply){
            return res.status(400).json('Unauthorized');
        }
        return res.json({id: reply});
    });
}

const signToken = (email) => {
    const jwtPayload = { email };
    // TODO: hide JWT token inside env
    return jwt.sign(jwtPayload, 'JWT_SECRET', { expiresIn: '2 days'});
}


const setToken = (key, value) => {
    return Promise.resolve(redisClient.set(key, value));
}

const createSessions = (user) => {
    // JWT token, return user data
    const { email, id } = user;
    const token = signToken(email); 
    console.log('createSessions');
    console.log(token);
    return setToken(token, id)
        .then(() => { 
            console.log('Token is set');
            return { success: 'true', userId: id, token }
         })
        .catch(err => console.error(err));
}

const signinAuthentication = (db, bcrypt) => (req, res) => {
    const { authorization } = req.headers;
    console.log('signinAuthentication, authorization = ', authorization);
    return authorization ? 
        getAuthTokenId(req, res) : 
        handleSignin(db, bcrypt, req, res).then(data => { 
                console.log('Data ', data, typeof(data));
                console.log('data.id', data.id);
                console.log('data.email', data.email);
                return data.id && data.email ? 
                    createSessions(data) : 
                    Promise.reject(data);
             })
            .then(session => res.json(session))
            .catch(err => {
                console.log('Processing error');
                console.log(err);
                res.status(400).json(err)
            })
}

module.exports = {
    signinAuthentication: signinAuthentication,
    redisClient: redisClient,
}
