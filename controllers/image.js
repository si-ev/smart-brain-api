const Clarifai = require('clarifai');

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const USER_ID = process.env.USER_ID;
const KEY = process.env.KEY;
const APP_ID = process.env.APP_ID;
const MODEL_ID = process.env.MODEL_ID;
const MODEL_VERSION_ID = process.env.MODEL_VERSION_ID;

function handleRequestOptions(imageUrl){
    const raw = JSON.stringify({
         "user_app_id": {
              "user_id": USER_ID,
              "app_id": APP_ID
         },
         "inputs": [
              {
                   "data": {
                        "image" : {
                             "url": imageUrl
                        }
                   }
              }
         ]
    });
    
    const requestOptions = {
         method: 'POST',
         headers: {
              'Accept': 'application/json',
              'Authorization': 'Key ' +  KEY
         },
         body: raw
    };
    return requestOptions
}


const handleApiCall = (req, res) => {
    const imageUrl = req.body.input;
    // HEADS UP! Sometimes the Clarifai Models can be down or not working as they are constantly getting updated.
    // A good way to check if the model you are using is up, is to check them on the clarifai website. For example,
    // forthe Face Detect Mode: https://www.clarifai.com/models/face-detection
    // If that isn't working, then that means you will have to wait until their servers are back up. Another solution
    // is to use a different version of their model that works like the ones found here: https://github.com/Clarifai/clarifai-javascript/blob/master/src/index.js
    // so you would change from:
    // to:
    // .predict('53e1df302c079b3db8a0a36033ed2d15', req.body.input)
    fetch("https://api.clarifai.com/v2/models/" + MODEL_ID + "/versions/" + MODEL_VERSION_ID + "/outputs", handleRequestOptions(imageUrl))
       .then(data => data.json())
       .then(data => res.send(data))
       .catch(err => console.log('Error ', err));
    //.then(data => {
    //  res.json(data);
    //})
    //.catch(err => res.status(400).json('unable to work with API'))
}

const handleImage = (req, res, db) => {
  const { id } = req.body;
  db('users').where('id', '=', id)
  .increment('entries', 1)
  .returning('entries')
  .then(entries => {
    // If you are using knex.js version 1.0.0 or higher this now returns an array of objects. Therefore, the code goes from:
    // entries[0] --> this used to return the entries
    // TO
    // entries[0].entries --> this now returns the entries
    res.json(entries[0].entries);
  })
  .catch(err => res.status(400).json('unable to get entries'))
}

module.exports = {
  handleImage,
  handleApiCall
}
