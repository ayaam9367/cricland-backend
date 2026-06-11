const bcrypt = require('bcrypt');
const { models } = require('mongoose');
const { getAllMatches } = require('../storeData/storeMatchData');
const Tournamenttl = require("../../Models/tournament");


async function hashpassword(password) {
    const saltround = 10
    const hashpw = await bcrypt.hash(password , saltround)
    return hashpw
}

async function verifyPassword(inputpassword , hashpassword) {
    const match = await bcrypt.compare(inputpassword , hashpassword )
    return match
}


async function runGetAllMatchesIfNotExists(cid) {
    try {
      const existingTournament = await Tournamenttl.findOne({ cid });
  
      if (existingTournament) {
        console.log(`Tournament with cid ${cid} already exists. Skipping fetch.`);
        return existingTournament.matchs || [];
      }
      return await getAllMatches(cid);
    } catch (err) {
      console.error("Error checking tournament existence:", err);
      throw err;
    }
  }
  



module.exports = {
    hashpassword,
    verifyPassword,
    runGetAllMatchesIfNotExists
}