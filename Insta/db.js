const admin = require("firebase-admin");
const serviceAccount = require("./config/db.config.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://insta-demo-8c693.firebaseio.com"
});


let database = admin.database();

async function getVocalist(userId) {
    return await database.ref(`vocalists/${userId}`).once('value');
}

async function addVocalists(userId, data) {
    await database.ref('vocalists/' + userId).set(data);
}

module.exports = {
    addVocalists,
    getVocalist
};
